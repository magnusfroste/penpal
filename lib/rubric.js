'use strict';
// The rubric: what the handwriting is judged on, and the small word list used when the model
// (or the demo) does not supply practice words. Shared by the analysis, the demo and the game.

const DIMENSIONS = [
  { key: 'shape', label: 'Bokstävernas form', short: 'Form' },
  { key: 'size', label: 'Storlek och jämnhet', short: 'Storlek' },
  { key: 'spacing', label: 'Mellanrum', short: 'Mellanrum' },
  { key: 'line', label: 'Håller linjen', short: 'Linjen' },
  { key: 'flow', label: 'Lutning och flyt', short: 'Flyt' },
];
const DIM_KEYS = DIMENSIONS.map((d) => d.key);
const DIM_LABEL = Object.fromEntries(DIMENSIONS.map((d) => [d.key, d.label]));

const ALPHABET = [...'abcdefghijklmnopqrstuvwxyzåäö'];

/** Each dimension is worth up to 20 points: 1–5 steps, 4 points a step. Range 20–100. */
function overallScore(dimensions) {
  return DIM_KEYS.reduce((sum, k) => sum + dimensions[k].score, 0) * 4;
}

// Short, common words a 7–12-year-old knows, a few per letter.
const WORDS = {
  a: ['apa', 'katt', 'glass'], b: ['bok', 'boll', 'bil'], c: ['cykel', 'citron', 'clown'],
  d: ['dag', 'dans', 'dörr'], e: ['lek', 'resa', 'elva'], f: ['fisk', 'fot', 'fil'],
  g: ['glad', 'gris', 'gul'], h: ['hej', 'hus', 'hund'], i: ['is', 'bil', 'ris'],
  j: ['jul', 'jag', 'jord'], k: ['katt', 'ko', 'kaka'], l: ['lek', 'sol', 'lila'],
  m: ['mus', 'mat', 'mamma'], n: ['nos', 'natt', 'nalle'], o: ['sol', 'ost', 'orm'],
  p: ['penna', 'pappa', 'päron'], q: ['quiz'], r: ['ros', 'räv', 'rolig'],
  s: ['sol', 'sten', 'sås'], t: ['tåg', 'tak', 'tiger'], u: ['uggla', 'hus', 'ute'],
  v: ['vän', 'vår', 'vatten'], w: ['wow', 'webb'], x: ['yxa', 'sax', 'lax'],
  y: ['ny', 'fyra', 'yxa'], z: ['zebra', 'zoo', 'pizza'], å: ['år', 'båt', 'gås'],
  ä: ['äpple', 'räv', 'bär'], ö: ['öra', 'snö', 'röd'],
};
const DEFAULT_WORDS = ['sol', 'katt', 'bok', 'hej', 'glad'];

/** Up to `n` words for these letters, taking turns between the letters; skips `have`. */
function pickWords(letters, n, have = [], offset = 0) {
  const out = [...have];
  for (let round = 0; round < 3 && out.length < n; round++) {
    for (const l of letters) {
      const list = WORDS[l] || [];
      const w = list[(round + offset) % (list.length || 1)];
      if (w && !out.includes(w) && out.length < n) out.push(w);
    }
  }
  for (const w of DEFAULT_WORDS) if (out.length < Math.min(n, 3) && !out.includes(w)) out.push(w);
  return out;
}

module.exports = { DIMENSIONS, DIM_KEYS, DIM_LABEL, ALPHABET, WORDS, overallScore, pickWords };
