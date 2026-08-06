export const motion = {
  duration: {
    quick: 160,
    standard: 240,
    deliberate: 360,
    continuousProgress: 1100,
    statusShimmerSweep: 1500,
    statusShimmerPause: 250,
  },
  spring: {
    responsive: {
      damping: 22,
      mass: 0.8,
      stiffness: 240,
    },
    gentle: {
      damping: 26,
      mass: 1,
      stiffness: 170,
    },
  },
} as const;
