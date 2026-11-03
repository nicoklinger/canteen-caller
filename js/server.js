import { subscribe, actions, displayAlive, HISTORY_SHOWN } from './store.js';
import { attachKeypad } from './keypad.js';
import { registerServiceWorker } from './sw-register.js';

const $ = (id) => document.getElementById(id);
const draftEl = $('draft');
const currentEl = $('current');
const historyEl = $('history');
const statusEl = $('status');
const chimeEl = $('chime');
const voiceEl = $('voice');

function render(state) {
  if (state.draft) {
    draftEl.textContent = state.draft;
    draftEl.classList.add('active');
  } else {
    draftEl.innerHTML = '<span class="placeholder">Type a number, press Enter</span>';
    draftEl.classList.remove('active');
  }

  currentEl.textContent = state.current?.n ?? '–';

  const recent = state.history.slice(0, HISTORY_SHOWN * 2);
  if (recent.length) {
    historyEl.replaceChildren(...recent.map((h) => {
      const b = document.createElement('button');
      b.textContent = h.n;
      b.title = `Call ${h.n} again`;
      b.addEventListener('click', () => actions.call(h.n));
      return b;
    }));
  } else {
    historyEl.innerHTML = '<span class="none">Nothing yet</span>';
  }

  chimeEl.checked = state.settings.chime;
  voiceEl.checked = state.settings.voice;
}

// On-screen keypad (mouse/touch), and a press flash when the USB keypad is used.
const padButtons = [...document.querySelectorAll('#pad button')];
padButtons.forEach((b) => {
  b.addEventListener('click', () => actions[b.dataset.act](b.dataset.arg));
  b.addEventListener('mousedown', (e) => e.preventDefault()); // keep keyboard focus off buttons
});

function flashKey([act, arg]) {
  const b = padButtons.find((x) => x.dataset.act === act && (x.dataset.arg ?? undefined) === arg);
  if (!b) return;
  b.classList.add('pressed');
  setTimeout(() => b.classList.remove('pressed'), 120);
}

function updateStatus() {
  const ok = displayAlive();
  statusEl.classList.toggle('ok', ok);
  statusEl.querySelector('b').textContent = ok ? 'Display connected' : 'Display not open';
}

$('open-display').addEventListener('click', () => {
  window.open('display.html', 'caller-display', 'popup,width=1280,height=720');
});
$('test').addEventListener('click', () => actions.repeat());
$('reset').addEventListener('click', () => {
  if (confirm('Clear the current number and the whole history?')) actions.reset();
});
chimeEl.addEventListener('change', () => actions.setSetting('chime', chimeEl.checked));
voiceEl.addEventListener('change', () => actions.setSetting('voice', voiceEl.checked));
// Checkboxes must not swallow keypad presses (Enter/space) after being clicked.
[chimeEl, voiceEl].forEach((el) => el.addEventListener('change', () => el.blur()));

subscribe(render);
attachKeypad(flashKey);
updateStatus();
setInterval(updateStatus, 1000);
registerServiceWorker();
