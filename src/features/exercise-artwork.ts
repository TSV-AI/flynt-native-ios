import type { ImageSourcePropType } from 'react-native';

const exerciseArtwork: Record<string, ImageSourcePropType> = {
  'Dumbbell Step-Up': require('@/assets/images/exercises/dumbbell-step-up.png'),
  'Glute Bridge': require('@/assets/images/exercises/glute-bridge.png'),
  'Goblet Squat': require('@/assets/images/exercises/goblet-squat.png'),
  'Overhead Squat': require('@/assets/images/exercises/overhead-squat.png'),
  'Single-Leg Romanian Deadlift': require('@/assets/images/exercises/single-leg-romanian-deadlift.png'),
};

export function getExerciseArtwork(name: string): ImageSourcePropType | null {
  return exerciseArtwork[name] ?? null;
}
