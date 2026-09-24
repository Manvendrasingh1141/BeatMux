export const snapTime = (time, interval) => {
  if (interval <= 0) return time;
  return Math.round(time / interval) * interval;
};
