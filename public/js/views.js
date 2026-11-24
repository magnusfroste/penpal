// The screens. Each view returns a DOM node (or a promise of one); app.js puts it on the page.
// One clear thing to do on each screen, pictures before words.

import { h, s, icon, art, DIMS, DIM, VERDICT, trainsLabel, tier, stars, dots, toast, celebrate, fmtDateLong } from './ui.js';
import { api, preparePhoto } from './api.js';
import { scoreChart, sparkline } from './chart.js';

// ---------------------------------------------------------------- shared pieces

const demoNote = () => h('aside', { class: 'note' }, icon('info'),
  h('p', null, h('strong', null, 'Exempelsvar. '), 'AI:n är inte påslagen än, så PenPal tittar inte på bilden på riktigt. Så här kommer det att se ut!'));

function busy(button, on) {
  button.disabled = on;
  button.classList.toggle('is-busy', on);
}

const steps = () => {
  const step = (name, label) => h('li', null, art(name, 'step-art'), h('span', null, label));
  return h('ol', { class: 'steps', 'aria-label': 'Så funkar det' },
    step('photo', 'Fota'), step('tips', 'Få tips'), step('practice', 'Öva'), step('grow', 'Bli bättre'));
};

function levelCard(game) {
  const lv = game.level;
  const streak = game.streak.current;
  const barFill = h('i');
  barFill.style.width = `${Math.max(4, Math.round(lv.progress * 100))}%`;
  return h('section', { class: 'card level-card', 'aria-label': 'Din nivå' },
    h('div', { class: 'level-medal', 'aria-hidden': 'true' }, h('span', null, String(lv.n))),
    h('div', { class: 'level-body' },
      h('p', { class: 'level-name' }, h('small', null, `Nivå ${lv.n}`), lv.name),
      h('div', { class: 'bar', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(Math.round(lv.progress * 100)), 'aria-label': 'På väg mot nästa nivå' }, barFill),
      h('p', { class: 'level-xp' }, lv.xp_next ? `${game.xp} XP · ${lv.xp_next - game.xp} kvar till ${lv.next_name}` : `${game.xp} XP · högsta nivån!`)),
    h('div', { class: `streak${streak ? ' on' : ''}`, title: 'Dagar i rad som du har skannat' },
      icon('flame'), h('strong', null, String(streak)), h('span', null, streak === 1 ? 'dag i rad' : 'dagar i rad')));
}

function missionItem(m) {
  const d = DIM[m.trains];
  return h('li', { class: 'mission' },
    h('span', { class: `tile tone-${d ? d.tone : 'purple'}`, title: trainsLabel(m.trains) }, d ? icon(d.icon) : h('b', null, m.trains)),
    h('div', null, h('strong', null, m.title), h('p', null, m.instruction)));
}

const chip = (text, tone, iconName) => h('span', { class: `chip tone-${tone}` }, iconName ? icon(iconName) : null, text);

// ---------------------------------------------------------------- landing and sign-in

export function landingView() {
  return h('div', { class: 'view view-landing' },
    h('section', { class: 'hero' },
      art('pal', 'hero-art', 'PenPal – en glad penna med mantel'),
      h('h1', null, 'Din handstils superhjälte!'),
      h('p', { class: 'lead' }, 'Fota din handstil. Få snälla tips. Se hur du blir bättre!')),
    steps(),
    h('div', { class: 'stack' },
      h('a', { class: 'btn btn-primary btn-big', href: '#/ny' }, icon('sparkles'), 'Skapa konto'),
      h('a', { class: 'btn btn-soft btn-big', href: '#/logga-in' }, icon('user'), 'Logga in')),
    h('p', { class: 'foot-link' }, h('a', { href: '#/vuxna' }, icon('shield'), 'För vuxna')));
}

