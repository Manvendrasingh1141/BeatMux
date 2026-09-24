/**
 * Determines if a track should be audible based on global solo state and local mute/solo state.
 * @param {Object} track Mixer state of the specific track { muted, soloed }
 * @param {Array<Object>} allTracks Mixer states of all tracks
 * @returns {boolean} true if track should be audible
 */
export const isTrackAudible = (track, allTracks) => {
  if (track.muted) return false;
  
  const anyTrackSoloed = allTracks.some(t => t.soloed);
  if (anyTrackSoloed) {
    return track.soloed;
  }
  
  return true;
};
