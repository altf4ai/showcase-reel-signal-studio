export const FPS = 60;
export const BPM = 120;
/** Frames per beat at 120 BPM / 60fps. */
export const BEAT = (FPS * 60) / BPM; // 30
export const BAR = BEAT * 4; // 120
export const beats = (n: number) => Math.round(n * BEAT);

export const RAR = {
  bg: '#050507',
  blue: '#5AC8FF',
  cobalt: '#1E62FF',
  ice: '#EEF4FF',
  iceDim: 'rgba(238,244,255,0.55)',
  deep: '#0B2A6B',
};

export const SR = {
  ink: '#121010',
  cream: '#F9ECD4',
  red: '#EE2D36',
  lime: '#E4FE2A',
  amber: '#FDB714',
  pink: '#F4A7C0',
  taupe: '#5F5852',
};
