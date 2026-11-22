// Small DOM helpers. Everything on the page is built with these – text always goes in as text
// nodes (never as HTML), so nothing a model or a user writes can become markup.

const SVG_NS = 'http://www.w3.org/2000/svg';

function fill(el, attrs, kids) {
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'class') el.setAttribute('class', v);
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  const add = (kid) => {
    if (kid === null || kid === undefined || kid === false) return;
    if (Array.isArray(kid)) kid.forEach(add);
    else el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  };
  add(kids);
  return el;
}

/** h('p', { class: 'x', onClick: fn }, 'text', node, [more]) */
export const h = (tag, attrs, ...kids) => fill(document.createElement(tag), attrs, kids);
/** The same for SVG elements. */
export const s = (tag, attrs, ...kids) => fill(document.createElementNS(SVG_NS, tag), attrs, kids);

/** An icon from the sprite in index.html. */
export const icon = (name, cls = '') => s('svg', { class: `icon ${cls}`.trim(), 'aria-hidden': 'true', focusable: 'false' },
  s('use', { href: `#i-${name}` }));

/** An illustration from the sprite; with a label it is announced as an image. */
export const art = (name, cls = '', label = '') => s('svg', {
  class: `art ${cls}`.trim(), role: label ? 'img' : null, 'aria-label': label || null, 'aria-hidden': label ? null : 'true', focusable: 'false',
}, s('use', { href: `#ill-${name}` }));

export const fmtDate = (iso) => new Date(iso).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
export const fmtDateLong = (iso) => new Date(iso).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' });

// ---------------------------------------------------------------- what the rubric is called

export const DIMS = [
  { key: 'shape', label: 'Bokstävernas form', short: 'Form', icon: 'shape', tone: 'blue' },
  { key: 'size', label: 'Storlek och jämnhet', short: 'Storlek', icon: 'size', tone: 'purple' },
  { key: 'spacing', label: 'Mellanrum', short: 'Mellanrum', icon: 'spacing', tone: 'green' },
  { key: 'line', label: 'Håller linjen', short: 'Linjen', icon: 'line', tone: 'amber' },
  { key: 'flow', label: 'Lutning och flyt', short: 'Flyt', icon: 'flow', tone: 'pink' },
];
export const DIM = Object.fromEntries(DIMS.map((d) => [d.key, d]));

export const VERDICT = {
  klarat: { label: 'Klarat!', icon: 'check', tone: 'green' },
  pa_vag: { label: 'På väg', icon: 'sprout', tone: 'amber' },
  inte_an: { label: 'Inte än', icon: 'clock', tone: 'muted' },
};

/** What a mission trains, in words: a dimension's name or "Bokstaven g". */
export const trainsLabel = (t) => (DIM[t] ? DIM[t].label : `Bokstaven ${t}`);

export function tier(score) {
  if (score >= 90) return { title: 'Mästerlig handstil!', text: 'Du är en riktig handstilskonstnär!', icon: 'trophy' };
  if (score >= 70) return { title: 'Utmärkt arbete!', text: 'Din handstil är verkligen imponerande!', icon: 'medal' };
  if (score >= 50) return { title: 'Bra jobbat!', text: 'Du är på rätt väg!', icon: 'star' };
  return { title: 'Bra försök!', text: 'Fortsätt öva – du blir bättre för varje gång!', icon: 'sprout' };
}

/** Five stars, as many filled as the score earns (20 points a star). */
export function stars(score, cls = '') {
  const n = Math.max(1, Math.min(5, Math.round(score / 20)));
  return h('span', { class: `stars ${cls}`.trim(), role: 'img', 'aria-label': `${n} av 5 stjärnor` },
    [1, 2, 3, 4, 5].map((i) => icon('star', i <= n ? 'on' : 'off')));
}

/** Five dots for a 1–5 score. */
export function dots(score) {
  return h('span', { class: 'dots', role: 'img', 'aria-label': `${score} av 5` },
    [1, 2, 3, 4, 5].map((i) => h('i', { class: i <= score ? 'on' : '' })));
}

// ---------------------------------------------------------------- toasts

export function toast(message, kind = 'info') {
  let box = document.getElementById('toasts');
  if (!box) {
    box = h('div', { id: 'toasts', class: 'toasts', role: 'status', 'aria-live': 'polite' });
    document.body.append(box);
  }
  const el = h('div', { class: `toast toast-${kind}` }, icon(kind === 'error' ? 'info' : kind === 'xp' ? 'sparkles' : 'check'), h('span', null, message));
  box.append(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, kind === 'error' ? 5000 : 3200);
}

// ---------------------------------------------------------------- celebration

const CONFETTI = ['#2563eb', '#fbbf24', '#fb7185', '#34d399', '#a78bfa', '#38bdf8'];

function confetti() {
  const box = h('div', { class: 'confetti', 'aria-hidden': 'true' });
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return box;
  for (let i = 0; i < 44; i++) {
    const p = h('i');
    p.style.left = `${Math.random() * 100}%`;
    p.style.background = CONFETTI[i % CONFETTI.length];
    p.style.width = `${7 + Math.random() * 6}px`;
    p.style.height = `${10 + Math.random() * 8}px`;
    p.style.animationDelay = `${Math.random() * 0.6}s`;
    p.style.animationDuration = `${1.8 + Math.random() * 1.6}s`;
    p.style.setProperty('--drift', `${(Math.random() - 0.5) * 160}px`);
    if (i % 3 === 0) p.style.borderRadius = '50%';
    box.append(p);
  }
  return box;
}

/** A new level or new badges: confetti and a card. earned comes from POST /api/scans. */
export function celebrate(earned) {
  if (!earned || (!earned.level_up && !earned.badges.length)) return;
  const close = () => { overlay.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  const items = [];
  if (earned.level_up) {
    items.push(h('div', { class: 'prize prize-level' },
      h('div', { class: 'prize-medal' }, h('span', null, String(earned.level_up.n))),
      h('div', null, h('strong', null, `Nivå ${earned.level_up.n}`), h('span', null, earned.level_up.name))));
  }
  for (const b of earned.badges) {
    items.push(h('div', { class: 'prize' },
      h('div', { class: 'prize-medal badge-on' }, icon(b.icon)),
      h('div', null, h('strong', null, b.title), h('span', null, b.text))));
  }
  const button = h('button', { class: 'btn btn-primary btn-wide', type: 'button', onClick: close }, 'Fortsätt');
  const overlay = h('div', { class: 'celebrate', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Du har fått något nytt' },
    confetti(),
    h('div', { class: 'celebrate-card' },
      art('pal', 'celebrate-art'),
      h('h2', null, earned.level_up ? 'Ny nivå!' : earned.badges.length > 1 ? 'Nya märken!' : 'Nytt märke!'),
      earned.xp && earned.xp.total > 0 ? h('p', { class: 'chip tone-amber prize-xp' }, icon('sparkles'), `+${earned.xp.total} XP`) : null,
      h('div', { class: 'prizes' }, items),
      button));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', onKey);
  document.body.append(overlay);
  button.focus();
}
