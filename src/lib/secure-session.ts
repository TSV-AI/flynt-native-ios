import * as SecureStore from 'expo-secure-store';

const sessionKey = 'flynt.supabase.session';

export async function readSecureSession() {
  return SecureStore.getItemAsync(sessionKey);
}

export async function writeSecureSession(value: string) {
  await SecureStore.setItemAsync(sessionKey, value, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function clearSecureSession() {
  await SecureStore.deleteItemAsync(sessionKey);
}
