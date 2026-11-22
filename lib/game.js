'use strict';
// The game: XP, levels, the day streak, badges and the letter collection. Everything is computed
// from the stored scans each time – there is no separate game state that could drift, and
// deleting a scan simply takes its rewards with it. Rewards follow real practice: XP comes from
// a scan (at most a few a day) and from missions the teacher judged as done, never from a click.

const { DIMENSIONS, DIM_KEYS, ALPHABET } = require('./rubric');

const XP = { scan: 20, klarat: 15, pa_vag: 5, better: 10 };
const XP_SCANS_PER_DAY = 3;          // more scans the same day are welcome but give no XP

const LEVELS = [
  [0, 'Pennfrö'], [60, 'Krumelur'], [150, 'Bokstavsspanare'], [280, 'Ordbyggare'], [450, 'Radhjälte'],
  [660, 'Pennpilot'], [920, 'Skrivstjärna'], [1250, 'Bläckmästare'], [1650, 'Handstilshjälte'], [2150, 'Pennlegend'],
].map(([xp, name], i) => ({ n: i + 1, name, xp }));

const BADGES = [
  { id: 'first_scan', icon: 'camera', title: 'Första skanningen', text: 'Du visade din handstil för första gången.' },
  { id: 'three_scans', icon: 'pen', title: 'Tre skanningar', text: 'Du har skannat tre gånger.' },
  { id: 'ten_scans', icon: 'rocket', title: 'Tio skanningar', text: 'Du har skannat tio gånger.' },
  { id: 'streak_3', icon: 'flame', title: 'Tre dagar i rad', text: 'Du skannade tre dagar i rad.' },
  { id: 'streak_7', icon: 'flame', title: 'En hel vecka', text: 'Sju dagar i rad – wow!' },
  { id: 'mission_done', icon: 'target', title: 'Uppdrag klarat', text: 'Du klarade ditt första uppdrag.' },
  { id: 'hat_trick', icon: 'trophy', title: 'Alla tre', text: 'Du klarade alla tre uppdragen på en gång.' },
  { id: 'big_step', icon: 'trend', title: 'Jättekliv', text: 'En del av din handstil blev två steg bättre.' },
  { id: 'letter_fixed', icon: 'sparkles', title: 'Bokstavsfixare', text: 'En bokstav gick från öva till fin.' },
  { id: 'ten_letters', icon: 'abc', title: 'Bokstavssamlare', text: 'Tio fina bokstäver i samlingen.' },
  { id: 'all_four', icon: 'star', title: 'Fem i topp', text: 'Alla fem delarna fick minst 4.' },
  { id: 'gold_pen', icon: 'medal', title: 'Guldpenna', text: 'Du fick 90 poäng eller mer.' },
];

const dayNumber = (day) => Math.round(Date.parse(`${day}T00:00:00Z`) / 864e5);

function levelFor(xp) {
  let level = LEVELS[0];
  for (const l of LEVELS) if (xp >= l.xp) level = l;
  const next = LEVELS[level.n] || null;
  return {
    n: level.n, name: level.name, xp_floor: level.xp, xp_next: next ? next.xp : null, next_name: next ? next.name : null,
    progress: next ? Math.min(1, (xp - level.xp) / (next.xp - level.xp)) : 1,
  };
}

/**
 * scans: the user's scans, oldest first: { id, created_at, day, score, analysis, review }.
 * today: the current day ("YYYY-MM-DD") in the same time zone as scan.day.
 */
