'use strict';
// Walks the whole flow against a real server on a spare port with a temporary DATA_DIR.
// Part 1: demo mode (no AI key) – sign up, scan, scan again and see progress, missions judged,
// progress and game, another child cannot read the first child's scans, restart keeps everything,
// delete removes the files. Part 2: the same server code against a fake OpenAI-compatible
// endpoint – the prompt carries the previous missions, a "not handwriting" answer saves nothing,
// the daily allowance holds. No packages. Run: node test/api-test.js  (exit code 1 on a failure)

const { spawn } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const zlib = require('node:zlib');

const ROOT = path.join(__dirname, '..');
let passed = 0;
let failed = 0;
function check(name, ok, detail) {
  if (ok) { passed++; console.log(`  ok   ${name}`); } else { failed++; console.log(`  FAIL ${name}${detail !== undefined ? ` – ${JSON.stringify(detail).slice(0, 400)}` : ''}`); }
}

function freePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.on('error', reject);
    s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => resolve(port)); });
  });
}

/** A valid PNG of RGB noise (noise does not compress, so it is well over the 1000-byte minimum). */
function png(seed, size = 40) {
  const stride = size * 3 + 1;
  const raw = Buffer.alloc(stride * size);
  let x = seed;
  for (let i = 0; i < raw.length; i++) {
    x = (Math.imul(x, 1103515245) + 12345) & 0x7fffffff;
    raw[i] = i % stride === 0 ? 0 : (x >> 16) & 255;
  }
  const chunk = (type, data) => {
    const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(zlib.crc32(body) >>> 0);
    return Buffer.concat([len, body, crc]);
  };
  const head = Buffer.alloc(13);
  head.writeUInt32BE(size, 0); head.writeUInt32BE(size, 4); head[8] = 8; head[9] = 2;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', head), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
const dataUrl = (buf, mime = 'image/png') => `data:${mime};base64,${buf.toString('base64')}`;

function startServer(env) {
  const child = spawn(process.execPath, ['server.js'], { cwd: ROOT, env: { PATH: process.env.PATH, ...env }, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = '';
  child.stdout.on('data', (d) => { log += d; });
  child.stderr.on('data', (d) => { log += d; });
  return { child, log: () => log };
}
async function waitUp(base) {
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(`${base}/healthz`)).ok) return; } catch (e) { /* not yet */ }
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error('the server did not start');
}
function stop(server) {
  return new Promise((resolve) => { server.child.on('exit', resolve); server.child.kill('SIGTERM'); });
}

/** One browser: keeps its own session cookie. */
function client(base) {
  let cookie = '';
  const call = async (method, p, body, raw) => {
    const res = await fetch(base + p, {
      method,
      headers: { ...(cookie ? { Cookie: cookie } : {}), ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}) },
      body: method === 'POST' ? JSON.stringify(body || {}) : undefined,
    });
    for (const c of res.headers.getSetCookie()) {
      const m = /^sid=([^;]*)/.exec(c);
      if (m) cookie = m[1] ? `sid=${m[1]}` : '';
    }
    if (raw) return { status: res.status, type: res.headers.get('content-type'), buffer: Buffer.from(await res.arrayBuffer()) };
    let json = null;
    try { json = await res.json(); } catch (e) { /* not JSON */ }
    return { status: res.status, json: json || {} };
  };
  return { get: (p) => call('GET', p), post: (p, body) => call('POST', p, body), raw: (p) => call('GET', p, null, true) };
}

const filesIn = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir) : []);
const RESULTS = ['klarat', 'pa_vag', 'inte_an'];
const DIMS = ['shape', 'size', 'spacing', 'line', 'flow'];

// ---------------------------------------------------------------- part 1: demo mode

