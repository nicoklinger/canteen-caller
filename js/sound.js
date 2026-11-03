// Chime (generated with Web Audio, no sound files) and spoken announcement.
// Browsers only allow audio after a click, so the display calls unlock() from one.

let ctx = null;

export function audioReady() {
  return ctx?.state === 'running';
}

export async function unlock() {
  ctx ??= new AudioContext();
  if (ctx.state !== 'running') await ctx.resume();
  // Prime speech synthesis inside the user gesture too.
  if ('speechSynthesis' in window) speechSynthesis.speak(new SpeechSynthesisUtterance(''));
}

// Try to start without a click (works when the browser allows autoplay, e.g. kiosk mode).
export function tryAutoUnlock() {
  try {
    ctx ??= new AudioContext();
    ctx.resume();
  } catch { /* ignore */ }
}

function tone(freq, start, duration) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.5, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration);
}

// Classic two-note "ding-dong". Returns its length in ms.
export function chime() {
  if (!audioReady()) return 0;
  const t = ctx.currentTime;
  tone(880, t, 0.9);
  tone(659.25, t + 0.45, 1.2);
  return 1300;
}

export function speak(n) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(`Number ${n}`);
  u.lang = 'en-GB';
  u.rate = 0.9;
  const voice = speechSynthesis.getVoices().find((v) => v.lang === 'en-GB');
  if (voice) u.voice = voice;
  speechSynthesis.speak(u);
}
