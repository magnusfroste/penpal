// PenPal – the page. One small single-page app: a hash router, the frame around every screen
// (logo, navigation) and the shared state. The screens are in js/views.js, the practice sheet in
// js/sheet.js. No framework, no build step, no inline script, and nothing from other hosts.

import { h, icon, art, toast } from './js/ui.js';
import { api } from './js/api.js';
import { landingView, authView, homeView, scanView, resultView, progressView, collectionView, adultsView } from './js/views.js';
import { sheetView } from './js/sheet.js';

const app = document.getElementById('app');
const state = { user: null, ai: { configured: false }, game: null, fresh: null };

const ROUTES = [
  { name: 'home', re: /^\/$/, view: (ctx) => (state.user ? homeView(ctx) : landingView(ctx)) },
  { name: 'auth', re: /^\/ny$/, guest: true, view: (ctx) => authView(ctx, 'signup') },
  { name: 'auth', re: /^\/logga-in$/, guest: true, view: (ctx) => authView(ctx, 'login') },
  { name: 'scan', re: /^\/skanna$/, auth: true, view: scanView },
  { name: 'result', re: /^\/resultat\/(\d+)$/, auth: true, view: resultView },
  { name: 'progress', re: /^\/framsteg$/, auth: true, view: progressView },
  { name: 'collection', re: /^\/samling$/, auth: true, view: collectionView },
  { name: 'adults', re: /^\/vuxna$/, view: adultsView },
  { name: 'sheet', re: /^\/blad\/(\d+)$/, auth: true, view: async (ctx, id) => sheetView((await api(`/api/scans/${id}`)).scan, `#/resultat/${id}`) },
];

const NAV = [
  { path: '/', icon: 'home', label: 'Hem', routes: ['home'] },
  { path: '/framsteg', icon: 'chart', label: 'Framsteg', routes: ['progress', 'result', 'sheet'] },
  { path: '/skanna', icon: 'camera', label: 'Skanna', routes: ['scan'], main: true },
  { path: '/samling', icon: 'abc', label: 'Samling', routes: ['collection'] },
  { path: '/vuxna', icon: 'shield', label: 'Vuxna', routes: ['adults'] },
];

const ctx = {
  state,
  go(path) {
    if (location.hash === `#${path}`) render(); else location.hash = path;
  },
  async loadGame() {
    state.game = await api('/api/game');
    return state.game;
  },
  signedIn(user) {
    state.user = user;
    ctx.go('/');
  },
  signedOut() {
    state.user = null;
    state.game = null;
    state.fresh = null;
    ctx.go('/');
  },
  async signOut() {
    try { await api('/api/auth/logout', {}); } catch (e) { /* signed out here either way */ }
    ctx.signedOut();
  },
};

function frame(route) {
  const nav = state.user ? h('nav', { class: 'nav no-print', 'aria-label': 'Meny' }, NAV.map((n) => h('a', {
    class: `nav-item${n.main ? ' nav-main' : ''}`, href: `#${n.path}`, 'aria-current': n.routes.includes(route.name) ? 'page' : null,
  }, h('span', { class: 'nav-icon' }, icon(n.icon)), h('span', { class: 'nav-label' }, n.label)))) : null;
  const main = h('main', { class: 'main', id: 'main', tabindex: '-1' });
  document.body.dataset.route = route.name;
  document.body.classList.toggle('signed-in', Boolean(state.user));
  const header =
    h('header', { class: 'topbar no-print' },
      h('a', { class: 'logo', href: '#/', 'aria-label': 'PenPal, till start' }, h('span', { class: 'logo-mark' }, icon('pen')), 'PenPal'),
      state.user ? h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Logga ut', title: 'Logga ut', onClick: () => ctx.signOut() }, icon('logout')) : null);
  // The menu sits beside the header, not inside it: the header's blur would trap a fixed-position child.
  app.replaceChildren(...[header, nav, main].filter(Boolean));
  return main;
}

const loading = () => h('div', { class: 'loading', role: 'status', 'aria-label': 'Laddar' }, art('pal', 'loading-art'));

function problem(err) {
  return h('div', { class: 'view' },
    h('section', { class: 'hero' },
      art('pal', 'hero-art'),
      h('h1', null, 'Hoppsan!'),
      h('p', { class: 'lead', role: 'alert' }, err.message || 'Något gick fel.')),
    h('div', { class: 'stack' },
      h('button', { class: 'btn btn-primary btn-big', type: 'button', onClick: render }, 'Försök igen'),
      h('a', { class: 'btn btn-soft btn-big', href: '#/' }, icon('home'), 'Till start')));
}

let turn = 0;
async function render() {
  const mine = ++turn;
  const path = location.hash.replace(/^#/, '') || '/';
  let params = null;
  const route = ROUTES.find((r) => { params = r.re.exec(path); return params; });
  if (!route) { ctx.go('/'); return; }
  if (route.auth && !state.user) { ctx.go('/logga-in'); return; }
  if (route.guest && state.user) { ctx.go('/'); return; }

  const main = frame(route);
  main.replaceChildren(loading());
  let node;
  try {
    node = await route.view(ctx, ...params.slice(1));
  } catch (err) {
    if (mine !== turn) return;
    if (err.status === 401) { ctx.signedOut(); return; }
    node = err.status === 404
      ? problem(new Error('Den sidan hittar jag inte. Den kanske är borttagen.'))
      : problem(err);
  }
  if (mine !== turn) return;
  main.replaceChildren(node);
  window.scrollTo(0, 0);
}

(async () => {
  try {
    const me = await api('/api/me');
    state.user = me.user;
    state.ai = me.ai;
  } catch (err) {
    toast(err.message, 'error');
  }
  window.addEventListener('hashchange', render);
  render();
})();