export function authView(ctx, mode) {
  const signup = mode === 'signup';
  const username = h('input', { id: 'f-user', name: 'username', type: 'text', autocomplete: 'username', autocapitalize: 'none', spellcheck: 'false', maxlength: '24', required: true });
  const password = h('input', { id: 'f-pass', name: 'password', type: 'password', autocomplete: signup ? 'new-password' : 'current-password', maxlength: '200', required: true });
  const display = h('input', { id: 'f-name', name: 'display_name', type: 'text', autocomplete: 'off', maxlength: '40' });
  const error = h('p', { class: 'form-error', role: 'alert', hidden: true });
  const submit = h('button', { class: 'btn btn-primary btn-big btn-wide', type: 'submit' }, signup ? 'Skapa konto' : 'Logga in');
  const field = (label, input, hint) => h('div', { class: 'field' },
    h('label', { for: input.id }, label), input, hint ? h('p', { class: 'field-hint' }, hint) : null);

  const onSubmit = async (e) => {
    e.preventDefault();
    error.hidden = true;
    busy(submit, true);
    try {
      const body = { username: username.value.trim(), password: password.value };
      if (signup && display.value.trim()) body.display_name = display.value.trim();
      const data = await api(signup ? '/api/auth/signup' : '/api/auth/login', body);
      ctx.signedIn(data.user);
    } catch (err) {
      error.textContent = err.message;
      error.hidden = false;
      busy(submit, false);
    }
  };

  return h('div', { class: 'view view-auth' },
    art('pal', 'auth-art'),
    h('h1', null, signup ? 'Hej! Vad kul att du är här' : 'Välkommen tillbaka!'),
    h('form', { class: 'card form', method: 'post', action: '#', novalidate: true, onSubmit },
      field('Användarnamn', username, signup ? 'Hitta på ett namn – använd inte ditt riktiga.' : null),
      field('Lösenord', password, signup ? 'Minst 6 tecken. Skriv upp det – det går inte att få ett nytt.' : null),
      signup ? field('Vad ska PenPal kalla dig? (om du vill)', display) : null,
      error,
      submit),
    h('p', { class: 'foot-link' }, signup
      ? h('a', { href: '#/logga-in' }, 'Har du redan ett konto? Logga in')
      : h('a', { href: '#/ny' }, 'Ny här? Skapa konto')));
}

// ---------------------------------------------------------------- home

export async function homeView(ctx) {
  const game = await ctx.loadGame();
  const cur = game.current;
  return h('div', { class: 'view view-home' },
    h('header', { class: 'hello' },
      art('pal', 'hello-art'),
      h('div', null,
        h('h1', null, `Hej ${ctx.state.user.display_name}!`),
        h('p', { class: 'lead' }, !cur ? 'Visa mig din handstil!' : game.streak.scanned_today ? 'Snyggt övat i dag!' : 'Redo att öva lite i dag?'))),
    levelCard(game),
    h('a', { class: 'btn btn-primary btn-big btn-wide', href: '#/skanna' }, icon('camera'), cur ? 'Skanna igen' : 'Skanna din handstil'),
    cur ? h('section', { class: 'card' },
      h('h2', { class: 'card-title' }, icon('target'), 'Dina uppdrag'),
      h('ul', { class: 'missions' }, cur.missions.map(missionItem)),
      h('div', { class: 'row' },
        h('a', { class: 'btn btn-soft', href: `#/blad/${cur.scan_id}` }, icon('print'), 'Övningsblad'),
        h('a', { class: 'btn btn-ghost', href: `#/resultat/${cur.scan_id}` }, 'Senaste resultatet', icon('chev'))))
      : steps(),
    ctx.state.ai.configured ? null : demoNote());
}

// ---------------------------------------------------------------- scan

// skolappar's usage snippet (kotten.js): anonymous counts only, never text, names or ids.
const report = (name, value) => { try { window.skolappar?.event(name, value); } catch (e) { /* the app works without it */ } };

