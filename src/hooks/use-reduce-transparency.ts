import { AccessibilityInfo } from 'react-native';
import { useEffect, useState } from 'react';

export function useReduceTransparency() {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceTransparencyEnabled().then((next) => {
      if (mounted) setIsEnabled(next);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setIsEnabled);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return isEnabled;
}
