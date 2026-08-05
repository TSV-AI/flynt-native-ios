import { NativeModule, requireOptionalNativeModule } from 'expo';

export type GoogleIdentityCredential = {
  idToken: string;
};

declare class FlyntGoogleAuthNativeModule extends NativeModule {
  configure(iosClientId: string, serverClientId: string): Promise<void>;
  signIn(hashedNonce: string): Promise<GoogleIdentityCredential>;
  signOut(): Promise<void>;
}

export default requireOptionalNativeModule<FlyntGoogleAuthNativeModule>('FlyntGoogleAuth');
