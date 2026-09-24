export const formatTime = (seconds, showDecimal = false) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  
  const mStr = m.toString().padStart(2, '0');
  const sStr = s.toString().padStart(2, '0');
  
  if (showDecimal) {
    return `${mStr}:${sStr}.${ms}`;
  }
  return `${mStr}:${sStr}`;
};
