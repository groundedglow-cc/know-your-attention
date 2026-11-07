// Soft, synthesized effects via Web Audio. No downloads, no background music.
// The AudioContext is created and resumed only after a user gesture, which
// also satisfies iOS Safari's autoplay restrictions.
export function createSounds({ createContext, storage } = {}) {
  let context;
  let enabled = true;
  let lastPlayed = -Infinity;
  try { enabled = storage?.getItem('tictactoe-sound') !== 'off'; } catch {}

  const melodies = {
    place: [[520, 720, 0, 0.09]],
    win: [[659, 659, 0, 0.12], [784, 784, 0.12, 0.12], [988, 988, 0.24, 0.14], [1175, 1175, 0.38, 0.3]],
    draw: [[523, 523, 0, 0.12], [659, 659, 0.12, 0.12], [587, 587, 0.24, 0.14]],
    lose: [[494, 494, 0, 0.14], [440, 440, 0.14, 0.16]],
  };
  const waves = { place: 'sine', win: 'triangle', draw: 'sine', lose: 'sine' };

  async function unlock() {
    try {
      context ||= createContext();
      if (context.state === 'suspended') await context.resume();
    } catch { /* audio must never block the game */ }
  }

  async function play(name) {
    if (!enabled || !melodies[name]) return;
    try {
      context ||= createContext();
      const requested = Date.now();
      if (context.state === 'suspended') await context.resume();
      if (!enabled || context.state !== 'running' || Date.now() - requested > 400) return;
      const now = context.currentTime;
      if (now - lastPlayed < 0.05) return;
      lastPlayed = now;
      for (const [from, to, delay, duration] of melodies[name]) {
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.type = waves[name] || 'sine';
        osc.frequency.setValueAtTime(from, now + delay);
        osc.frequency.exponentialRampToValueAtTime(to, now + delay + duration);
        gain.gain.setValueAtTime(0.0001, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.07, now + delay + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + duration);
        osc.connect(gain);
        gain.connect(context.destination);
        osc.onended = () => { osc.disconnect(); gain.disconnect(); };
        osc.start(now + delay);
        osc.stop(now + delay + duration + 0.01);
      }
    } catch { /* unsupported or blocked audio must never stop the game */ }
  }

  return {
    unlock,
    play,
    get enabled() { return enabled; },
    toggle() {
      enabled = !enabled;
      try { storage?.setItem('tictactoe-sound', enabled ? 'on' : 'off'); } catch {}
      if (!enabled && context) {
        const old = context;
        context = undefined;
        lastPlayed = -Infinity;
        try { Promise.resolve(old.close()).catch(() => {}); } catch {}
      }
      if (enabled) void play('place');
      return enabled;
    },
  };
}
