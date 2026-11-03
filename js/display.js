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

  historyEl.replaceChildren(...Array.from({ length: HISTORY_SHOWN }, (_, i) => {
    const li = document.createElement('li');
    const h = state.history[i];
    if (h) li.textContent = h.n;
    else li.className = 'empty';
    return li;
  }));

  // Staff may type with this window focused; show what they type, discreetly.
  typingEl.hidden = !state.draft;
  typingEl.textContent = state.draft ? `⌨ ${state.draft}` : '';

  if (lastSeq !== null && state.seq !== lastSeq && n) announce(n);
  lastSeq = state.seq;
}

function announce(n) {
  nowEl.classList.remove('flash');
  void nowEl.offsetWidth; // restart the animation
  nowEl.classList.add('flash');

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

subscribe(render);
attachKeypad();
startDisplayPing();
registerServiceWorker();