function computeGame(scans, today) {
  let xp = 0;
  let streak = 0;
  let bestStreak = 0;
  let lastDay = null;
  let missionsDone = 0;
  let lastGain = null;
  const perDay = {};
  const lowest = {};                                           // dimension -> lowest score seen so far
  const letters = Object.fromEntries(ALPHABET.map((l) => [l, { letter: l, state: 'ny', since: null }]));
  const earned = {};
  const award = (id, scan) => { if (!earned[id]) earned[id] = { at: scan.created_at, scan_id: scan.id }; };

  for (let i = 0; i < scans.length; i++) {
    const s = scans[i];
    const a = s.analysis;
    if (s.day !== lastDay) {
      streak = lastDay && dayNumber(s.day) - dayNumber(lastDay) === 1 ? streak + 1 : 1;
      lastDay = s.day;
      bestStreak = Math.max(bestStreak, streak);
    }
    perDay[s.day] = (perDay[s.day] || 0) + 1;

    const results = s.review ? s.review.missions.map((m) => m.result) : [];
    const done = results.filter((r) => r === 'klarat').length;
    const half = results.filter((r) => r === 'pa_vag').length;
    const counts = perDay[s.day] <= XP_SCANS_PER_DAY;
    const gain = {
      scan: counts ? XP.scan : 0,
      missions: counts ? done * XP.klarat + half * XP.pa_vag : 0,
      better: counts && s.review && s.review.score_to > s.review.score_from ? XP.better : 0,
    };
    gain.total = gain.scan + gain.missions + gain.better;
    xp += gain.total;
    lastGain = gain;
    missionsDone += done;

    let fixed = false;
    for (const l of a.perfect_letters) {
      if (!letters[l]) continue;
      if (letters[l].state === 'ova') fixed = true;
      if (letters[l].state !== 'fin') letters[l] = { letter: l, state: 'fin', since: s.created_at };
    }
    for (const l of a.practice_letters) {
      if (letters[l] && letters[l].state !== 'ova') letters[l] = { letter: l, state: 'ova', since: s.created_at };
    }
    const fine = ALPHABET.filter((l) => letters[l].state === 'fin').length;

    award('first_scan', s);
    if (i >= 2) award('three_scans', s);
    if (i >= 9) award('ten_scans', s);
    if (streak >= 3) award('streak_3', s);
    if (streak >= 7) award('streak_7', s);
    if (done >= 1) award('mission_done', s);
    if (done >= 3) award('hat_trick', s);
    if (fixed) award('letter_fixed', s);
    if (fine >= 10) award('ten_letters', s);
    if (DIM_KEYS.every((k) => a.dimensions[k].score >= 4)) award('all_four', s);
    if (s.score >= 90) award('gold_pen', s);
    for (const k of DIM_KEYS) {
      const v = a.dimensions[k].score;
      if (lowest[k] !== undefined && v - lowest[k] >= 2) award('big_step', s);
      lowest[k] = lowest[k] === undefined ? v : Math.min(lowest[k], v);
    }
  }

  const gap = lastDay ? dayNumber(today) - dayNumber(lastDay) : null;
  const latest = scans.length ? scans[scans.length - 1] : null;
  return {
    xp,
    level: levelFor(xp),
    levels: LEVELS,
    streak: { current: gap !== null && gap <= 1 ? streak : 0, best: bestStreak, scanned_today: gap === 0 },
    xp_scans_left_today: Math.max(0, XP_SCANS_PER_DAY - (perDay[today] || 0)),
    counts: { scans: scans.length, missions_done: missionsDone, fine_letters: ALPHABET.filter((l) => letters[l].state === 'fin').length },
    badges: BADGES.map((b) => ({ ...b, earned: Boolean(earned[b.id]), at: earned[b.id] ? earned[b.id].at : null, scan_id: earned[b.id] ? earned[b.id].scan_id : null })),
    letters: ALPHABET.map((l) => letters[l]),
    last_gain: lastGain,
    current: latest ? {
      scan_id: latest.id, score: latest.score, created_at: latest.created_at,
      missions: latest.analysis.missions, practice_letters: latest.analysis.practice_letters,
    } : null,
    rules: { xp: XP, xp_scans_per_day: XP_SCANS_PER_DAY, dimensions: DIMENSIONS },
  };
}

/** What the newest scan earned: compare the game before and after it. */
function earnedBy(before, after) {
  const had = new Set(before.badges.filter((b) => b.earned).map((b) => b.id));
  return {
    xp: after.last_gain,
    level_up: after.level.n > before.level.n ? after.level : null,
    badges: after.badges.filter((b) => b.earned && !had.has(b.id)),
  };
}

module.exports = { computeGame, earnedBy, LEVELS, BADGES, XP };