export function scanView(ctx) {
  const root = h('div', { class: 'view view-scan' });

  const input = (camera) => h('input', {
    class: 'visually-hidden', type: 'file', accept: 'image/*', capture: camera ? 'environment' : null,
    onChange: (e) => {
      const file = e.target.files && e.target.files[0];
      e.target.value = '';
      if (file) analyse(file);
    },
  });

  // message: a kind request for a new photo (not handwriting, unreadable, or something went wrong)
  const pick = (message) => {
    root.replaceChildren(
      h('section', { class: 'hero' },
        art(message ? 'pal' : 'photo', 'hero-art'),
        h('h1', null, message ? 'Vi provar en gång till!' : 'Visa din handstil'),
        h('p', { class: 'lead', role: message ? 'alert' : null }, message || 'Skriv några ord på ett papper och ta en bild.')),
      h('div', { class: 'stack' },
        h('label', { class: 'btn btn-primary btn-big' }, input(true), icon('camera'), 'Ta foto'),
        h('label', { class: 'btn btn-soft btn-big' }, input(false), icon('image'), 'Välj bild')),
      h('ul', { class: 'photo-tips', 'aria-label': 'Tips för ett bra foto' },
        h('li', null, h('span', { class: 'tile tone-amber' }, icon('sun')), 'Bra ljus'),
        h('li', null, h('span', { class: 'tile tone-blue' }, icon('frame')), 'Hela texten'),
        h('li', null, h('span', { class: 'tile tone-green' }, icon('pen')), 'Bara texten – inget namn')),
      ctx.state.ai.configured ? null : demoNote());
  };

  const analyse = async (file) => {
    if (file.type && !file.type.startsWith('image/')) { toast('Det där var ingen bild. Välj ett foto!', 'error'); return; }
    const photo = h('img', { alt: '' });
    root.replaceChildren(h('section', { class: 'scanning' },
      h('div', { class: 'scan-photo' }, photo, h('i', { class: 'scan-beam' })),
      h('h1', { role: 'status' }, 'Jag tittar på dina bokstäver …'),
      h('p', { class: 'lead' }, 'Det tar en liten stund.')));
    report('round_start');
    try {
      const { image, thumb } = await preparePhoto(file);
      photo.src = image;
      const data = await api('/api/scans', { image, thumb });
      if (data.retake) { report('hint'); pick(data.retake.message); return; }
      report('round_done', data.scan.score);
      if (data.earned && data.earned.level_up) report('level', data.earned.level_up.n);
      ctx.state.game = data.game;
      ctx.state.fresh = { id: data.scan.id, earned: data.earned };
      if (root.isConnected) ctx.go(`/resultat/${data.scan.id}`);
      else toast('Din analys är klar! Du hittar den under Framsteg.');
    } catch (err) {
      if (err.status === 401) { ctx.signedOut(); return; }
      if (root.isConnected) pick(err.message); else toast(err.message, 'error');
    }
  };

  pick();
  return root;
}

// ---------------------------------------------------------------- result

function ring(score) {
  const C = 2 * Math.PI * 52;
  return h('div', { class: 'ring', role: 'img', 'aria-label': `${score} poäng av 100` },
    s('svg', { viewBox: '0 0 120 120', 'aria-hidden': 'true' },
      s('circle', { class: 'ring-bg', cx: 60, cy: 60, r: 52 }),
      s('circle', { class: 'ring-fg', cx: 60, cy: 60, r: 52, transform: 'rotate(-90 60 60)', 'stroke-dasharray': `${((score / 100) * C).toFixed(1)} ${C.toFixed(1)}` })),
    h('div', { class: 'ring-label' }, h('strong', null, String(score)), h('span', null, 'av 100')));
}

function sinceLast(r) {
  const diff = r.score_to - r.score_from;
  const moved = r.changes.filter((c) => c.to !== c.from);
  return h('section', { class: 'card since' },
    h('h2', { class: 'card-title' }, icon('trend'), 'Sedan sist'),
    h('div', { class: 'since-score' },
      h('span', { class: 'from' }, String(r.score_from)), icon('arrow-right'), h('strong', null, String(r.score_to)),
      diff > 0 ? chip(`+${diff} poäng`, 'green', 'trend') : null),
    h('p', { class: 'since-text' }, r.improved),
    moved.length || r.letters_fixed.length ? h('div', { class: 'chips' },
      moved.map((c) => chip(`${DIM[c.key].short} ${c.from} → ${c.to}`, c.to > c.from ? 'green' : 'muted', DIM[c.key].icon)),
      r.letters_fixed.map((l) => chip(`${l} är fin nu!`, 'blue', 'sparkles'))) : null,
    h('h3', null, 'Dina uppdrag från förra gången'),
    h('ul', { class: 'verdicts' }, r.missions.map((m) => {
      const v = VERDICT[m.result] || VERDICT.inte_an;
      return h('li', { class: `verdict tone-${v.tone}` },
        h('span', { class: 'verdict-mark' }, icon(v.icon)),
        h('div', null,
          h('p', { class: 'verdict-head' }, h('strong', null, m.title), h('em', null, v.label)),
          h('p', null, m.comment)));
    })));
}

function scoreCard(scan) {
  const t = tier(scan.score);
  return h('section', { class: 'card score-card' },
    ring(scan.score),
    h('div', { class: 'score-text' },
      stars(scan.score),
      h('h1', null, t.title),
      h('p', null, scan.analysis.summary)));
}

