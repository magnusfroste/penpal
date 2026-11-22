'use strict';
// Unit checks without a server: the normalizer (what the model may answer, and what we make of
// it) and the game (XP, streak, badges, letters). Run: node test/unit-test.js

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'penpal-unit-'));
process.env.DATA_DIR = tmp;                               // lib/core.js opens its database on require
const { normalize, buildPrompt } = require('../lib/analysis');
const { demoAnswer } = require('../lib/demo');
const { computeGame, earnedBy } = require('../lib/game');

let passed = 0;
let failed = 0;
function check(name, ok, detail) {
  if (ok) { passed++; console.log(`  ok   ${name}`); } else { failed++; console.log(`  FAIL ${name}${detail !== undefined ? ` – ${JSON.stringify(detail)}` : ''}`); }
}

// ---------------------------------------------------------------- normalize

const messy = {
  status: 'OK', score: 100,
  summary: '  Hej\n\n<b>du</b>  ',
  dimensions: { shape: { score: '4', comment: 'Fint!' }, size: 3.4, spacing: { score: 9 > 5 ? 5 : 5 }, line: { score: 2 }, flow: { score: 1, comment: 'x'.repeat(500) } },
  strengths: ['Bra', 'Bra', 'Mer bra', 'Tre', 'Fyra'],
  improvements: 'inte en lista',
  tips: [null, 12, { a: 1 }, 'Rita cirklar'],
  perfect_letters: ['O', 'm', 'g', 'mm', '7', "'s'"],
  practice_letters: ['G', 'k', 'e', 'r', 'ä', 'y'],
  practice_words: ['Glad', 'en hel mening', 'x'],
  missions: [{ title: 'Ett', instruction: 'Gör så här.', trains: 'Mellanrum' }, { title: '', instruction: 'utan titel' }, { title: 'Två', instruction: 'Gör det.', trains: 'bokstaven g' },
    { title: 'Tre', instruction: 'Och det.', trains: 'hittepå' }, { title: 'Fyra', instruction: 'För många.', trains: 'line' }],
};
const n = normalize(messy, null);
check('status ok', n.status === 'ok');
check('score is computed here (4+3+5+2+1)*4 = 60, not the model\'s 100', n.score === 60, n.score);
check('scores are integers 1–5', Object.values(n.analysis.dimensions).every((d) => Number.isInteger(d.score) && d.score >= 1 && d.score <= 5));
check('missing comment gets a default', n.analysis.dimensions.size.comment.length > 5);
check('long comment is cut', n.analysis.dimensions.flow.comment.length <= 180);
check('whitespace is collapsed, text kept as text', n.analysis.summary === 'Hej <b>du</b>', n.analysis.summary);
check('strengths: deduplicated, at most 3', n.analysis.strengths.length === 3 && new Set(n.analysis.strengths).size === 3);
check('improvements: a non-list becomes empty', n.analysis.improvements.length === 0);
check('tips: only strings survive', JSON.stringify(n.analysis.tips) === JSON.stringify(['12', 'Rita cirklar']), n.analysis.tips);
check('practice letters: at most 4, lower case', JSON.stringify(n.analysis.practice_letters) === JSON.stringify(['g', 'k', 'e', 'r']), n.analysis.practice_letters);
check('a letter is never in both lists', JSON.stringify(n.analysis.perfect_letters) === JSON.stringify(['o', 'm', 's']), n.analysis.perfect_letters);
check('practice words: 3–5 real words', n.analysis.practice_words.length >= 3 && n.analysis.practice_words.length <= 5 && n.analysis.practice_words[0] === 'glad', n.analysis.practice_words);
check('missions: exactly three', n.analysis.missions.length === 3);
check('mission targets are a dimension or a letter', JSON.stringify(n.analysis.missions.map((m) => m.trains)) === JSON.stringify(['spacing', 'g', 'flow']), n.analysis.missions.map((m) => m.trains));
check('no review without a previous scan', n.review === null);

check('not handwriting -> ask for a new photo', normalize({ status: 'not_handwriting', status_message: 'Det där är en katt!' }, null).message === 'Det där är en katt!');
check('unreadable gets a default kind message', normalize({ status: 'unreadable' }, null).message.length > 10);
check('an empty answer counts as unreadable', normalize({}, null).status === 'unreadable');
let threw = null;
try { normalize({ status: 'ok', dimensions: { shape: { score: 7 } } }, null); } catch (e) { threw = e; }
check('status ok with unusable scores is refused (502)', threw && threw.status === 502);
check('missions are padded when the model gives none', normalize({ dimensions: { shape: 3, size: 3, spacing: 3, line: 3, flow: 3 } }, null).analysis.missions.length === 3);

