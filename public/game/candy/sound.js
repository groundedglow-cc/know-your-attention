// Soft, synthesized effects: no downloads, microphone or background playback.
// AudioContext is created/resumed only in response to a user interaction.
export function createSounds({ createContext, storage } = {}) {
  let context, enabled=true, lastPlayed=-Infinity;
  try { enabled=storage?.getItem('candy-sound')!=='off'; } catch {}
  const melodies={
    rotate:[[600,900,0,.07]],
    recycle:[[660,440,0,.10],[440,260,.08,.13]],
    blocked:[[240,190,0,.09],[190,160,.11,.09]],
    place:[[500,690,0,.08]],
    success:[[523,523,0,.14],[659,659,.14,.14],[784,784,.28,.22]],
  };
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
        oscillator.type='sine';
        oscillator.frequency.setValueAtTime(from,now+delay);
        oscillator.frequency.exponentialRampToValueAtTime(to,now+delay+duration);
        gain.gain.setValueAtTime(.0001,now+delay);
        gain.gain.exponentialRampToValueAtTime(.075,now+delay+.008);
        gain.gain.exponentialRampToValueAtTime(.0001,now+delay+duration);
        oscillator.connect(gain);gain.connect(context.destination);
        oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
        oscillator.start(now+delay);oscillator.stop(now+delay+duration+.01);
      }
    } catch { /* Unsupported or blocked audio must never stop the game. */ }
  }
  return {
    play,
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
