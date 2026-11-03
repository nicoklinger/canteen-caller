import { subscribe, startDisplayPing, HISTORY_SHOWN } from './store.js';
import { attachKeypad } from './keypad.js';
import { unlock, tryAutoUnlock, audioReady, chime, speak } from './sound.js';
import { registerServiceWorker } from './sw-register.js';

const $ = (id) => document.getElementById(id);
const nowEl = $('now');
const currentEl = $('current');
const historyEl = $('history');
const typingEl = $('typing');
const startEl = $('start');
const soundHintEl = $('sound-hint');

let lastSeq = null;
let settings = {};

function render(state) {
  settings = state.settings;

  const n = state.current?.n;
  currentEl.textContent = n ?? '–';
  currentEl.dataset.len = n ? String(n).length : 0;

  const historyKey = state.history.slice(0, HISTORY_SHOWN).map((h) => h.n).join(',');
  if (historyKey !== historyEl.dataset.key) {
    historyEl.dataset.key = historyKey;
    renderHistory(state);
  }

  // Staff may type with this window focused; show what they type, discreetly.
  typingEl.hidden = !state.draft;
  typingEl.textContent = state.draft ? `⌨ ${state.draft}` : '';

  if (lastSeq !== null && state.seq !== lastSeq && n) announce(n, n !== lastNumber);
  lastSeq = state.seq;
  lastNumber = n;
}

function renderHistory(state) {
  historyEl.replaceChildren(...Array.from({ length: HISTORY_SHOWN }, (_, i) => {
    const li = document.createElement('li');
    const h = state.history[i];
    if (h) li.textContent = h.n;
    else li.className = 'empty';
    return li;
  }));
}

let lastNumber = null;
let flashTimer = null;

function restartAnimation(el, cls) {
  el.classList.remove(cls);
  void el.offsetWidth; // force reflow so the animation plays again
  el.classList.add(cls);
}

function announce(n, isNew) {
  restartAnimation(nowEl, 'flash');
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => nowEl.classList.remove('flash'), 3200); // back to the idle glow
  if (isNew) restartAnimation(historyEl, 'shift');

  const delay = settings.chime ? chime() : 0;
  if (settings.voice) setTimeout(() => speak(n), Math.max(0, delay - 400));
}

let wakeLock = null;
async function keepAwake() {
  try { wakeLock = await navigator.wakeLock?.request('screen'); } catch { /* not supported */ }
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && wakeLock) keepAwake();
});

function updateSoundHint() {
  soundHintEl.hidden = !startEl.hidden || audioReady();
}

async function start() {
  startEl.hidden = true;
  await unlock().catch(() => {});
  document.documentElement.requestFullscreen?.().catch(() => {});
  keepAwake();
  updateSoundHint();
}

startEl.addEventListener('click', start);
soundHintEl.addEventListener('click', start);
document.addEventListener('click', () => { if (!audioReady()) start(); });

tryAutoUnlock();
setTimeout(() => {
  // If the browser let audio start on its own (kiosk mode), skip the start screen.
  if (audioReady()) { startEl.hidden = true; keepAwake(); }
  updateSoundHint();
}, 300);

const clockEl = $('clock');
function tick() {
  clockEl.textContent = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}
tick();
setInterval(tick, 10000);

subscribe(render);
attachKeypad();
startDisplayPing();
registerServiceWorker();
