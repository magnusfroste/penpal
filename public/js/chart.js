// Two small charts drawn as inline SVG: the overall score over time, and a sparkline for one
// dimension. No library – a polyline, a few circles and labels.

import { s, fmtDate } from './ui.js';

const MAX_POINTS = 14;       // the latest scans; more than this gets crowded on a phone

/** points: [{ created_at, score }] oldest first. The score axis runs 20–100. */
export function scoreChart(points) {
  const pts = points.slice(-MAX_POINTS);
  const W = 340, H = 190, L = 34, R = 18, T = 22, B = 30;
  const x = (i) => (pts.length === 1 ? (L + W - R) / 2 : L + (i * (W - L - R)) / (pts.length - 1));
  const y = (v) => T + ((100 - v) * (H - T - B)) / 80;
  const svg = s('svg', { class: 'chart', viewBox: `0 0 ${W} ${H}`, role: 'img',
    'aria-label': `Dina poäng över tid: ${pts.map((p) => p.score).join(', ')}` });

  for (const v of [20, 40, 60, 80, 100]) {
    svg.append(s('line', { class: 'chart-grid', x1: L, x2: W - R, y1: y(v), y2: y(v) }),
      s('text', { class: 'chart-axis', x: L - 8, y: y(v) + 4, 'text-anchor': 'end' }, String(v)));
  }
  const line = pts.map((p, i) => `${x(i).toFixed(1)},${y(p.score).toFixed(1)}`).join(' ');
  if (pts.length > 1) {
    svg.append(
      s('polygon', { class: 'chart-area', points: `${x(0).toFixed(1)},${y(20)} ${line} ${x(pts.length - 1).toFixed(1)},${y(20)}` }),
      s('polyline', { class: 'chart-line', points: line }));
  }
  pts.forEach((p, i) => {
    const last = i === pts.length - 1;
    svg.append(s('circle', { class: last ? 'chart-dot chart-dot-last' : 'chart-dot', cx: x(i), cy: y(p.score), r: last ? 6 : 4 }));
    if (last || i === 0) {
      svg.append(s('text', { class: 'chart-value', x: x(i), y: y(p.score) - 11, 'text-anchor': pts.length === 1 ? 'middle' : last ? 'end' : 'start' }, String(p.score)));
    }
  });
  svg.append(s('text', { class: 'chart-axis', x: x(0), y: H - 8, 'text-anchor': pts.length === 1 ? 'middle' : 'start' }, fmtDate(pts[0].created_at)));
  if (pts.length > 1) {
    svg.append(s('text', { class: 'chart-axis', x: x(pts.length - 1), y: H - 8, 'text-anchor': 'end' }, fmtDate(pts[pts.length - 1].created_at)));
  }
  return svg;
}

/** values: 1–5 scores, oldest first. */
export function sparkline(values, label) {
  const vals = values.slice(-MAX_POINTS);
  const W = 120, H = 44, P = 7;
  const x = (i) => (vals.length === 1 ? W / 2 : P + (i * (W - 2 * P)) / (vals.length - 1));
  const y = (v) => P + ((5 - v) * (H - 2 * P)) / 4;
  const svg = s('svg', { class: 'spark', viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': `${label}: ${vals.join(', ')} av 5` });
  svg.append(s('line', { class: 'chart-grid', x1: P, x2: W - P, y1: y(1), y2: y(1) }), s('line', { class: 'chart-grid', x1: P, x2: W - P, y1: y(5), y2: y(5) }));
  if (vals.length > 1) svg.append(s('polyline', { class: 'spark-line', points: vals.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ') }));
  vals.forEach((v, i) => svg.append(s('circle', { class: 'spark-dot', cx: x(i), cy: y(v), r: i === vals.length - 1 ? 4.5 : 2.5 })));
  return svg;
}