function dimsCard(a, review) {
  return h('section', { class: 'card' },
    h('h2', { class: 'card-title' }, icon('pen'), 'Så ser din handstil ut'),
    h('div', { class: 'dims' }, DIMS.map((d) => {
      const v = a.dimensions[d.key];
      const change = review ? review.changes.find((c) => c.key === d.key) : null;
      const up = change ? change.to - change.from : 0;
      return h('details', { class: 'dim' },
        h('summary', null,
          h('span', { class: `tile tone-${d.tone}` }, icon(d.icon)),
          h('span', { class: 'dim-label' }, d.label, up > 0 ? h('span', { class: 'dim-up' }, `+${up}`) : null),
          dots(v.score),
          icon('chev', 'dim-chev')),
        h('p', null, v.comment));
    })));
}

const listCard = (title, iconName, tone, items) => h('section', { class: `card tinted tone-${tone}` },
  h('h2', { class: 'card-title' }, icon(iconName), title),
  h('ul', { class: 'bullets' }, items.map((t) => h('li', null, t))));

function lettersCard(a) {
  if (!a.perfect_letters.length && !a.practice_letters.length) return null;
  const group = (title, letters, tone) => (letters.length ? h('div', { class: 'letter-group' },
    h('h3', null, title),
    h('div', { class: 'letter-chips' }, letters.map((l) => h('span', { class: `letter tone-${tone}` }, l)))) : null);
  return h('section', { class: 'card' },
    h('h2', { class: 'card-title' }, icon('abc'), 'Dina bokstäver'),
    group('Ser bra ut', a.perfect_letters, 'blue'),
    group('Öva på', a.practice_letters, 'purple'));
}

export async function resultView(ctx, id) {
  const { scan } = await api(`/api/scans/${id}`);
  const fresh = ctx.state.fresh && ctx.state.fresh.id === scan.id ? ctx.state.fresh : null;
  ctx.state.fresh = null;
  const a = scan.analysis;

  const remove = h('button', { class: 'btn btn-ghost btn-danger', type: 'button', onClick: async () => {
    if (!window.confirm('Ta bort den här skanningen och bilden? Det går inte att ångra.')) return;
    busy(remove, true);
    try {
      await api(`/api/scans/${scan.id}/delete`, {});
      toast('Skanningen är borttagen.');
      ctx.go('/framsteg');
    } catch (err) { busy(remove, false); toast(err.message, 'error'); }
  } }, icon('trash'), 'Ta bort skanningen');

  const view = h('div', { class: 'view view-result' },
    h('p', { class: 'crumb' }, h('a', { href: '#/framsteg' }, icon('arrow-left'), 'Framsteg'), h('span', null, fmtDateLong(scan.created_at))),
    scan.demo ? demoNote() : null,
    scan.review ? sinceLast(scan.review) : null,
    scoreCard(scan),
    dimsCard(a, scan.review),
    listCard('Det här gör du bra', 'heart', 'green', a.strengths),
    a.improvements.length ? listCard('Nästa steg', 'rocket', 'amber', a.improvements) : null,
    a.tips.length ? listCard('Tips', 'bulb', 'blue', a.tips) : null,
    lettersCard(a),
    h('section', { class: 'card' },
      h('h2', { class: 'card-title' }, icon('target'), 'Tre uppdrag till nästa gång'),
      h('ul', { class: 'missions' }, a.missions.map(missionItem)),
      h('a', { class: 'btn btn-primary btn-wide', href: `#/blad/${scan.id}` }, icon('print'), 'Skriv ut övningsblad')),
    h('details', { class: 'card photo' },
      h('summary', null, icon('image'), 'Mitt foto', icon('chev', 'dim-chev')),
      h('img', { src: `/api/scans/${scan.id}/image`, alt: 'Fotot du tog av din handstil', loading: 'lazy' }),
      a.written_text ? h('p', { class: 'read' }, h('span', null, 'Jag läste: '), a.written_text) : null,
      remove),
    h('a', { class: 'btn btn-soft btn-big btn-wide', href: '#/skanna' }, icon('camera'), 'Skanna igen'));

  if (fresh) {
    setTimeout(() => {
      const xp = fresh.earned.xp;
      const prize = fresh.earned.level_up || fresh.earned.badges.length;
      if (prize) celebrate(fresh.earned);                      // the card shows the XP too
      else if (xp && xp.total > 0) toast(`+${xp.total} XP`, 'xp');
      else toast('Bra övat! Du har redan fått dagens XP – kom tillbaka i morgon.');
    }, 500);
  }
  return view;
}

// ---------------------------------------------------------------- progress

