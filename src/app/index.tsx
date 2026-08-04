import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { FirstRunIntroduction } from '@/components/first-run-introduction';
import { appSurfaces } from '@/constants/theme';
import { hasSeenFirstRunIntroduction, markFirstRunIntroductionSeen } from '@/lib/first-run';

export default function HomeScreen() {
  const [showIntroduction, setShowIntroduction] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    void hasSeenFirstRunIntroduction()
      .then(async (seen) => {
        if (!mounted) return;
        if (seen) {
          setShowIntroduction(false);
          router.replace('/sign-in');
          return;
        }

        await markFirstRunIntroductionSeen();
        if (mounted) setShowIntroduction(true);
      })
      .catch(() => {
        if (mounted) setShowIntroduction(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  function finishIntroduction() {
    router.push('/sign-in');
  }

  if (showIntroduction === null) {
    return <View style={[styles.container, { backgroundColor: appSurfaces.dark.primaryBackground }]} />;
  }

  if (showIntroduction) {
    return <FirstRunIntroduction onFinish={finishIntroduction} />;
  }

  return <View style={[styles.container, { backgroundColor: appSurfaces.dark.primaryBackground }]} />;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
