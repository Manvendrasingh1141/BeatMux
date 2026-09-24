// Musical time conversions
// 120 BPM -> 120 beats per 60 seconds -> 2 beats per second -> 0.5s per beat
// 4/4 -> 4 beats per bar

export const getBeatDuration = (bpm) => 60 / bpm;
export const getBarDuration = (bpm, timeSignatureNumerator = 4) => getBeatDuration(bpm) * timeSignatureNumerator;

export const secondsToBeats = (seconds, bpm) => seconds / getBeatDuration(bpm);
export const beatsToSeconds = (beats, bpm) => beats * getBeatDuration(bpm);

export const secondsToBars = (seconds, bpm, num = 4) => seconds / getBarDuration(bpm, num);
export const barsToSeconds = (bars, bpm, num = 4) => bars * getBarDuration(bpm, num);

// Calculate beat and bar components
// E.g., time = 3s, BPM = 120, 4/4
// beatDuration = 0.5s. time / 0.5 = 6 total beats. 6 / 4 = 1.5 bars.
// This means we are at Bar 2, Beat 3 (using 1-based indexing for UI).
export const getMusicalPosition = (seconds, bpm, num = 4) => {
  const totalBeats = secondsToBeats(seconds, bpm);
  const bar = Math.floor(totalBeats / num) + 1; // 1-based bar
  const beat = Math.floor(totalBeats % num) + 1; // 1-based beat in bar
  return { bar, beat, totalBeats };
};

export const snapTimeToBeat = (time, bpm) => {
  const bd = getBeatDuration(bpm);
  return Math.round(time / bd) * bd;
};

export const snapTimeToBar = (time, bpm, num = 4) => {
  const bd = getBarDuration(bpm, num);
  return Math.round(time / bd) * bd;
};
