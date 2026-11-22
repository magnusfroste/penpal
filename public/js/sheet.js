// The practice sheet: one printable A4 page built from a scan – the practice letters as large
// dotted letters to trace on four-line handwriting guides (ascender, x-height, baseline,
// descender), the practice words to trace and copy, free lines and the three missions as a
// checklist. No PDF library: the page is plain HTML and SVG in millimetres, printed with
// window.print() (style.css has the @page and @media print rules).

import { h, s, art, icon, fmtDateLong, trainsLabel } from './ui.js';

// Fonts that come with phones and computers and whose letters look like the ones children
// learn (a round one-storey "a", simple shapes). The first one that exists is used.
const TRACE_FONT = '"Sassoon Primary", "Chalkboard SE", "Chalkboard", "Comic Sans MS", "Comic Neue", casual, "Century Gothic", "Trebuchet MS", sans-serif';
const WIDTH = 186;           // mm: A4 minus 12 mm on each side

/** Where this device's font puts its lines, as fractions of the font size – measured, not guessed. */
function fontMetrics() {
  const fallback = { x: 0.5, asc: 0.75, desc: 0.22, width: (t) => t.length * 0.55 };
  try {
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.font = `200px ${TRACE_FONT}`;
    const m = (t) => ctx.measureText(t);
    const x = m('x').actualBoundingBoxAscent / 200;
    const asc = Math.max(m('l').actualBoundingBoxAscent, m('k').actualBoundingBoxAscent) / 200;
    const desc = Math.max(m('p').actualBoundingBoxDescent, m('g').actualBoundingBoxDescent) / 200;
    if (!(x > 0.25 && asc > x + 0.1 && desc > 0.08 && desc < 0.5)) return fallback;
    return { x, asc, desc, width: (t) => m(t).width / 200 };
  } catch (e) {
    return fallback;
  }
}

/**
 * One row of guide lines, `height` mm tall. draw({ put, width, size }) places text on the baseline:
 * put(x, text, 'model' | 'trace') and width(text) in mm.
 */
function guideRow(height, m, draw) {
  const pad = height * 0.09;
  const size = (height - 2 * pad) / (m.asc + m.desc);
  const base = pad + m.asc * size;
  const svg = s('svg', { class: 'guide', viewBox: `0 0 ${WIDTH} ${height}`, width: `${WIDTH}mm`, height: `${height}mm`, 'aria-hidden': 'true' });
  const rule = (cls, y) => svg.append(s('line', { class: cls, x1: 0, x2: WIDTH, y1: y.toFixed(2), y2: y.toFixed(2) }));
  rule('g-outer', base - m.asc * size);
  rule('g-mid', base - m.x * size);
  rule('g-base', base);
  rule('g-outer', base + m.desc * size);
  if (draw) {
    draw({
      size,
      width: (t) => m.width(t) * size,
      put: (x, text, cls) => svg.append(s('text', { class: cls, x: x.toFixed(2), y: base.toFixed(2), 'font-size': size.toFixed(2), style: `font-family:${TRACE_FONT}` }, text)),
    });
  }
  return svg;
}

/** A letter row: the model letter, dotted copies to trace across half the row, the rest free. */
function letterRow(letter, m) {
  return guideRow(22, m, ({ put, width }) => {
    const slot = Math.max(width(letter) + 4.5, 15);
    put(3, letter, 'model');
    for (let x = 3 + slot + 3; x + slot < WIDTH * 0.6; x += slot) put(x, letter, 'trace');
  });
}

/** A word row: the model word, one or two dotted copies, and room to write it yourself. */
function wordRow(word, m) {
  return guideRow(14, m, ({ put, width }) => {
    const w = width(word);
    put(3, word, 'model');
    const gap = 9;
    // One dotted copy whenever it fits on the row; a second only if half the row stays free.
    if (3 + 2 * w + gap < WIDTH - 20) put(3 + w + gap, word, 'trace');
    if (3 + 3 * w + 2 * gap < WIDTH * 0.55) put(3 + 2 * (w + gap), word, 'trace');
  });
}

export function buildSheet(scan) {
  const a = scan.analysis;
  const m = fontMetrics();
  const letters = a.practice_letters.slice(0, 4);
  const words = a.practice_words.slice(0, 5);
  const free = h('div', { class: 'sheet-free' }, Array.from({ length: 12 }, () => guideRow(13, m)));

  const sheet = h('article', { class: 'sheet', lang: 'sv' },
    h('header', { class: 'sheet-head' },
      art('pal', 'sheet-pal'),
      h('div', null, h('h1', null, 'Mitt övningsblad'), h('p', null, `PenPal · ${fmtDateLong(scan.created_at)}`)),
      h('p', { class: 'sheet-name' }, 'Namn: ', h('span'))),
    letters.length ? h('section', null,
      h('h2', null, 'Bokstäver att öva på', h('small', null, 'Följ de prickade bokstäverna. Skriv sedan egna.')),
      letters.map((l) => letterRow(l, m))) : null,
    h('section', null,
      h('h2', null, 'Ord att öva på', h('small', null, 'Följ ordet och skriv det sedan själv.')),
      words.map((w) => wordRow(w, m))),
    h('section', { class: 'sheet-free-wrap' }, h('h2', null, 'Skriv själv'), free),
    h('section', { class: 'sheet-missions' },
      h('h2', null, 'Mina tre uppdrag'),
      h('ul', null, a.missions.map((mi) => h('li', null,
        h('i', { class: 'box' }),
        h('p', null, h('strong', null, mi.title), h('em', null, ` (${trainsLabel(mi.trains)}) `), mi.instruction))))),
    h('footer', { class: 'sheet-foot' }, 'Öva en liten stund varje dag. Fota sedan igen – då ser du hur du blir bättre!'));
  return { sheet, free };
}

/** The free lines fill what is left of the page: drop the rows that do not fit completely. */
function fitFreeRows(free) {
  const rows = [...free.children];
  rows.forEach((r) => { r.style.display = ''; });
  const bottom = free.getBoundingClientRect().bottom + 0.5;
  let shown = 0;
  for (const r of rows) {
    if (r.getBoundingClientRect().bottom > bottom) r.style.display = 'none'; else shown++;
  }
  free.parentElement.style.visibility = shown ? '' : 'hidden';     // no room for a single row: no heading either
}

/** The print view: a toolbar and the sheet, scaled to fit the screen (printing uses real size). */
export function sheetView(scan, back) {
  const { sheet, free } = buildSheet(scan);
  const wrap = h('div', { class: 'sheet-wrap' }, sheet);
  const fit = () => {
    if (!wrap.isConnected || !sheet.offsetWidth) return;
    fitFreeRows(free);
    const scale = Math.min(1, wrap.clientWidth / sheet.offsetWidth);
    sheet.style.transform = `scale(${scale})`;
    wrap.style.height = `${Math.round(sheet.offsetHeight * scale)}px`;
  };
  // Fits when the sheet lands on the page and again whenever the room for it changes.
  setTimeout(fit, 0);
  if (window.ResizeObserver) new ResizeObserver(fit).observe(wrap);

  return h('div', { class: 'view view-sheet' },
    h('div', { class: 'sheet-tools no-print' },
      h('a', { class: 'btn btn-soft', href: back }, icon('arrow-left'), 'Tillbaka'),
      h('button', { class: 'btn btn-primary', type: 'button', onClick: () => { fit(); window.print(); } }, icon('print'), 'Skriv ut')),
    h('p', { class: 'hint no-print' }, 'Ett A4-papper. Välj "Skriv ut" – eller "Spara som PDF" i utskriftsrutan.'),
    wrap);
}
