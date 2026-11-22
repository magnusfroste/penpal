'use strict';
// PenPal – a handwriting coach for school children. A child photographs their handwriting, the
// AI answers like a kind teacher with a rubric and three small missions, the child practises and
// scans again, and the app shows what got better. Accounts, HTTP and the model call live in
// lib/core.js; this file is the app: scans, their pictures, progress and the game.

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { app, db, tx, ai, HttpError, limit, parseImage, now, today, DATA_DIR } = require('./lib/core');
const { DIM_KEYS } = require('./lib/rubric');
const { buildPrompt, normalize } = require('./lib/analysis');
const { demoAnswer } = require('./lib/demo');
const { computeGame, earnedBy } = require('./lib/game');

const UPLOADS = path.join(DATA_DIR, 'uploads');
const MAX_SCANS_PER_DAY = 30;        // saved scans per child and day, with or without AI
const MAX_SCANS = 500;               // per child in all – the disk is shared

app.migrate([
  `CREATE TABLE scans (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     created_at TEXT NOT NULL,
     day TEXT NOT NULL,                 -- the local day (Europe/Stockholm), for the streak
     image_file TEXT NOT NULL,          -- file name under uploads/<user_id>/
     image_mime TEXT NOT NULL,
     thumb_file TEXT,
     image_hash TEXT NOT NULL,
     score INTEGER NOT NULL,            -- 20–100, computed here from the five dimension scores
     analysis TEXT NOT NULL,            -- JSON, the normalized rubric (lib/analysis.js)
     review TEXT,                       -- JSON, "Sedan sist": compared with prev_id; NULL for a first scan
     prev_id INTEGER,
     demo INTEGER NOT NULL DEFAULT 0,   -- 1 = example answer, no AI looked at the picture
     model TEXT
   );
   CREATE INDEX scans_user ON scans(user_id, id);`,
]);

// ---------------------------------------------------------------- helpers

// Streaks follow the child's day, not UTC: a scan at 00:30 Swedish time belongs to the new day.
let dayFormat;
try {
  dayFormat = new Intl.DateTimeFormat('sv-SE', { timeZone: process.env.APP_TIMEZONE || 'Europe/Stockholm', year: 'numeric', month: '2-digit', day: '2-digit' });
} catch (e) { dayFormat = null; }
function localDay() {
  const d = dayFormat ? dayFormat.format(new Date()) : '';
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : today();
}

const MIME = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
const userDir = (userId) => path.join(UPLOADS, String(Number(userId)));

