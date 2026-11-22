// Oscillators only. Audio is optional and created inside a user gesture.
export function createAudio() {
  let context = null, master = null, muted = false, unavailable = false;
  function unlock() {
    if (unavailable) return;
    try {
      if (!context) {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) { unavailable = true; return; }
        context = new Audio(); master = context.createGain();
        master.gain.value = muted ? 0 : .22; master.connect(context.destination);
      }
      if (context.state === 'suspended') context.resume().catch(() => {});
    } catch { unavailable = true; }
  }
  function tone(frequency, duration, delay = 0, volume = .25, type = 'sine', finish = frequency) {
    if (!context || context.state !== 'running' || muted || unavailable) return;
    try {
      const at = context.currentTime + delay;
      const oscillator = context.createOscillator(), gain = context.createGain();
      oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, at);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, finish), at + duration);
      gain.gain.setValueAtTime(.0001, at); gain.gain.exponentialRampToValueAtTime(volume, at + .008);
      gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
      oscillator.connect(gain); gain.connect(master); oscillator.start(at); oscillator.stop(at + duration + .02);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    } catch { /* Some browsers revoke audio when the tab loses focus. */ }
  }
  function arpeggio(notes, spacing = .1, volume = .3) {
    notes.forEach((n, i) => tone(n, .36, i * spacing, volume, 'triangle'));
  }
  function play(name) {
    if (name === 'step') tone(115, .045, 0, .14, 'triangle', 65);
    else if (name === 'sneak') tone(94, .035, 0, .055, 'sine', 65);
    else if (name === 'pickup') arpeggio([660, 990, 1320], .065, .22);
    else if (name === 'pebble') { tone(1830, .09, 0, .2, 'triangle', 700); tone(920, .08, .055, .1); }
    else if (name === 'alert') { tone(240, .42, 0, .27, 'sawtooth', 760); tone(302, .45, .07, .16, 'triangle', 906); }
    else if (name === 'caught') { tone(180, .45, 0, .4, 'triangle', 42); tone(91, .4, .09, .22); }
    else if (name === 'clear') arpeggio([330, 440, 554, 660, 880], .095);
    else if (name === 'win') arpeggio([330, 440, 554, 660, 880, 1108, 1320], .13, .35);
    else if (name === 'start') arpeggio([220, 330, 440], .09, .16);
  }
  function setMuted(value) {
    muted = value;
    if (master && context) { try { master.gain.setTargetAtTime(muted ? 0 : .22, context.currentTime, .03); } catch {} }
  }
  return { unlock, play, setMuted };
}
