import { useEffect } from 'react';
import { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { motion } from '@/constants/motion';

function useAnimatedProgressValue(value: number) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(value);

  useEffect(() => {
    const nextValue = Math.max(0, Math.min(1, value));
    progress.value = reduceMotion
      ? nextValue
      : withTiming(nextValue, {
          duration: motion.duration.continuousProgress,
          easing: Easing.linear,
        });
  }, [progress, reduceMotion, value]);

  return progress;
}

export function useSmoothProgress(value: number) {
  const progress = useAnimatedProgressValue(value);

  return useAnimatedStyle(() => ({
    transform: [{ scaleX: progress.value }],
  }));
}

export function useSmoothProgressWidth(value: number, width: number) {
  const progress = useAnimatedProgressValue(value);

  return useAnimatedStyle(() => ({
    width: progress.value * width,
  }), [width]);
}
