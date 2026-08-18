// Web Audio API Synthesized Sound Effects

export const playPopSound = (pitchMultiplier = 1.0, volume = 0.3) => {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';

    const baseFreq = 340 * pitchMultiplier;
    const peakFreq = 780 * pitchMultiplier;
    const now = ctx.currentTime;

    // Pitch sweep up then quickly down for a cheerful pop effect
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(peakFreq, now + 0.04);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, now + 0.12);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.14);

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 250);
  } catch {
    // Graceful fallback for browser audio autoplay limits
  }
};
