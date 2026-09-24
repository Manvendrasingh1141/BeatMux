/**
 * kick.js
 * Synthesised kick drum — sine oscillator with pitch envelope + punch distortion.
 *
 * @param {AudioContext} ctx
 * @param {number}       when  - AudioContext timestamp to schedule at
 * @param {GainNode}     masterGain
 */
export function playKick(ctx, when, masterGain) {
  // ── Pitch envelope ───────────────────────────────────────────────────────
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(180, when);
  osc.frequency.exponentialRampToValueAtTime(30, when + 0.35);

  // ── Sub-click layer (gives the "thud") ────────────────────────────────────
  const clickOsc = ctx.createOscillator();
  clickOsc.type = 'sine';
  clickOsc.frequency.setValueAtTime(800, when);
  clickOsc.frequency.exponentialRampToValueAtTime(60, when + 0.02);

  const clickGain = ctx.createGain();
  clickGain.gain.setValueAtTime(0.8, when);
  clickGain.gain.exponentialRampToValueAtTime(0.001, when + 0.04);

  // ── Amplitude envelope ────────────────────────────────────────────────────
  const envGain = ctx.createGain();
  envGain.gain.setValueAtTime(1.0, when);
  envGain.gain.exponentialRampToValueAtTime(0.001, when + 0.5);

  // ── Waveshaper for punch ──────────────────────────────────────────────────
  const waveshaper = ctx.createWaveShaper();
  waveshaper.curve = makeDistortionCurve(40);
  waveshaper.oversample = '4x';

  // ── Routing ───────────────────────────────────────────────────────────────
  osc.connect(waveshaper);
  waveshaper.connect(envGain);
  clickOsc.connect(clickGain);
  clickGain.connect(envGain);
  envGain.connect(masterGain);

  osc.start(when);
  osc.stop(when + 0.55);
  clickOsc.start(when);
  clickOsc.stop(when + 0.06);
}

function makeDistortionCurve(amount) {
  const samples = 256;
  const curve = new Float32Array(samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}
