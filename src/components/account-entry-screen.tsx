import * as AppleAuthentication from 'expo-apple-authentication';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { radius, spacing, type } from '@/constants/theme';
import { NativeSymbol } from '@/components/native-symbol';
import { useFlyntTheme } from '@/hooks/use-flynt-theme';
import { failed, saved } from '@/lib/haptics';
import {
  requestEmailLink,
  signInWithApple,
  signInWithGoogle,
  UserCancelledAuthError,
  type EmailAuthMode,
} from '@/lib/auth';
import { isValidEmail, normalizeEmail } from '@/lib/auth-flow';
import { AuthConfigurationError } from '@/lib/supabase-client';
import { useLifecycleNavigation } from '@/providers/lifecycle-navigation-provider';

type AccountEntryScreenProps = {
  mode: EmailAuthMode;
};

function authErrorCopy(error: unknown) {
  if (error instanceof AuthConfigurationError) {
    return 'Authentication is not configured in this development build yet.';
  }
  return 'FLYNT could not complete that request. Check your connection and try again.';
}

export function AccountEntryScreen({ mode }: AccountEntryScreenProps) {
  const { mode: colorMode, theme } = useFlyntTheme();
  const { retry } = useLifecycleNavigation();
  const [email, setEmail] = useState('');
  const [emailOpen, setEmailOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAppleAvailable, setIsAppleAvailable] = useState(false);
  const [pending, setPending] = useState<'apple' | 'email' | 'google' | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void AppleAuthentication.isAvailableAsync().then((available) => {
      if (mounted) setIsAppleAvailable(available);
    });
    return () => {
      mounted = false;
    };
  }, []);

  async function runProvider(provider: 'apple' | 'google') {
    setError(null);
    setPending(provider);
    try {
      if (provider === 'apple') await signInWithApple();
      else await signInWithGoogle();
      await saved();
      retry();
    } catch (providerError) {
      if (!(providerError instanceof UserCancelledAuthError)) {
        setError(authErrorCopy(providerError));
        await failed();
      }
    } finally {
      setPending(null);
    }
  }

  async function submitEmail() {
    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }
    const normalized = normalizeEmail(email);
    setError(null);
    setPending('email');
    try {
      await requestEmailLink(normalized, mode);
      setSentTo(normalized);
      await saved();
    } catch (emailError) {
      setError(authErrorCopy(emailError));
      await failed();
    } finally {
      setPending(null);
    }
  }

  const isBusy = pending !== null;
  const body = mode === 'create'
    ? 'Create a new account to build your training around you and keep every session synced.'
    : 'Sign in to your existing account to access your program, progress, and Trainer history.';

  if (sentTo) {
    return (
      <View style={[styles.screen, { backgroundColor: theme.canvas }]}>
        <SafeAreaView edges={['bottom']} style={styles.centeredContent}>
          <Text style={[styles.eyebrow, { color: theme.muted }]}>CHECK YOUR EMAIL</Text>
          <Text accessibilityRole="header" style={[styles.title, { color: theme.ink }]}>Open your secure link.</Text>
          <Text style={[styles.body, { color: theme.muted }]}>We sent it to {sentTo}.</Text>
          <Text style={[styles.supporting, { color: theme.muted }]}>You can return to FLYNT after opening the link.</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setError(null);
              setSentTo(null);
            }}
            style={styles.textButton}
          >
            <Text style={[styles.textButtonCopy, { color: theme.ink }]}>Use another email</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.screen, { backgroundColor: theme.canvas }]}
    >
      <SafeAreaView edges={['bottom']} style={styles.content}>
        <View accessibilityLabel="FLYNT" style={styles.brandLockup}>
          <Image
            accessibilityIgnoresInvertColors
            source={colorMode === 'dark'
              ? require('@/assets/images/flynt-mark-light.png')
              : require('@/assets/images/flynt-mark-ink.png')}
            style={styles.brandMark}
          />
          <Text accessibilityRole="header" style={[styles.wordmark, { color: theme.ink }]}>FLYNT</Text>
        </View>
        <Text style={[styles.accountCopy, { color: theme.muted }]}>{body}</Text>

        <View style={styles.actions}>
          {!emailOpen && isAppleAvailable ? (
            <View pointerEvents={isBusy ? 'none' : 'auto'} style={{ opacity: isBusy && pending !== 'apple' ? 0.5 : 1 }}>
              <AppleAuthentication.AppleAuthenticationButton
                buttonStyle={colorMode === 'dark'
                  ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                  : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                buttonType={mode === 'create'
                  ? AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP
                  : AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                cornerRadius={28}
                onPress={() => void runProvider('apple')}
                style={styles.appleButton}
              />
            </View>
          ) : null}
          {!emailOpen ? <Pressable
            accessibilityRole="button"
            disabled={isBusy}
            onPress={() => void runProvider('google')}
            style={({ pressed }) => [
              styles.providerButton,
              {
                backgroundColor: theme.raised,
                borderColor: theme.line,
                opacity: isBusy && pending !== 'google' ? 0.5 : pressed ? 0.72 : 1,
              },
            ]}
          >
            {pending === 'google' ? <ActivityIndicator color={theme.ink} /> : (
              <>
                <Text style={[styles.googleMark, { color: theme.ink }]}>G</Text>
                <Text style={[styles.providerButtonCopy, { color: theme.ink }]}>Continue with Google</Text>
              </>
            )}
          </Pressable> : null}
          {!emailOpen ? <Pressable
            accessibilityRole="button"
            disabled={isBusy}
            onPress={() => {
              setError(null);
              setEmailOpen(true);
            }}
            style={({ pressed }) => [
              styles.providerButton,
              { backgroundColor: theme.raised, borderColor: theme.line, opacity: pressed ? 0.72 : 1 },
            ]}
          >
            <View style={styles.providerIcon}><NativeSymbol color={theme.ink} name="envelope" size={19} /></View>
            <Text style={[styles.providerButtonCopy, { color: theme.ink }]}>Continue with email</Text>
          </Pressable> : null}

          {emailOpen ? <View style={styles.emailGroup}>
            <Text style={[styles.fieldLabel, { color: theme.ink }]}>Email</Text>
            <TextInput
              accessibilityLabel="Email address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              autoFocus
              editable={!isBusy}
              keyboardType="email-address"
              onChangeText={(value) => {
                setEmail(value);
                if (error) setError(null);
              }}
              onSubmitEditing={() => void submitEmail()}
              placeholder="you@example.com"
              placeholderTextColor={theme.muted}
              returnKeyType="done"
              style={[
                styles.input,
                { backgroundColor: theme.raised, borderColor: error ? theme.danger : theme.line, color: theme.ink },
              ]}
              textContentType="emailAddress"
              value={email}
            />
            {error ? <Text accessibilityLiveRegion="polite" style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}
            <Pressable
              accessibilityRole="button"
              disabled={isBusy}
              onPress={() => void submitEmail()}
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: theme.primaryFill, opacity: isBusy ? 0.58 : pressed ? 0.82 : 1 },
              ]}
            >
              {pending === 'email' ? <ActivityIndicator color={theme.primaryText} /> : (
                <Text style={[styles.primaryButtonCopy, { color: theme.primaryText }]}>Email me a secure link</Text>
              )}
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setEmail('');
                setError(null);
                setEmailOpen(false);
              }}
              style={styles.backToOptions}
            >
              <Text style={[styles.secondaryActionCopy, { color: theme.muted }]}>Back to sign-in options</Text>
            </Pressable>
          </View> : null}

          {!emailOpen && error ? <Text accessibilityLiveRegion="polite" style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}

          {!emailOpen ? <Pressable
            accessibilityRole="button"
            onPress={() => router.replace(mode === 'create' ? '/sign-in' : '/create-account')}
            style={styles.secondaryAction}
          >
            <Text style={[styles.secondaryActionCopy, { color: theme.muted }]}>
              {mode === 'create' ? 'Already have an account? ' : 'New to FLYNT? '}
              <Text style={{ color: theme.ink, fontWeight: '700' }}>{mode === 'create' ? 'Sign in' : 'Create account'}</Text>
            </Text>
          </Pressable> : null}
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 26 },
  centeredContent: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.lg, gap: spacing.md },
  eyebrow: { ...type.label },
  title: { ...type.title, maxWidth: 350 },
  body: { ...type.body, maxWidth: 350 },
  supporting: { fontSize: 15, lineHeight: 21, maxWidth: 350 },
  brandLockup: { alignItems: 'center', marginTop: 56 },
  brandMark: { width: 39, height: 59, resizeMode: 'contain' },
  wordmark: { marginTop: 25, fontSize: 48, lineHeight: 52, fontWeight: '400', letterSpacing: 12, marginLeft: 12 },
  accountCopy: { alignSelf: 'center', maxWidth: 310, marginTop: spacing.lg, textAlign: 'center', fontSize: 15, lineHeight: 22 },
  actions: { gap: 11, marginTop: 'auto', paddingTop: spacing.xl, paddingBottom: 42 },
  appleButton: { width: '100%', height: 56 },
  providerButton: {
    position: 'relative',
    minHeight: 56,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  providerButtonCopy: { ...type.button },
  googleMark: { position: 'absolute', left: 20, fontSize: 18, fontWeight: '700' },
  providerIcon: { position: 'absolute', left: 18, width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  emailGroup: { gap: spacing.sm },
  fieldLabel: { ...type.label, letterSpacing: 0 },
  input: {
    minHeight: 56,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    fontSize: 17,
  },
  error: { fontSize: 15, lineHeight: 20 },
  primaryButton: {
    minHeight: 56,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  primaryButtonCopy: { ...type.button },
  textButton: { minHeight: 44, alignSelf: 'flex-start', justifyContent: 'center' },
  textButtonCopy: { ...type.button },
  secondaryAction: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  secondaryActionCopy: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
  backToOptions: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
