'use strict';
// Example answers for when no AI is configured, so the whole loop can be seen and tried:
// a first analysis, then scans that show plausible progress (missions judged, letters moving
// from "öva" to "fin"). The answer has the same shape as the model's and goes through the same
// normalize() – missions, mission verdicts, practice words and "Sedan sist" are derived there.
// Nothing here looks at the picture: the UI says clearly that these are example answers.

const { DIM_KEYS } = require('./rubric');

// A child who practises a little between every scan.
const SCORES = [
  { shape: 3, size: 2, spacing: 2, line: 3, flow: 3 },
  { shape: 3, size: 3, spacing: 4, line: 3, flow: 3 },
  { shape: 4, size: 3, spacing: 4, line: 4, flow: 3 },
  { shape: 4, size: 4, spacing: 4, line: 4, flow: 4 },
  { shape: 4, size: 4, spacing: 5, line: 4, flow: 4 },
  { shape: 5, size: 4, spacing: 5, line: 5, flow: 4 },
];
const LETTERS = [
  { fin: ['o', 'l', 'i', 'm', 's'], ova: ['a', 'g', 'k', 'e'] },
  { fin: ['a', 'n'], ova: ['g', 'k', 'e', 'r'] },
  { fin: ['e', 'k', 't'], ova: ['g', 'r', 'ä'] },
  { fin: ['g', 'u'], ova: ['r', 'ä', 'y'] },
  { fin: ['r', 'd'], ova: ['ä', 'y'] },
  { fin: ['ä', 'h', 'b'], ova: ['y', 'p'] },
];
const BONUS = ['v', 't', 'd', 'h', 'u', 'n', 'c', 'f'];

const SUMMARY = {
  first: ['Vilken fin text du har skrivit! Jag ser massor av bra saker.', 'Hej! Vad roligt att få se din handstil. Du är på god väg!', 'Wow, tack för att du visar din handstil! Här finns mycket fint.'],
  better: ['Jag ser att du har övat! Din handstil har blivit bättre sedan sist.', 'Titta vad som har hänt sedan sist – snyggt jobbat!', 'Din övning syns! Det här är finare än förra gången.'],
  steady: ['Du håller i det fina du kan. Bra kämpat!', 'Stabilt och fint – du är en riktig handstilshjälte!'],
};
const PRAISE = {
  shape: 'Dina bokstäver är tydliga och lätta att läsa!',
  size: 'Dina bokstäver är nästan lika stora allihop – snyggt!',
  spacing: 'Du lämnar bra luft mellan orden!',
  line: 'Du skriver rakt och fint på raden!',
  flow: 'Din text flyter på jättefint!',
};
const NEXT = {
  shape: 'Några bokstäver kan bli ännu tydligare med lite övning!',
  size: 'Dina bokstäver kan bli ännu mer lika stora!',
  spacing: 'Lite mer luft mellan orden gör texten ännu lättare att läsa!',
  line: 'Dina bokstäver kan stå ännu stadigare på linjen!',
  flow: 'Din text får ännu skönare flyt om bokstäverna lutar åt samma håll!',
};
const TIP = {
  shape: 'Testa att rita cirklar i luften innan du skriver!',
  size: 'Låtsas att de små bokstäverna bor under ett tak – ingen får sticka upp!',
  spacing: 'Lägg ett finger efter varje ord – där börjar nästa ord!',
  line: 'Låtsas att linjen är en gata som bokstäverna går på!',
  flow: 'Skaka loss handen som en spagetti innan du börjar skriva!',
};
const EXTRA_TIPS = ['Skriv långsamt som en sköldpadda – då blir det extra fint!', 'Håll pennan mjukt, som om den vore en liten fågel!', 'Sitt skönt med båda fötterna i golvet när du skriver!'];

/** index: how many scans the child has made before this one. seed: any integer (from the image). */
function demoAnswer({ index, seed }) {
  const stage = Math.min(index, SCORES.length - 1);
  const scores = { ...SCORES[stage] };
  if (index >= SCORES.length && seed % 3 === 0) scores[DIM_KEYS[seed % DIM_KEYS.length]] -= 1;   // a slightly off day

  const ova = LETTERS[stage].ova;
  const fin = [];
  for (let i = 0; i <= stage; i++) for (const l of LETTERS[i].fin) if (!ova.includes(l) && !fin.includes(l)) fin.push(l);
  const bonus = BONUS[seed % BONUS.length];
  if (!ova.includes(bonus) && !fin.includes(bonus)) fin.push(bonus);

  const byScore = [...DIM_KEYS].sort((a, b) => scores[b] - scores[a]);
  const best = byScore[0];
  const weak = byScore.slice().reverse().filter((k) => scores[k] < 5);
  const kind = index === 0 ? 'first' : index < SCORES.length ? 'better' : 'steady';
  const pick = (list, n = 0) => list[(seed + n) % list.length];

  return {
    status: 'ok',
    written_text: '',
    summary: pick(SUMMARY[kind]),
    dimensions: Object.fromEntries(DIM_KEYS.map((k) => [k, { score: scores[k] }])),
    strengths: [
      `Dina '${fin[seed % 2]}' är jättefina och runda!`.replace("'l' är jättefina och runda", "'l' är raka och fina"),
      PRAISE[best],
      'Man ser att du har kämpat – snyggt jobbat!',
    ],
    improvements: [
      ...(weak[0] ? [NEXT[weak[0]]] : []),
      ...(ova[0] ? [`Dina '${ova[0]}' kan bli ännu coolare med lite övning!`] : []),
    ],
    tips: [TIP[weak[0] || best], TIP[weak[1] || byScore[1]], pick(EXTRA_TIPS)],
    perfect_letters: fin,
    practice_letters: ova,
  };
}

module.exports = { demoAnswer };
