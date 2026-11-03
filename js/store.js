// Shared state for the server and display windows.
// Both windows run in the same browser on the same computer, so localStorage
// is the single source of truth and the `storage` event keeps them in sync.

const KEY = 'caller:state';
const PING_KEY = 'caller:display-ping';

export const MAX_DIGITS = 4;
export const HISTORY_SHOWN = 5;
const HISTORY_KEPT = 50;

const defaults = () => ({
  current: null,   // { n, at }
  history: [],     // previously called, most recent first
  draft: '',       // digits typed but not yet called
  seq: 0,          // bumps on every call/repeat so the display knows to announce
  settings: { chime: true, voice: true },
});

export function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && typeof s === 'object') {
      const d = defaults();
      return { ...d, ...s, settings: { ...d.settings, ...s.settings } };
    }
  } catch { /* corrupt or unavailable storage: start fresh */ }
  return defaults();
}

const listeners = new Set();

export function subscribe(fn) {
  listeners.add(fn);
  fn(load());
  return () => listeners.delete(fn);
}

// The storage event only fires in *other* windows, so local changes notify directly.
window.addEventListener('storage', (e) => {
  if (e.key === KEY || e.key === null) listeners.forEach((fn) => fn(load()));
});

function update(mutate) {
  const s = load();
  if (mutate(s) === false) return;
  s.history = s.history.slice(0, HISTORY_KEPT);
  localStorage.setItem(KEY, JSON.stringify(s));
  listeners.forEach((fn) => fn(s));
}

function callNumber(s, n) {
  if (!Number.isInteger(n) || n <= 0) return false;
  if (s.current && s.current.n !== n) {
    s.history = [s.current, ...s.history.filter((h) => h.n !== n && h.n !== s.current.n)];
  }
  s.current = { n, at: Date.now() };
  s.seq += 1;
}

export const actions = {
  type: (digit) => update((s) => {
    if (s.draft.length >= MAX_DIGITS) return false;
    if (s.draft === '' && digit === '0') return false; // no leading zeros
    s.draft += digit;
  }),
  backspace: () => update((s) => { if (!s.draft) return false; s.draft = s.draft.slice(0, -1); }),
  clear: () => update((s) => { if (!s.draft) return false; s.draft = ''; }),
  submit: () => update((s) => {
    if (!s.draft) return false;
    const n = parseInt(s.draft, 10);
    s.draft = '';
    callNumber(s, n);
  }),
  call: (n) => update((s) => callNumber(s, n)),
  next: () => update((s) => {
    const limit = 10 ** MAX_DIGITS;
    const n = s.current ? (s.current.n + 1) % limit || 1 : 1;
    s.draft = '';
    callNumber(s, n);
  }),
  repeat: () => update((s) => { if (!s.current) return false; s.current.at = Date.now(); s.seq += 1; }),
  undo: () => update((s) => {
    if (!s.current) return false;
    s.current = s.history.shift() ?? null;
  }),
  reset: () => update((s) => {
    s.current = null; s.history = []; s.draft = '';
  }),
  setSetting: (key, value) => update((s) => { s.settings[key] = value; }),
};

// Heartbeat so the server window can show whether a display window is open.
export function startDisplayPing() {
  const beat = () => localStorage.setItem(PING_KEY, String(Date.now()));
  beat();
  setInterval(beat, 2000);
}

export function displayAlive() {
  const t = Number(localStorage.getItem(PING_KEY) || 0);
  return Date.now() - t < 5000;
}
