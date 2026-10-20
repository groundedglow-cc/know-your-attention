// Soft, synthesized effects: no downloads, microphone or background playback.
// AudioContext is created/resumed only in response to a user interaction.
export function createSounds({ createContext, storage } = {}) {
  let context, enabled=true, lastPlayed=-Infinity;
  try { enabled=storage?.getItem('candy-sound')!=='off'; } catch {}
  const melodies={
    // Small major-key gestures feel playful without becoming distracting.
    rotate:[[660,1040,0,.075]],
    recycle:[[740,980,0,.085],[980,720,.08,.12]],
    blocked:[[320,240,0,.075],[240,205,.08,.075]],
    place:[[560,820,0,.085]],
    success:[[659,659,0,.12],[784,784,.12,.12],[1047,1047,.24,.20]],
    guide:[[587,880,0,.09],[880,1175,.09,.12]],
    guideRotate:[[587,880,0,.075],[880,1175,.075,.12]],
    guideDone:[[659,659,0,.11],[784,784,.11,.11],[1047,1047,.22,.19]],
  };
  const waves={blocked:'triangle',rotate:'triangle',place:'sine',recycle:'sine',success:'triangle',guide:'triangle',guideRotate:'triangle',guideDone:'triangle'};
  async function play(name) {
    if(!enabled||!melodies[name])return;
    try {
      context ||= createContext();
      // Drop delayed effects if the browser cannot unlock audio immediately.
      const requested=Date.now();
      if(context.state==='suspended')await context.resume();
      if(!enabled||context.state!=='running'||Date.now()-requested>400)return;
      const now=context.currentTime;
      if(now-lastPlayed<.055)return;
      lastPlayed=now;
      for(const [from,to,delay,duration] of melodies[name]){
        const oscillator=context.createOscillator(), gain=context.createGain();
        oscillator.type=waves[name] || 'sine';
        oscillator.frequency.setValueAtTime(from,now+delay);
        oscillator.frequency.exponentialRampToValueAtTime(to,now+delay+duration);
        gain.gain.setValueAtTime(.0001,now+delay);
        gain.gain.exponentialRampToValueAtTime(name==='blocked'?.045:.065,now+delay+.008);
        gain.gain.exponentialRampToValueAtTime(.0001,now+delay+duration);
        oscillator.connect(gain);gain.connect(context.destination);
        oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
        oscillator.start(now+delay);oscillator.stop(now+delay+duration+.01);
      }
    } catch { /* Unsupported or blocked audio must never stop the game. */ }
  }
  return {
    play,
    speak(text) {
      if (!enabled || !text || typeof globalThis.speechSynthesis === 'undefined' || typeof globalThis.SpeechSynthesisUtterance === 'undefined') return;
      try {
        globalThis.speechSynthesis.cancel();
        const utterance = new globalThis.SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-CN';
        utterance.rate = .82;
        utterance.pitch = 1.12;
        utterance.volume = .82;
        globalThis.speechSynthesis.speak(utterance);
      } catch { /* Speech is an enhancement; it must never block the game. */ }
    },
    get enabled(){return enabled;},
    toggle(){
      enabled=!enabled;
      try{storage?.setItem('candy-sound',enabled?'on':'off');}catch{}
      if(!enabled&&context){const old=context;context=undefined;lastPlayed=-Infinity;try{Promise.resolve(old.close()).catch(()=>{});}catch{}}
      if(enabled)void play('place');
      return enabled;
    },
  };
}