export async function progressView() {
  const p = await api('/api/progress');
  if (!p.points.length) {
    return h('div', { class: 'view' },
      h('section', { class: 'hero' },
        art('grow', 'hero-art'),
        h('h1', null, 'Här växer din kurva'),
        h('p', { class: 'lead' }, 'Skanna din handstil så ser du hur du blir bättre.')),
      h('a', { class: 'btn btn-primary btn-big btn-wide', href: '#/skanna' }, icon('camera'), 'Skanna din handstil'));
  }
  const many = p.points.length > 1;
  const diff = many ? p.change.score : 0;
  return h('div', { class: 'view view-progress' },
    h('h1', null, 'Dina framsteg'),
    h('section', { class: 'card' },
      h('div', { class: 'since-score' },
        many ? [h('span', { class: 'from' }, String(p.first.score)), icon('arrow-right')] : null,
        h('strong', null, String(p.latest.score)),
        h('span', { class: 'unit' }, 'poäng'),
        diff > 0 ? chip(`+${diff} sedan starten`, 'green', 'trend') : null),
      scoreChart(p.points),
      many ? null : h('p', { class: 'hint' }, 'Skanna igen så växer din kurva!')),
    h('section', { class: 'spark-grid' }, DIMS.map((d) => {
      const values = p.points.map((pt) => pt.dimensions[d.key]);
      const first = values[0];
      const latest = values[values.length - 1];
      return h('div', { class: `card spark-card tone-${d.tone}` },
        h('div', { class: 'spark-head' }, h('span', { class: `tile tone-${d.tone}` }, icon(d.icon)), h('strong', null, d.short)),
        sparkline(values, d.label),
        h('p', { class: 'spark-value' }, many && first !== latest ? `${first} → ${latest}` : `${latest} av 5`));
    })),
    h('h2', null, 'Alla skanningar'),
    h('ul', { class: 'history' }, [...p.points].reverse().map((pt) => h('li', null,
      h('a', { class: 'history-item', href: `#/resultat/${pt.id}` },
        h('img', { src: `/api/scans/${pt.id}/thumb`, alt: '', loading: 'lazy', width: '64', height: '64' }),
        h('span', { class: 'history-text' }, h('strong', null, fmtDateLong(pt.created_at)), stars(pt.score)),
        h('span', { class: 'history-score' }, String(pt.score)),
        icon('chev'))))));
}

// ---------------------------------------------------------------- collection

const LETTER_STATE = { fin: 'fin', ova: 'övar', ny: 'inte sedd än' };

export async function collectionView(ctx) {
  const game = await ctx.loadGame();
  const earned = game.badges.filter((b) => b.earned).length;
  return h('div', { class: 'view view-collection' },
    h('h1', null, 'Din samling'),
    levelCard(game),
    h('section', { class: 'card' },
      h('h2', { class: 'card-title' }, icon('abc'), 'Bokstäver', h('span', { class: 'count' }, `${game.counts.fine_letters} av ${game.letters.length}`)),
      h('div', { class: 'alphabet' }, game.letters.map((l) => h('span', { class: `abc abc-${l.state}`, role: 'img', 'aria-label': `${l.letter}: ${LETTER_STATE[l.state]}` },
        l.letter, l.state === 'fin' ? icon('star') : null))),
      h('p', { class: 'legend' },
        h('span', null, h('i', { class: 'abc abc-fin' }), 'Fin'),
        h('span', null, h('i', { class: 'abc abc-ova' }), 'Övar'),
        h('span', null, h('i', { class: 'abc abc-ny' }), 'Inte sedd än'))),
    h('section', { class: 'card' },
      h('h2', { class: 'card-title' }, icon('medal'), 'Märken', h('span', { class: 'count' }, `${earned} av ${game.badges.length}`)),
      h('ul', { class: 'badges' }, game.badges.map((b) => h('li', { class: b.earned ? 'badge on' : 'badge' },
        h('span', { class: 'badge-icon' }, icon(b.earned ? b.icon : 'lock')),
        h('strong', null, b.title),
        h('span', null, b.text))))),
    h('section', { class: 'card' },
      h('h2', { class: 'card-title' }, icon('trophy'), 'Nivåer'),
      h('ol', { class: 'ladder' }, game.levels.map((l) => h('li', { class: l.n === game.level.n ? 'now' : l.n < game.level.n ? 'done' : '' },
        h('b', null, String(l.n)), h('span', null, l.name), h('small', null, `${l.xp} XP`)))),
      h('p', { class: 'hint' }, `Du får ${game.rules.xp.scan} XP när du skannar och ${game.rules.xp.klarat} XP för varje uppdrag du klarar. Upp till ${game.rules.xp_scans_per_day} skanningar om dagen ger XP.`)));
}