async function demoMode() {
  console.log('\nDemo mode (no AI key)');
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'penpal-test-'));
  const port = await freePort();
  const base = `http://127.0.0.1:${port}`;
  const env = { DATA_DIR: dataDir, PORT: String(port) };
  let server = startServer(env);
  try {
    await waitUp(base);

    // The page itself
    const page = await fetch(`${base}/`);
    const html = await page.text();
    check('GET / serves the page', page.status === 200 && html.includes('id="app"'));
    const csp = page.headers.get('content-security-policy') || '';
    check("CSP allows scripts from this site and skolappar's snippet only", /script-src 'self' https:\/\/www\.skolappar\.com;/.test(csp));
    check('CSP allows connections to this site and skolappar.com only', /connect-src 'self' https:\/\/www\.skolappar\.com;/.test(csp));
    const snippet = '<script src="https://www.skolappar.com/kotten.js" defer></script>';
    check("the page loads skolappar's usage snippet", html.includes(snippet));
    const scripts = html.match(/<script\b[^>]*>/g) || [];
    check('no inline script in the page', scripts.length > 0 && scripts.every((s) => /\bsrc="(?:\/[^"]+|https:\/\/www\.skolappar\.com\/kotten\.js)"/.test(s)), scripts);
    check('no inline event handlers in the page', !/<[^>]+\son[a-z]+\s*=/i.test(html));
    check("nothing is loaded from another site but skolappar's snippet", !/(?:src|href)\s*=\s*["'](?:https?:)?\/\//i.test(html.replace(snippet, '')));
    for (const f of ['/app.js', '/style.css']) check(`GET ${f}`, (await fetch(base + f)).status === 200);

    const anna = client(base);
    const bo = client(base);
    const nobody = client(base);
    const me0 = await anna.get('/api/me');
    check('signed out: no user, AI not configured', me0.json.user === null && me0.json.ai.configured === false, me0.json);
    check('scans need sign-in (401)', (await nobody.get('/api/scans')).status === 401 && (await nobody.post('/api/scans', { image: dataUrl(png(1)) })).status === 401);

    const signup = await anna.post('/api/auth/signup', { username: 'anna_test', password: 'hemligt123', display_name: 'Anna' });
    check('sign up', signup.status === 200 && signup.json.user.display_name === 'Anna', signup.json);
    const annaId = signup.json.user.id;
    check('a short password is refused', (await bo.post('/api/auth/signup', { username: 'bo_test', password: '123' })).status === 400);
    check('sign up a second child', (await bo.post('/api/auth/signup', { username: 'bo_test', password: 'ocksåhemligt' })).status === 200);

    // Bad pictures (as the second child, to leave the first child's flow clean)
    check('not an image is refused (400)', (await bo.post('/api/scans', { image: 'data:text/html;base64,PGI+aGVqPC9iPg==' })).status === 400);
    check('wrong bytes under an image label are refused (400)', (await bo.post('/api/scans', { image: dataUrl(Buffer.alloc(2000, 65), 'image/jpeg') })).status === 400);
    check('an empty request is refused (400)', (await bo.post('/api/scans', {})).status === 400);
    check('a too large request is refused (413)', (await bo.post('/api/scans', { image: dataUrl(Buffer.alloc(5.5e6, 1)) })).status === 413);
    check('nothing was stored for the bad pictures', (await bo.get('/api/scans')).json.scans.length === 0 && filesIn(path.join(dataDir, 'uploads')).length === 0);

    // First scan
    const img1 = png(11);
    const thumb = png(99, 20);
    const s1 = await anna.post('/api/scans', { image: dataUrl(img1), thumb: dataUrl(thumb) });
    const scan1 = s1.json.scan || {};
    check('first scan is analysed', s1.status === 200 && scan1.id > 0, s1.json);
    check('marked as a demo answer', s1.json.demo === true && scan1.demo === true);
    const a1 = scan1.analysis || { dimensions: {}, missions: [] };
    check('five dimensions with 1–5 and a sentence', DIMS.every((k) => a1.dimensions[k] && a1.dimensions[k].score >= 1 && a1.dimensions[k].score <= 5 && a1.dimensions[k].comment));
    check('overall score = the five scores x 4', scan1.score === DIMS.reduce((n, k) => n + a1.dimensions[k].score, 0) * 4, scan1.score);
    check('exactly three missions', a1.missions.length === 3 && a1.missions.every((m) => m.title && m.instruction && m.trains));
    check('practice letters (max 4) and words (3–5)', a1.practice_letters.length > 0 && a1.practice_letters.length <= 4 && a1.practice_words.length >= 3 && a1.practice_words.length <= 5);
    check('strengths, next steps and tips', a1.strengths.length >= 2 && a1.improvements.length >= 1 && a1.improvements.length <= 3 && a1.tips.length >= 2);
    check('a first scan has no "Sedan sist"', scan1.review === null);
    check('earned: 20 XP and the first badge', s1.json.earned.xp.total === 20 && s1.json.earned.badges.some((b) => b.id === 'first_scan'), s1.json.earned);

    const pic = await anna.raw(`/api/scans/${scan1.id}/image`);
    check('the owner gets the picture back, byte for byte', pic.status === 200 && pic.type === 'image/png' && pic.buffer.equals(img1));
    const userDir = path.join(dataDir, 'uploads', String(annaId));
    check('picture and thumbnail are files under DATA_DIR/uploads/<user>/', filesIn(userDir).length === 2, filesIn(userDir));
    const small = await anna.raw(`/api/scans/${scan1.id}/thumb`);
    check('the thumbnail comes back too', small.status === 200 && small.buffer.equals(thumb));

    // Second scan: progress against the first
    const s2 = await anna.post('/api/scans', { image: dataUrl(png(22)) });
    const scan2 = s2.json.scan || {};
    const r2 = scan2.review || { missions: [], changes: [] };
    check('second scan is analysed', s2.status === 200 && scan2.id > scan1.id, s2.json);
    check('"Sedan sist" compares with the first scan', scan2.prev_id === scan1.id && r2.prev_id === scan1.id && r2.score_from === scan1.score && r2.score_to === scan2.score);
    check('the score went up', scan2.score > scan1.score, [scan1.score, scan2.score]);
    check('a dimension improved, with the numbers', r2.changes.length === 5 && r2.changes.some((c) => c.to > c.from) && r2.changes.every((c) => c.from === a1.dimensions[c.key].score));
    check('the three old missions are judged', r2.missions.length === 3 && r2.missions.every((m, i) => RESULTS.includes(m.result) && m.comment && m.title === a1.missions[i].title), r2.missions);
    check('at least one mission is done', r2.missions.some((m) => m.result === 'klarat'));
    check('what got better is said in a sentence', typeof r2.improved === 'string' && r2.improved.length > 5);
    check('three new missions', scan2.analysis.missions.length === 3);
    check('earned: mission XP, a level and badges', s2.json.earned.xp.missions > 0 && s2.json.earned.level_up && s2.json.earned.badges.some((b) => b.id === 'mission_done'), s2.json.earned);

    // History, progress, game
    const list = await anna.get('/api/scans');
    check('history: two scans, newest first', list.json.scans.length === 2 && list.json.scans[0].id === scan2.id && list.json.scans[0].score === scan2.score);
    const one = await anna.get(`/api/scans/${scan1.id}`);
    check('an old scan can be opened again', one.status === 200 && one.json.scan.analysis.summary === a1.summary);
    const prog = await anna.get('/api/progress');
    check('progress: two points, oldest first, with dimension scores', prog.json.points.length === 2 && prog.json.points[0].id === scan1.id && DIMS.every((k) => prog.json.points[1].dimensions[k] >= 1));
    check('progress: the change since the first scan', prog.json.change.score === scan2.score - scan1.score && prog.json.best.id === scan2.id);
    const game = await anna.get('/api/game');
    const g = game.json;
    check('game: XP is the sum of what the scans earned', g.xp === s1.json.earned.xp.total + s2.json.earned.xp.total, g.xp);
    check('game: level with a name', g.level.n === 2 && g.level.name.length > 2 && g.levels.length >= 5, g.level);
    check('game: streak of one day', g.streak.current === 1 && g.streak.scanned_today === true);
    const earnedIds = g.badges.filter((b) => b.earned).map((b) => b.id);
    check('game: badges earned from the scans', ['first_scan', 'mission_done', 'big_step', 'letter_fixed'].every((id) => earnedIds.includes(id)) && !earnedIds.includes('streak_7'), earnedIds);
    check('game: the alphabet a–ö with a state for each letter', g.letters.length === 29 && g.letters.every((l) => ['ny', 'ova', 'fin'].includes(l.state)) && g.letters.some((l) => l.state === 'fin') && g.letters.some((l) => l.state === 'ova') && g.letters.some((l) => l.state === 'ny'));
    check('game: the current missions are the newest scan\'s', g.current.scan_id === scan2.id && g.current.missions.length === 3);

    // Another child
    for (const [who, c] of [['another child', bo], ['a visitor', nobody]]) {
      const want = c === bo ? 404 : 401;
      const got = [
        (await c.get(`/api/scans/${scan1.id}`)).status,
        (await c.raw(`/api/scans/${scan1.id}/image`)).status,
        (await c.raw(`/api/scans/${scan1.id}/thumb`)).status,
        (await c.post(`/api/scans/${scan1.id}/delete`)).status,
      ];
      check(`${who} cannot read, see or delete the scan (${want})`, got.every((s) => s === want), got);
    }
    check('another child sees an empty history and game', (await bo.get('/api/scans')).json.scans.length === 0 && (await bo.get('/api/game')).json.xp === 0);
    check('the scan is still there', (await anna.get(`/api/scans/${scan1.id}`)).status === 200);
    check('a path trick does not reach the files', (await anna.raw('/uploads/1/x.png')).status === 404 && (await anna.raw('/api/scans/..%2F..%2Fapp.db/image')).status === 404);

    // Stopped when idle and started again: nothing may live only in memory
    await stop(server);
    server = startServer(env);
    await waitUp(base);
    const after = await anna.get('/api/game');
    check('after a restart: still signed in, same XP and scans', after.status === 200 && after.json.xp === g.xp && (await anna.get('/api/scans')).json.scans.length === 2);

    // Delete one scan
    const s3 = await anna.post('/api/scans', { image: dataUrl(png(33)) });
    check('third scan: one more picture on the disk', s3.status === 200 && filesIn(userDir).length === 4, filesIn(userDir));
    const del = await anna.post(`/api/scans/${s3.json.scan.id}/delete`);
    check('delete one scan: row, picture and its XP are gone', del.status === 200 && filesIn(userDir).length === 3 && (await anna.get('/api/scans')).json.scans.length === 2 && (await anna.get('/api/game')).json.xp === g.xp);

    // Bo gets a scan too, to see that deleting Anna leaves Bo alone
    const sb = await bo.post('/api/scans', { image: dataUrl(png(44)) });
    const boDirs = filesIn(path.join(dataDir, 'uploads')).filter((d) => d !== String(annaId));
    check('the other child has a scan of their own', sb.status === 200 && boDirs.length === 1);

    // Delete the account
    check('delete account needs the right password', (await anna.post('/api/auth/delete', { password: 'fel-lösen' })).status === 401 && filesIn(userDir).length === 3);
    const gone = await anna.post('/api/auth/delete', { password: 'hemligt123' });
    check('delete account', gone.status === 200);
    check('the pictures are removed from the disk', !fs.existsSync(userDir));
    check('signed out and cannot sign in again', (await anna.get('/api/me')).json.user === null && (await anna.post('/api/auth/login', { username: 'anna_test', password: 'hemligt123' })).status === 401);
    check('the other child\'s scan and picture are untouched', (await bo.get('/api/scans')).json.scans.length === 1 && (await bo.raw(`/api/scans/${sb.json.scan.id}/image`)).status === 200 && filesIn(path.join(dataDir, 'uploads', boDirs[0])).length === 1);
    check('no server errors in the log', !/ 500 |Error|error:/.test(server.log()), server.log().split('\n').filter((l) => / 500 |Error/.test(l)));
  } catch (e) {
    check(`demo mode ran to the end (${e.message})`, false, server.log().slice(-600));
  } finally {
    await stop(server);
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------- part 2: a fake AI

const GOOD = {
  status: 'ok', score: 100, written_text: 'Solen skiner', summary: 'Vilken fin text!',
  dimensions: { shape: { score: 3, comment: 'Fina former.' }, size: { score: '2', comment: 'Lite olika stora.' }, spacing: { score: 2, comment: 'Lite tätt.' }, line: { score: 4, comment: 'Rakt!' }, flow: { score: 3, comment: 'Bra flyt.' } },
  strengths: ['Dina o är runda!', 'Du skriver rakt!'], improvements: ['Mer luft mellan orden!'], tips: ['Rita cirklar i luften!', 'Lägg ett finger mellan orden!'],
  perfect_letters: ['o', 's'], practice_letters: ['g', 'k', 'e', 'r', 'n'], practice_words: ['glad', 'kaka', 'gren'],
  missions: [{ title: 'Fingerluckan', instruction: 'Lägg ett finger mellan orden.', trains: 'spacing' }, { title: 'Bokstaven g', instruction: 'Skriv en rad med g.', trains: 'g' },
    { title: 'Lika stora', instruction: 'Gör alla små bokstäver lika höga.', trains: 'size' }, { title: 'En fjärde', instruction: 'För många.', trains: 'line' }],
};
const BETTER = {
  ...GOOD, summary: 'Du har övat!',
  dimensions: { shape: { score: 3 }, size: { score: 3 }, spacing: { score: 4 }, line: { score: 4 }, flow: { score: 3 } },
  perfect_letters: ['o', 's', 'g'], practice_letters: ['k', 'e'],
  improved: 'Dina mellanrum är mycket bättre!',
  mission_review: [{ mission: 1, result: 'klarat', comment: 'Så mycket luft!' }, { mission: 2, result: 'klarat', comment: 'Fina g!' }, { mission: 3, result: 'pa_vag', comment: 'Nästan!' }],
};

async function aiMode() {
  console.log('\nWith a (fake) AI service');
  const requests = [];
  const answers = [GOOD, BETTER, { status: 'not_handwriting', status_message: 'Det där ser ut som en katt! Fota något du har skrivit.' }, { status: 'ok', summary: 'trasigt' }];
  const mock = http.createServer((req, res) => {
    let body = '';
    req.on('data', (d) => { body += d; });
    req.on('end', () => {
      requests.push({ url: req.url, auth: req.headers.authorization, body: JSON.parse(body) });
      const answer = answers[requests.length - 1] || GOOD;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ choices: [{ message: { content: '```json\n' + JSON.stringify(answer) + '\n```' } }] }));
    });
  });
  await new Promise((r) => mock.listen(0, '127.0.0.1', r));
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'penpal-test-ai-'));
  const port = await freePort();
  const base = `http://127.0.0.1:${port}`;
  const server = startServer({ DATA_DIR: dataDir, PORT: String(port), OPENAI_API_KEY: 'test-key', OPENAI_BASE_URL: `http://127.0.0.1:${mock.address().port}/v1`, OPENAI_MODEL: 'test-model', AI_DAILY_LIMIT: '4' });
  try {
    await waitUp(base);
    const c = client(base);
    await c.post('/api/auth/signup', { username: 'cia_test', password: 'hemligt123' });
    check('AI is configured', (await c.get('/api/me')).json.ai.configured === true);

    const img1 = dataUrl(png(5));
    const s1 = await c.post('/api/scans', { image: img1 });
    const a1 = (s1.json.scan || {}).analysis || { missions: [], practice_letters: [] };
    check('first scan through the model', s1.status === 200 && s1.json.demo === false && s1.json.scan.demo === false, s1.json);
    const sent = requests[0] ? requests[0].body : { messages: [{}, { content: [] }] };
    check('the model got the key, the system prompt and the picture', requests.length === 1 && requests[0].auth === 'Bearer test-key' && sent.model === 'test-model'
      && sent.messages[0].role === 'system' && sent.messages[0].content.includes('PenPal') && sent.messages[1].content.some((p) => p.type === 'image_url' && p.image_url.url === img1));
    check('the first prompt asks for no mission review', !sent.messages[0].content.includes('mission_review'));
    check('the score is computed on the server (14 x 4 = 56), not taken from the model', s1.json.scan.score === 56, s1.json.scan.score);
    check('lists are capped: 4 practice letters, 3 missions', a1.practice_letters.length === 4 && a1.missions.length === 3);
    check('the text the child wrote is kept', a1.written_text === 'Solen skiner');

    const s2 = await c.post('/api/scans', { image: dataUrl(png(6)) });
    const r2 = (s2.json.scan || {}).review || { missions: [], changes: [] };
    const sent2 = requests[1] ? requests[1].body.messages : [{ content: '' }, { content: [{ text: '' }] }];
    check('second scan through the model', s2.status === 200, s2.json);
    check('the second prompt carries the old scores and missions and asks for a review', sent2[0].content.includes('mission_review')
      && sent2[1].content[0].text.includes('Fingerluckan') && sent2[1].content[0].text.includes('Mellanrum ("spacing"): 2 av 5') && sent2[1].content[0].text.includes('g, k, e, r'), sent2[1].content[0].text);
    check('the model\'s verdicts are used', JSON.stringify(r2.missions.map((m) => m.result)) === JSON.stringify(['klarat', 'klarat', 'pa_vag']) && r2.missions[0].comment === 'Så mycket luft!', r2.missions);
    check('Mellanrum 2 -> 4 and 56 -> 68', r2.score_from === 56 && r2.score_to === 68 && r2.changes.some((x) => x.key === 'spacing' && x.from === 2 && x.to === 4));
    check('g moved from öva to fin', JSON.stringify(r2.letters_fixed) === JSON.stringify(['g']));
    check('XP: 20 + 15 + 15 + 5 + 10', s2.json.earned.xp.total === 65, s2.json.earned.xp);

    const s3 = await c.post('/api/scans', { image: dataUrl(png(7)) });
    check('not handwriting: a kind request for a new photo', s3.status === 200 && !s3.json.scan && s3.json.retake.reason === 'not_handwriting' && s3.json.retake.message.includes('katt'), s3.json);
    check('… and nothing is saved, no score', (await c.get('/api/scans')).json.scans.length === 2 && filesIn(path.join(dataDir, 'uploads', '1')).length === 2);

    const dup = await c.post('/api/scans', { image: img1 });
    check('the same picture again is refused before the model is asked (409)', dup.status === 409 && requests.length === 3, [dup.status, requests.length]);

    const s4 = await c.post('/api/scans', { image: dataUrl(png(8)) });
    check('an unusable answer from the model gives 502 and saves nothing', s4.status === 502 && (await c.get('/api/scans')).json.scans.length === 2, s4.json);
    const s5 = await c.post('/api/scans', { image: dataUrl(png(9)) });
    check('the daily allowance (4) holds: the fifth call is refused (429) and not sent', s5.status === 429 && requests.length === 4, [s5.status, requests.length]);
  } catch (e) {
    check(`AI mode ran to the end (${e.message})`, false, server.log().slice(-600));
  } finally {
    await stop(server);
    mock.close();
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
}

(async () => {
  await demoMode();
  await aiMode();
  console.log(`\napi: ${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})();
