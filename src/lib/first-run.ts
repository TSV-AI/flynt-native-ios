import * as SecureStore from 'expo-secure-store';

const introductionKey = 'flynt.first-run-introduction.v1';

export async function hasSeenFirstRunIntroduction() {
  return (await SecureStore.getItemAsync(introductionKey)) === 'seen';
}

export async function markFirstRunIntroductionSeen() {
  await SecureStore.setItemAsync(introductionKey, 'seen', {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}