// ---------------------------------------------------------------- for grown-ups

export function adultsView(ctx) {
  const user = ctx.state.user;
  const password = h('input', { id: 'f-del', type: 'password', autocomplete: 'current-password', maxlength: '200' });
  const error = h('p', { class: 'form-error', role: 'alert', hidden: true });
  const del = h('button', { class: 'btn btn-danger-solid btn-wide', type: 'submit' }, icon('trash'), 'Ta bort kontot och allt i det');
  const onDelete = async (e) => {
    e.preventDefault();
    error.hidden = true;
    if (!password.value) { error.textContent = 'Skriv lösenordet först.'; error.hidden = false; return; }
    if (!window.confirm(`Ta bort kontot ${user.username} med alla bilder och all återkoppling? Det går inte att ångra.`)) return;
    busy(del, true);
    try {
      await api('/api/auth/delete', { password: password.value });
      toast('Kontot och allt i det är borttaget.');
      ctx.signedOut();
    } catch (err) {
      error.textContent = err.message;
      error.hidden = false;
      busy(del, false);
    }
  };
  const block = (iconName, title, ...kids) => h('section', { class: 'card prose' }, h('h2', { class: 'card-title' }, icon(iconName), title), kids);

  return h('div', { class: 'view view-adults' },
    h('h1', null, 'För vuxna'),
    block('heart', 'Vad PenPal är',
      h('p', null, 'PenPal är en handstilscoach för barn. Barnet fotar något hen har skrivit för hand, får uppmuntrande återkoppling och tre små uppdrag, övar och fotar igen – och ser sin egen utveckling.')),
    block('lock', 'Det här sparas',
      h('ul', { class: 'bullets' },
        h('li', null, 'Ett användarnamn och, om ni vill, ett visningsnamn.'),
        h('li', null, 'Lösenordet – bara som en envägskod som inte går att läsa.'),
        h('li', null, 'Bilderna barnet fotar och återkopplingen på dem, med datum.')),
      h('p', null, 'Ingen e-postadress, inget riktigt namn, inga annonser och ingen spårning. Sidan hämtar ingenting från andra webbplatser. En enda kaka används – för att hålla barnet inloggat.')),
    block('sparkles', 'Bilderna och AI',
      h('p', null, 'För att kunna ge återkoppling skickas varje foto till en AI-tjänst som analyserar handstilen. Tillsammans med bilden skickas förra gångens poäng och uppdrag – aldrig användarnamnet.'),
      h('p', null, h('strong', null, ctx.state.ai.configured ? 'AI är påslagen. ' : 'AI är inte påslagen just nu. '),
        ctx.state.ai.configured ? 'Ett barn kan göra ett begränsat antal analyser per dag.' : 'Appen visar exempelsvar och inga bilder skickas någonstans.'),
      h('p', null, 'Tips: fota bara själva texten – inga ansikten, namn eller adresser.')),
    block('star', 'Så räknas poäng och XP',
      h('p', null, 'Handstilen bedöms i fem delar: bokstävernas form, storlek och jämnhet, mellanrum, om texten håller linjen samt lutning och flyt. Varje del får 1–5 och ger upp till 20 poäng, alltså 20–100 poäng totalt.'),
      h('p', null, 'XP, nivåer och märken följer riktig övning: en skanning ger XP (högst tre per dag), och uppdrag ger XP först när nästa foto visar att de har gått bra.')),
    block('info', 'Bra att veta',
      h('p', null, 'Det finns ingen e-postadress kopplad till kontot, så ett glömt lösenord går inte att återställa. Skriv upp det.'),
      h('p', null, 'En enskild skanning tas bort under "Mitt foto" på resultatsidan.')),
    user ? h('form', { class: 'card form', method: 'post', action: '#', novalidate: true, onSubmit: onDelete },
      h('h2', { class: 'card-title' }, icon('trash'), 'Ta bort kontot'),
      h('p', null, `Tar bort kontot ${user.username}: alla bilder, all återkoppling och alla poäng. Det går inte att ångra.`),
      h('div', { class: 'field' }, h('label', { for: 'f-del' }, 'Lösenord'), password),
      error,
      del) : null,
    user ? h('button', { class: 'btn btn-soft btn-wide', type: 'button', onClick: () => ctx.signOut() }, icon('logout'), 'Logga ut')
      : h('a', { class: 'btn btn-soft btn-wide', href: '#/' }, icon('arrow-left'), 'Tillbaka'));
}