// A second scan: the review.
const prev = { id: 1, day: '2026-11-20', score: n.score, analysis: n.analysis };
const second = normalize({
  ...messy,
  dimensions: { shape: 4, size: 3, spacing: 5, line: 4, flow: 2 },
  perfect_letters: ['o', 'm', 'g'], practice_letters: ['k'],
  improved: 'Du håller linjen mycket bättre!',
  mission_review: [{ mission: 2, result: 'På väg', comment: 'Nästan!' }, { mission: 1, result: 'klarat' }, { mission: 3, result: 'vet inte' }],
}, prev);
check('review: numbers come from stored scores', second.review.score_from === 60 && second.review.score_to === 72, second.review);
check('review: line 2 -> 4', JSON.stringify(second.review.changes.find((c) => c.key === 'line')) === JSON.stringify({ key: 'line', from: 2, to: 4 }));
check('review: verdicts matched by mission number', second.review.missions[0].result === 'klarat' && second.review.missions[1].result === 'pa_vag' && second.review.missions[1].comment === 'Nästan!', second.review.missions);
check('review: an unknown verdict is derived from the scores (flow 1 -> 2 = på väg)', second.review.missions[2].result === 'pa_vag', second.review.missions[2]);
check('review: every verdict has a comment', second.review.missions.every((m) => m.comment.length > 3));
check('review: letters that moved from öva to fin', JSON.stringify(second.review.letters_fixed) === JSON.stringify(['g']), second.review.letters_fixed);
check('review: the model\'s sentence is kept', second.review.improved === 'Du håller linjen mycket bättre!');

const p1 = buildPrompt(null);
const p2 = buildPrompt(prev);
check('first prompt asks for no mission review', !p1.system.includes('mission_review') && !p1.system.includes('__REVIEW'));
check('later prompt asks for the review and carries the old missions', p2.system.includes('mission_review') && p2.user.includes(n.analysis.missions[0].title) && p2.user.includes('Mellanrum') && !p2.system.includes('__REVIEW'));

// ---------------------------------------------------------------- the demo and the game

const scans = [];
const days = ['2026-11-10', '2026-11-11', '2026-11-12', '2026-11-12', '2026-11-12', '2026-11-12', '2026-11-20'];
let last = null;
days.forEach((day, i) => {
  const r = normalize(demoAnswer({ index: i, seed: 1000 + i * 7 }), last, { variant: i });
  last = { id: i + 1, created_at: `${day}T10:00:00Z`, day, score: r.score, analysis: r.analysis, review: r.review };
  scans.push(last);
});
check('demo: second scan scores higher than the first', scans[1].score > scans[0].score, [scans[0].score, scans[1].score]);
check('demo: second scan judges the three missions, some done', scans[1].review.missions.length === 3 && scans[1].review.missions.some((m) => m.result === 'klarat'));
check('demo: answers vary with the seed', JSON.stringify(demoAnswer({ index: 0, seed: 1 })) !== JSON.stringify(demoAnswer({ index: 0, seed: 2 })));

const g1 = computeGame(scans.slice(0, 1), '2026-11-10');
const g2 = computeGame(scans.slice(0, 2), '2026-11-11');
const g3 = computeGame(scans.slice(0, 3), '2026-11-12');
check('first scan: 20 XP, level 1, first badge', g1.xp === 20 && g1.level.n === 1 && g1.badges.find((b) => b.id === 'first_scan').earned);
check('first scan: streak 1', g1.streak.current === 1 && g1.streak.scanned_today);
const e2 = earnedBy(g1, g2);
check('second scan: XP for the scan, the missions and for getting better', e2.xp.scan === 20 && e2.xp.missions === 35 && e2.xp.better === 10 && g2.xp === 85, e2.xp);
check('second scan: level up to 2', e2.level_up && e2.level_up.n === 2);
check('second scan: new badges mission_done, big_step, letter_fixed', ['mission_done', 'big_step', 'letter_fixed'].every((id) => e2.badges.some((b) => b.id === id)), e2.badges.map((b) => b.id));
check('letter a moved from öva to fin', g1.letters.find((l) => l.letter === 'a').state === 'ova' && g2.letters.find((l) => l.letter === 'a').state === 'fin');
check('unseen letters stay "ny"', g2.letters.find((l) => l.letter === 'q').state === 'ny' && g2.letters.length === 29);
check('three days in a row: streak 3 and its badge', g3.streak.current === 3 && g3.badges.find((b) => b.id === 'streak_3').earned && !g2.badges.find((b) => b.id === 'streak_3').earned);
const g5 = computeGame(scans.slice(0, 5), '2026-11-12');
const g6 = computeGame(scans.slice(0, 6), '2026-11-12');
check('only three scans a day give XP', g6.xp === g5.xp && g6.last_gain.total === 0 && g5.last_gain.total > 0, [g5.xp, g6.xp]);
check('no XP left today after three', g5.xp_scans_left_today === 0 && g3.xp_scans_left_today === 2);
const g7 = computeGame(scans, '2026-11-20');
check('a gap resets the streak, the best is remembered', g7.streak.current === 1 && g7.streak.best === 3, g7.streak);
check('no scan yesterday or today: current streak 0', computeGame(scans, '2026-11-25').streak.current === 0);
check('seven days are not faked', !g7.badges.find((b) => b.id === 'streak_7').earned);
check('empty game', computeGame([], '2026-11-20').xp === 0 && computeGame([], '2026-11-20').current === null);
check('current missions are the latest scan\'s', g7.current.scan_id === 7 && g7.current.missions.length === 3);

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\nunit: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
