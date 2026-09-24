/**
 * openHat.js
 * Synthesised open hi-hat — same oscillator bank as closed hat,
 * but with a much longer decay for that splashy, open sound.
 *
 * @param {AudioContext} ctx
 * @param {number}       when
 * @param {GainNode}     masterGain
 */
export function playOpenHat(ctx, when, masterGain) {
  const duration = 0.38;

  const frequencies = [287.5, 345, 459, 517.5, 781, 915];

  const mixGain = ctx.createGain();
  mixGain.gain.value = 1 / frequencies.length;

  frequencies.forEach((freq) => {
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = freq;
    osc.connect(mixGain);
    osc.start(when);
    osc.stop(when + duration + 0.05);
  });

  // Same filter chain as closed hat
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 6000;
  hp.Q.value = 0.5;

  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 9000;
  bp.Q.value = 0.35;

  // Long amplitude envelope with an initial transient peak
  const envGain = ctx.createGain();
  envGain.gain.setValueAtTime(0.0, when);
  envGain.gain.linearRampToValueAtTime(0.65, when + 0.005);   // fast attack
  envGain.gain.exponentialRampToValueAtTime(0.001, when + duration); // long decay

  mixGain.connect(hp);
  hp.connect(bp);
  bp.connect(envGain);
  envGain.connect(masterGain);
}
