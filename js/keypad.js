// Maps a USB numeric keypad (or a normal keyboard) to caller actions.
// Uses event.code first so the keypad works whether NumLock is on or off.
//
//   0-9      type digits          Enter   call typed number
//   +        call next number     -       undo last call
//   *        repeat announcement  /  Esc  clear typed digits
//   .  Del  Backspace             delete last digit

import { actions } from './store.js';

// Some cheap keypads send navigation keys when their own NumLock is off.
const NAV_DIGITS = {
  Insert: '0', End: '1', ArrowDown: '2', PageDown: '3', ArrowLeft: '4',
  Clear: '5', ArrowRight: '6', Home: '7', ArrowUp: '8', PageUp: '9',
};

export function actionFor(e) {
  if (e.ctrlKey || e.metaKey || e.altKey) return null;
  const { code, key } = e;

  if (/^Numpad[0-9]$/.test(code)) return ['type', code.slice(-1)];
  if (code === 'NumpadEnter' || key === 'Enter') return ['submit'];
  if (code === 'NumpadAdd' || key === '+') return ['next'];
  if (code === 'NumpadSubtract' || key === '-') return ['undo'];
  if (code === 'NumpadMultiply' || key === '*') return ['repeat'];
  if (code === 'NumpadDivide' || key === '/' || key === 'Escape') return ['clear'];
  if (code === 'NumpadDecimal' || key === 'Backspace' || key === 'Delete') return ['backspace'];
  if (/^[0-9]$/.test(key)) return ['type', key];
  if (key in NAV_DIGITS) return ['type', NAV_DIGITS[key]];
  return null;
}

export function attachKeypad(onPress = () => {}) {
  window.addEventListener('keydown', (e) => {
    const action = actionFor(e);
    if (!action) return;
    e.preventDefault();
    // Holding a key down should not call several numbers; only delete may repeat.
    if (e.repeat && action[0] !== 'backspace') return;
    actions[action[0]](action[1]);
    onPress(action);
  });
}
