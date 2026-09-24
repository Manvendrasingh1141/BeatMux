/**
 * roomState.js
 * Default room state shape.
 */

export const DEFAULT_PATTERN = {
  kick:      [true,  false, false, false, true,  false, false, false, true,  false, false, false, true,  false, false, false],
  snare:     [false, false, false, false, true,  false, false, false, false, false, false, false, true,  false, false, false],
  closedHat: [true,  false, true,  false, true,  false, true,  false, true,  false, true,  false, true,  false, true,  false],
  openHat:   [false, false, false, false, false, false, false, true,  false, false, false, false, false, false, false, true ],
};

/**
 * Returns a fresh deep-cloned room state object.
 */
export function createRoomState() {
  const defaultPat = structuredClone(DEFAULT_PATTERN);
  return {
    pattern:     structuredClone(defaultPat),
    patternBanks: {
      A: structuredClone(defaultPat),
      B: {},
      C: {},
    },
    bpm:         120,
    isPlaying:   false,
    startTime:   null,
    quantize:    '1/16',
    patternBank: 'A',
    resolution:  '1/4 Beat',
    muted:       {},
    soloed:    {},
    volumes:   {
      kick:      80,
      snare:     80,
      closedHat: 80,
      openHat:   80,
    },
  };
}
