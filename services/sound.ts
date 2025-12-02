
// Synthesized Audio Helper to avoid external assets and CORS issues

let audioCtx: AudioContext | null = null;

const getCtx = () => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtx;
};

export const playTick = () => {
    try {
        const ctx = getCtx();
        if (ctx.state === 'suspended') ctx.resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);
        
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
    } catch (e) {
        // Ignore audio errors
    }
};

export const playWin = () => {
    try {
        const ctx = getCtx();
        if (ctx.state === 'suspended') ctx.resume();
        
        const now = ctx.currentTime;
        
        // Major chord arpeggio
        [440, 554, 659, 880].forEach((freq, i) => {
             const osc = ctx.createOscillator();
             const gain = ctx.createGain();
             
             osc.connect(gain);
             gain.connect(ctx.destination);
             
             osc.type = 'sine';
             osc.frequency.value = freq;
             
             const start = now + i * 0.1;
             gain.gain.setValueAtTime(0, start);
             gain.gain.linearRampToValueAtTime(0.2, start + 0.05);
             gain.gain.exponentialRampToValueAtTime(0.01, start + 1.5);
             
             osc.start(start);
             osc.stop(start + 1.5);
        });
    } catch (e) {
        // Ignore
    }
};
