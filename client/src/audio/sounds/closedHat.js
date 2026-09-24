/**
 * closedHat.js
 * Synthesised closed hi-hat — 6 detuned square oscillators + highpass filter.
 * This is the classic Roland TR-808/909 approach.
 *
 * @param {AudioContext} ctx
 * @param {number}       when
 * @param {GainNode}     masterGain
 */
export function playClosedHat(ctx, when, masterGain) {
  const duration = 0.055;

  // Six square oscillators at metallic frequency ratios (simulates cymbal overtones)
  const frequencies = [287.5, 345, 459, 517.5, 781, 915];

  const mixGain = ctx.createGain();
  mixGain.gain.value = 1 / frequencies.length;

  frequencies.forEach((freq) => {
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = freq;
    osc.connect(mixGain);
    osc.start(when);
    osc.stop(when + duration + 0.01);
  });

  // Highpass to remove low frequencies — gives the "metallic sheen"
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 7000;
  hp.Q.value = 0.5;

  // Bandpass for cymbal bite
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 10000;
  bp.Q.value = 0.4;

  // Amplitude envelope — very short, tight
  const envGain = ctx.createGain();
  envGain.gain.setValueAtTime(0.7, when);
  envGain.gain.exponentialRampToValueAtTime(0.001, when + duration);

  mixGain.connect(hp);
  hp.connect(bp);
  bp.connect(envGain);
  envGain.connect(masterGain);
}