/** The real type of the bytes – the data URL's own label is not trusted. */
function sniff(buf) {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { mime: 'image/jpeg', ext: 'jpg' };
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { mime: 'image/png', ext: 'png' };
  if (buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP') return { mime: 'image/webp', ext: 'webp' };
  return null;
}

function removeFiles(userId, ...names) {
  for (const name of names) {
    if (name) fs.rmSync(path.join(userDir(userId), path.basename(name)), { force: true });
  }
}

const parseRow = (r) => ({ ...r, analysis: JSON.parse(r.analysis), review: r.review ? JSON.parse(r.review) : null });

/** All of a user's scans, oldest first, with the JSON parsed. */
function scansOf(userId) {
  return db.prepare('SELECT * FROM scans WHERE user_id = ? ORDER BY id').all(userId).map(parseRow);
}

function ownScan(req) {
  const id = Number(req.params.id);
  const row = Number.isInteger(id) && id > 0
    ? db.prepare('SELECT * FROM scans WHERE id = ? AND user_id = ?').get(id, req.user.id) : null;
  // Someone else's scan and a scan that does not exist look the same from outside.
  if (!row) throw new HttpError(404, 'Den skanningen finns inte.');
  return parseRow(row);
}

const publicScan = (s) => ({
  id: s.id, created_at: s.created_at, day: s.day, score: s.score, demo: Boolean(s.demo),
  analysis: s.analysis, review: s.review, prev_id: s.prev_id,
});
const scoresOf = (s) => Object.fromEntries(DIM_KEYS.map((k) => [k, s.analysis.dimensions[k].score]));
const summaryOf = (s) => ({ id: s.id, created_at: s.created_at, day: s.day, score: s.score, demo: Boolean(s.demo), dimensions: scoresOf(s) });

// ---------------------------------------------------------------- scans

app.post('/api/scans', { auth: true, maxBody: 6e6 }, async (req) => {
  const userId = req.user.id;
  const image = parseImage(req.body.image);
  const kind = sniff(image.buffer);
  if (!kind) throw new HttpError(400, 'Bilden gick inte att läsa. Ta ett nytt foto och försök igen.');
  let thumb = null;                                    // optional and small; the list falls back to the picture itself
  if (typeof req.body.thumb === 'string') {
    try {
      const t = parseImage(req.body.thumb, 150e3);
      if (sniff(t.buffer)) thumb = { buffer: t.buffer, ext: sniff(t.buffer).ext };
    } catch (e) { /* no thumbnail then */ }
  }

  limit(`scan:${userId}`, 8, 60, 'Oj, det gick fort! Vänta en liten stund och prova igen.');

  const day = localDay();
  const earlier = scansOf(userId);
  if (earlier.length >= MAX_SCANS) {
    throw new HttpError(409, 'Din samling är full. Be en vuxen ta bort några gamla skanningar under Framsteg.');
  }
  if (earlier.filter((s) => s.day === day).length >= MAX_SCANS_PER_DAY) {
    throw new HttpError(429, 'Nu har du skannat massor i dag! Vila handen och kom tillbaka i morgon.');
  }
  const hash = crypto.createHash('sha256').update(image.buffer).digest('hex');
  const demo = !ai.configured();
  if (!demo && earlier.some((s) => s.image_hash === hash)) {
    throw new HttpError(409, 'Den bilden har jag redan sett. Skriv något nytt och ta ett nytt foto!', { code: 'duplicate' });
  }
  const prev = earlier.length ? earlier[earlier.length - 1] : null;

  let raw;
  if (demo) {
    raw = demoAnswer({ index: earlier.length, seed: parseInt(hash.slice(0, 8), 16) });
  } else {
    ai.spend(userId);
    const prompt = buildPrompt(prev);
    raw = await ai.json({ system: prompt.system, user: prompt.user, images: [req.body.image], maxTokens: 1800 });
  }
  const result = normalize(raw, prev, { variant: earlier.length });
  if (result.status !== 'ok') {
    // Not handwriting, or not readable: ask kindly for a new photo. Nothing is saved, no score.
    return { retake: { reason: result.status, message: result.message }, demo };
  }

  const name = crypto.randomBytes(16).toString('hex');
  const imageFile = `${name}.${kind.ext}`;
  const thumbFile = thumb ? `${name}.thumb.${thumb.ext}` : null;
  fs.mkdirSync(userDir(userId), { recursive: true });
  fs.writeFileSync(path.join(userDir(userId), imageFile), image.buffer);
  if (thumb) fs.writeFileSync(path.join(userDir(userId), thumbFile), thumb.buffer);
  let id;
  try {
    id = tx(() => Number(db.prepare(
      `INSERT INTO scans (user_id, created_at, day, image_file, image_mime, thumb_file, image_hash, score, analysis, review, prev_id, demo, model)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      userId, now(), day, imageFile, kind.mime, thumbFile, hash, result.score, JSON.stringify(result.analysis),
      result.review ? JSON.stringify(result.review) : null, prev ? prev.id : null, demo ? 1 : 0, demo ? null : ai.model()).lastInsertRowid));
  } catch (e) {
    removeFiles(userId, imageFile, thumbFile);
    throw e;
  }

  const all = scansOf(userId);
  const scan = all.find((s) => s.id === id);
  const game = computeGame(all, day);
  const before = computeGame(all.filter((s) => s.id !== id), day);
  return { scan: publicScan(scan), earned: earnedBy(before, game), game, demo };
});

/** History, newest first: enough for the list (thumbnail address, date, score). */
app.get('/api/scans', { auth: true }, (req) => ({
  scans: scansOf(req.user.id).reverse().map(summaryOf),
}));

app.get('/api/scans/:id', { auth: true }, (req) => ({ scan: publicScan(ownScan(req)) }));

function sendImage(req, which) {
  const scan = ownScan(req);
  const file = which === 'thumb' && scan.thumb_file ? scan.thumb_file : scan.image_file;
  let buffer;
  try { buffer = fs.readFileSync(path.join(userDir(req.user.id), path.basename(file))); } catch (e) {
    throw new HttpError(404, 'Bilden finns inte kvar.');
  }
  return { buffer, type: MIME[path.extname(file).slice(1)] || 'application/octet-stream' };
}
app.get('/api/scans/:id/image', { auth: true }, (req) => sendImage(req, 'image'));
app.get('/api/scans/:id/thumb', { auth: true }, (req) => sendImage(req, 'thumb'));

/** Remove one scan and its picture. The game is computed from the scans, so its rewards go too. */
app.post('/api/scans/:id/delete', { auth: true }, (req) => {
  const scan = ownScan(req);
  db.prepare('DELETE FROM scans WHERE id = ? AND user_id = ?').run(scan.id, req.user.id);
  removeFiles(req.user.id, scan.image_file, scan.thumb_file);
  return { ok: true };
});

// ---------------------------------------------------------------- progress and the game

/** The curve: every scan's overall score and the five dimension scores, oldest first. */
app.get('/api/progress', { auth: true }, (req) => {
  const points = scansOf(req.user.id).map(summaryOf);
  const first = points[0] || null;
  const latest = points[points.length - 1] || null;
  return {
    points,
    first,
    latest,
    best: points.reduce((b, p) => (!b || p.score > b.score ? p : b), null),
    change: first && latest && points.length > 1 ? {
      score: latest.score - first.score,
      dimensions: Object.fromEntries(DIM_KEYS.map((k) => [k, latest.dimensions[k] - first.dimensions[k]])),
    } : null,
  };
});

/** XP, level, streak, badges, the letter collection and the current missions. */
app.get('/api/game', { auth: true }, (req) => computeGame(scansOf(req.user.id), localDay()));

// ---------------------------------------------------------------- the right to be forgotten

// The rows go with the user (ON DELETE CASCADE); the pictures are files and are removed here.
app.onDeleteUser((userId) => {
  fs.rmSync(userDir(userId), { recursive: true, force: true });
});

app.listen();
