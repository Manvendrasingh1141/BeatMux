import React, { useEffect, useRef, useMemo } from 'react';

/**
 * Generates a pseudo-random but deterministic waveform based on assetId.
 * This avoids a network call that 404s and gives each clip a unique look.
 */
const generateWaveform = (assetId, numBars) => {
  // Simple seedable hash from assetId string
  let seed = 0;
  for (let i = 0; i < (assetId || '').length; i++) {
    seed = ((seed << 5) - seed + assetId.charCodeAt(i)) | 0;
  }
  const bars = [];
  for (let i = 0; i < numBars; i++) {
    seed = (seed * 16807 + 12345) & 0x7fffffff;
    const base = 0.15 + (seed % 1000) / 1000 * 0.7;
    // Add a smooth envelope (louder in middle)
    const env = Math.sin((i / numBars) * Math.PI);
    bars.push(Math.min(1, base * (0.4 + 0.6 * env)));
  }
  return bars;
};

const ClipWaveform = ({ assetId, duration, pixelsPerSecond, color }) => {
  const canvasRef = useRef(null);

  const numBars = Math.max(20, Math.floor(duration * pixelsPerSecond / 3));
  const waveform = useMemo(() => generateWaveform(assetId, numBars), [assetId, numBars]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const barWidth = Math.max(1, w / waveform.length - 1);
    const gap = 1;

    for (let i = 0; i < waveform.length; i++) {
      const x = (i / waveform.length) * w;
      const barH = Math.max(1, waveform[i] * h * 0.9);
      const y = (h - barH) / 2;

      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.beginPath();
      ctx.roundRect(x, y, Math.max(1, barWidth), barH, 1);
      ctx.fill();
    }
  }, [waveform, duration, pixelsPerSecond]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
};

export default React.memo(ClipWaveform);
