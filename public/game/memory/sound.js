export function createSounds(storage) {
  let enabled = true, context, nodes = [];
  let wordAudio, finishWord = null;
  try { enabled = storage?.getItem('memory-sound') !== 'off'; } catch {}
  const tones = { flip: [[500, .07]], match: [[660,.1],[880,.15]], win: [[523,.1],[659,.1],[784,.13],[1047,.3]] };
  function stopWord() { if (!wordAudio) return; wordAudio.pause(); wordAudio.currentTime = 0; finishWord?.(); finishWord = null; }
  function stop() { nodes.forEach(n => { try { n.stop(); } catch {} }); nodes = []; stopWord(); }
  async function play(name) { if (!enabled) return; try { context ||= new (window.AudioContext || window.webkitAudioContext)(); if (context.state === 'suspended') await context.resume(); const t = context.currentTime; tones[name].forEach(([frequency, duration], i) => { const o=context.createOscillator(), g=context.createGain(); o.type='sine'; o.frequency.value=frequency; g.gain.setValueAtTime(.0001,t+i*.12); g.gain.exponentialRampToValueAtTime(.06,t+i*.12+.01); g.gain.exponentialRampToValueAtTime(.0001,t+i*.12+duration); o.connect(g).connect(context.destination); o.start(t+i*.12); o.stop(t+i*.12+duration+.02); nodes.push(o); }); } catch {} }
  // Resolves when the word has finished (or was interrupted), so callers can
  // place a success cue after pronunciation instead of playing over it.
  function speak(src) {
    if (!enabled || !src) return Promise.resolve();
    stopWord();
    return new Promise(resolve => {
      try {
        wordAudio = new Audio();
        wordAudio.preload = 'auto';
        wordAudio.src = src;
        let done = false;
        const finish = () => { if (done) return; done = true; if (finishWord === finish) finishWord = null; resolve(); };
        finishWord = finish;
        wordAudio.addEventListener('ended', finish, { once: true });
        wordAudio.addEventListener('error', finish, { once: true });
        wordAudio.load();
        wordAudio.play().catch(finish);
      } catch { resolve(); }
    });
  }
  return { play, speak, get enabled() { return enabled; }, toggle() { enabled = !enabled; try { storage?.setItem('memory-sound', enabled ? 'on' : 'off'); } catch {} if (!enabled) stop(); return enabled; } };
}
