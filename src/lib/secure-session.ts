import * as SecureStore from 'expo-secure-store';

export const sessionKey = 'flynt.supabase.session';

export const secureSessionStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  }),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export async function readSecureSession() {
  return secureSessionStorage.getItem(sessionKey);
}

export async function writeSecureSession(value: string) {
  await secureSessionStorage.setItem(sessionKey, value);
}

export async function clearSecureSession() {
  await secureSessionStorage.removeItem(sessionKey);
}
