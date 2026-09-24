/**
 * snare.js
 * Synthesised snare drum — white-noise burst + tuned body oscillator.
 *
 * @param {AudioContext} ctx
 * @param {number}       when
 * @param {GainNode}     masterGain
 */
export function playSnare(ctx, when, masterGain) {
  const duration = 0.22;

  // ── White noise layer (the "snare wires") ─────────────────────────────────
  const noiseBuffer = createNoiseBuffer(ctx, duration);

  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = noiseBuffer;

  // Bandpass for snare crack, highpass for brightness
  const noiseBP = ctx.createBiquadFilter();
  noiseBP.type = 'bandpass';
  noiseBP.frequency.value = 3500;
  noiseBP.Q.value = 0.5;

  const noiseHP = ctx.createBiquadFilter();
  noiseHP.type = 'highpass';
  noiseHP.frequency.value = 1200;

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.9, when);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, when + duration);

  noiseSource.connect(noiseBP);
  noiseBP.connect(noiseHP);
  noiseHP.connect(noiseGain);
  noiseGain.connect(masterGain);
  noiseSource.start(when);
  noiseSource.stop(when + duration);

  // ── Tone layer (snare body) ────────────────────────────────────────────────
  const bodyOsc = ctx.createOscillator();
  bodyOsc.type = 'triangle';
  bodyOsc.frequency.setValueAtTime(200, when);
  bodyOsc.frequency.exponentialRampToValueAtTime(100, when + 0.08);

  const bodyGain = ctx.createGain();
  bodyGain.gain.setValueAtTime(0.75, when);
  bodyGain.gain.exponentialRampToValueAtTime(0.001, when + 0.1);

  bodyOsc.connect(bodyGain);
  bodyGain.connect(masterGain);
  bodyOsc.start(when);
  bodyOsc.stop(when + 0.12);

  // ── Attack transient click ────────────────────────────────────────────────
  const clickOsc = ctx.createOscillator();
  clickOsc.type = 'sine';
  clickOsc.frequency.value = 1000;

  const clickGain = ctx.createGain();
  clickGain.gain.setValueAtTime(0.6, when);
  clickGain.gain.exponentialRampToValueAtTime(0.001, when + 0.012);

  clickOsc.connect(clickGain);
  clickGain.connect(masterGain);
  clickOsc.start(when);
  clickOsc.stop(when + 0.015);
}

function createNoiseBuffer(ctx, duration) {
  const sampleRate = ctx.sampleRate;
  const frameCount = Math.ceil(sampleRate * duration);
  const buffer = ctx.createBuffer(1, frameCount, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}
