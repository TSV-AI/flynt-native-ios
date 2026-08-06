import * as AppleAuthentication from 'expo-apple-authentication';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FlyntSheet } from '@/components/flynt-sheet';
import { NativeSymbol } from '@/components/native-symbol';
import { appSurfaces, radius, signedOutColorMode, spacing, type } from '@/constants/theme';
import { accountCopy, flyntLegalVersion } from '@/features/first-run-content';
import { useFlyntTheme } from '@/hooks/use-flynt-theme';
import { acceptTerms, ApiError, fetchAccountStatus } from '@/lib/api-client';
import { hasCurrentFlyntAccount } from '@/lib/auth-admission';
import {
  requestEmailOtp,
  signInWithApple,
  signInWithGoogle,
  signOutFromSupabase,
  UserCancelledAuthError,
  verifyEmailOtp,
  type EmailAuthMode,
} from '@/lib/auth';
import {
  isValidEmail,
  isValidEmailOtp,
  normalizeEmail,
  normalizeEmailOtp,
} from '@/lib/auth-flow';
import { failed, saved } from '@/lib/haptics';
import { AuthConfigurationError } from '@/lib/supabase-client';
import { useLifecycleNavigation } from '@/providers/lifecycle-navigation-provider';

type AccountEntryScreenProps = {
  mode: EmailAuthMode;
};

type LegalView = 'privacy' | 'terms' | null;
type ProviderAuthStage = 'provider' | 'account-admission';

class ExistingAccountRequiredError extends Error {
  constructor() {
    super('No existing FLYNT account was found.');
    this.name = 'ExistingAccountRequiredError';
  }
}

function authErrorDetail(error: unknown) {
  if (!(error instanceof Error)) return null;
  const status = 'status' in error && typeof error.status === 'number'
    ? ` (${error.status})`
    : '';
  return `${error.name}${status}: ${error.message}`;
}

function authErrorCopy(
  error: unknown,
  context?: { intent: EmailAuthMode; provider: 'apple' | 'google'; stage: ProviderAuthStage },
) {
  if (error instanceof AuthConfigurationError) {
    return 'Authentication is not configured in this development build yet.';
  }
  if (error instanceof ExistingAccountRequiredError) {
    return 'No existing FLYNT account was found. Choose Create account and accept the Terms to continue.';
  }
  if (context?.stage === 'account-admission') {
    const fallback = context.intent === 'create'
      ? 'Your identity was verified, but FLYNT could not finish creating the account. Try again.'
      : 'Your identity was verified, but FLYNT could not verify this account. Try again.';
    const detail = __DEV__ ? authErrorDetail(error) : null;
    return detail ? `${fallback}\n\nDeveloper detail: ${detail}` : fallback;
  }
  if (error instanceof Error) {
    if (/signups not allowed for otp|otp_disabled/i.test(error.message)) {
      return 'We couldn’t send a code for that email. Try Google or create a new account.';
    }
    if (/over_email_send_rate_limit/i.test(error.message)) {
      return 'Email delivery is temporarily unavailable. Try again later or continue with Google.';
    }
  }
  const fallback = context?.provider === 'google'
    ? 'Google could not finish signing you in to FLYNT. Try again or continue with email.'
    : 'FLYNT could not complete that request. Check your connection and try again.';
  const detail = __DEV__ ? authErrorDetail(error) : null;
  return detail ? `${fallback}\n\nDeveloper detail: ${detail}` : fallback;
}

export function AccountEntryScreen({ mode }: AccountEntryScreenProps) {
  const { mode: colorMode, theme } = useFlyntTheme();
  const { refresh, retry } = useLifecycleNavigation();
  const [authMode, setAuthMode] = useState<EmailAuthMode>(mode);
  const [email, setEmail] = useState('');
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isAppleAvailable, setIsAppleAvailable] = useState(false);
  const [legalView, setLegalView] = useState<LegalView>(null);
  const [pending, setPending] = useState<'apple' | 'email' | 'google' | null>(null);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    let mounted = true;
    void AppleAuthentication.isAvailableAsync().then((available) => {
      if (mounted) setIsAppleAvailable(available);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const isBusy = pending !== null;
  const requiresConsent = authMode === 'create' && !recoveryMode;
  const providerDisabled = isBusy || (requiresConsent && !termsAccepted);
  const description = recoveryMode
    ? accountCopy.recovery
    : authMode === 'create'
      ? accountCopy.create
      : accountCopy.signIn;

  function resetEmailEntry() {
    setEmail('');
    setEmailOtp('');
    setError(null);
    setSentTo(null);
  }

  function toggleMode() {
    const nextMode = authMode === 'create' ? 'sign-in' : 'create';
    resetEmailEntry();
    setAuthMode(nextMode);
    setEmailOpen(false);
    setRecoveryMode(false);
    setTermsAccepted(false);
  }

  async function completeAuthentication() {
    if (authMode === 'create' && !recoveryMode) {
      try {
        await acceptTerms(flyntLegalVersion);
      } catch (acceptanceError) {
        await signOutFromSupabase().catch(() => undefined);
        throw acceptanceError;
      }
    } else {
      try {
        const status = await fetchAccountStatus();
        if (!hasCurrentFlyntAccount(status, flyntLegalVersion)) {
          await signOutFromSupabase().catch(() => undefined);
          throw new ExistingAccountRequiredError();
        }
      } catch (admissionError) {
        if (!(admissionError instanceof ExistingAccountRequiredError)) {
          await signOutFromSupabase().catch(() => undefined);
        }
        throw admissionError;
      }
    }
    await saved();
    if (authMode === 'create' && !recoveryMode) {
      await refresh();
      return;
    }
    retry();
    router.replace('/boot');
  }

  async function runProvider(provider: 'apple' | 'google') {
    if (providerDisabled) return;
    setError(null);
    setPending(provider);
    let stage: ProviderAuthStage = 'provider';
    try {
      if (provider === 'apple') await signInWithApple();
      else await signInWithGoogle();
      stage = 'account-admission';
      await completeAuthentication();
    } catch (providerError) {
      if (!(providerError instanceof UserCancelledAuthError)) {
        if (__DEV__) {
          console.warn('FLYNT authentication failed', {
            detail: authErrorDetail(providerError),
            provider,
            stage,
          });
        }
        setError(authErrorCopy(providerError, { intent: authMode, provider, stage }));
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
    if (requiresConsent && !termsAccepted) return;
    const normalized = normalizeEmail(email);
    setError(null);
    setPending('email');
    try {
      await requestEmailOtp(normalized, recoveryMode ? 'sign-in' : authMode);
      setSentTo(normalized);
      setEmailOtp('');
      await saved();
    } catch (emailError) {
      setError(authErrorCopy(emailError));
      await failed();
    } finally {
      setPending(null);
    }
  }

  async function submitEmailOtp() {
    if (!sentTo || !isValidEmailOtp(emailOtp)) return;
    setError(null);
    setPending('email');
    try {
      await verifyEmailOtp(sentTo, emailOtp);
      await completeAuthentication();
    } catch (otpError) {
      if (otpError instanceof ExistingAccountRequiredError || otpError instanceof ApiError) {
        setError(authErrorCopy(otpError));
      } else {
        setError(
          otpError instanceof Error && /terms|acceptance/i.test(otpError.message)
            ? 'Unable to save your Terms acceptance. Try creating the account again.'
            : 'That code is incorrect or has expired. Request a new code and try again.',
        );
      }
      await failed();
    } finally {
      setPending(null);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.screen, { backgroundColor: appSurfaces[signedOutColorMode].primaryBackground }]}
    >
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <ScrollView
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={styles.scrollContent}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
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
          <Text style={[styles.accountCopy, { color: theme.muted }]}>{description}</Text>

          <View style={styles.actions}>
            {!recoveryMode && !emailOpen && !sentTo ? (
              isAppleAvailable ? (
                <View pointerEvents={providerDisabled ? 'none' : 'auto'} style={{ opacity: providerDisabled ? 0.48 : 1 }}>
                  <AppleAuthentication.AppleAuthenticationButton
                    buttonStyle={colorMode === 'dark'
                      ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                      : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                    buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                    cornerRadius={18}
                    onPress={() => void runProvider('apple')}
                    style={styles.appleButton}
                  />
                </View>
              ) : null
            ) : null}

            {!recoveryMode && !emailOpen && !sentTo ? (
              <Pressable
                accessibilityRole="button"
                disabled={providerDisabled}
                onPress={() => void runProvider('google')}
                style={({ pressed }) => [
                  styles.providerButton,
                  {
                    backgroundColor: theme.primaryFill,
                    borderColor: theme.primaryFill,
                    opacity: providerDisabled ? 0.48 : pressed ? 0.72 : 1,
                  },
                ]}
              >
                {pending === 'google' ? <ActivityIndicator color={theme.primaryText} /> : (
                  <View style={styles.googleButtonContent}>
                    <Image
                      accessibilityIgnoresInvertColors
                      source={require('../../assets/icons/google-g.png')}
                      style={styles.googleMark}
                    />
                    <Text style={[styles.googleButtonCopy, { color: theme.primaryText }]}>Continue with Google</Text>
                  </View>
                )}
              </Pressable>
            ) : null}

            {!recoveryMode && !emailOpen && !sentTo ? (
              <Pressable
                accessibilityRole="button"
                disabled={providerDisabled}
                onPress={() => {
                  setError(null);
                  setEmailOpen(true);
                }}
                style={({ pressed }) => [
                  styles.emailTextAction,
                  { opacity: providerDisabled ? 0.48 : pressed ? 0.62 : 1 },
                ]}
              >
                <NativeSymbol color={theme.muted} name="envelope" size={17} />
                <Text style={[styles.emailTextActionCopy, { color: theme.ink }]}>Continue with email</Text>
              </Pressable>
            ) : null}

            {(emailOpen || recoveryMode || sentTo) ? (
              <View style={styles.emailGroup}>
                {!sentTo ? (
                  <View style={[styles.inlineEmail, { backgroundColor: theme.raised, borderColor: error ? theme.danger : theme.line }]}>
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
                      style={[styles.inlineEmailInput, { color: theme.ink }]}
                      textContentType="emailAddress"
                      value={email}
                    />
                    <Pressable
                      accessibilityRole="button"
                      disabled={isBusy || !isValidEmail(email) || (requiresConsent && !termsAccepted)}
                      onPress={() => void submitEmail()}
                      style={({ pressed }) => [
                        styles.inlineContinue,
                        {
                          backgroundColor: theme.primaryFill,
                          opacity: isBusy || !isValidEmail(email) || (requiresConsent && !termsAccepted)
                            ? 0.34
                            : pressed ? 0.8 : 1,
                        },
                      ]}
                    >
                      {pending === 'email' ? <ActivityIndicator color={theme.primaryText} size="small" /> : (
                        <Text style={[styles.inlineContinueCopy, { color: theme.primaryText }]}>Continue</Text>
                      )}
                    </Pressable>
                  </View>
                ) : (
                  <>
                    <OtpCodeField
                      disabled={isBusy}
                      onChange={(value) => {
                        setEmailOtp(value);
                        if (error) setError(null);
                      }}
                      theme={theme}
                      value={emailOtp}
                    />
                    <Pressable
                      accessibilityRole="button"
                      disabled={isBusy || !isValidEmailOtp(emailOtp)}
                      onPress={() => void submitEmailOtp()}
                      style={({ pressed }) => [
                        styles.verifyButton,
                        {
                          backgroundColor: theme.primaryFill,
                          opacity: isBusy || !isValidEmailOtp(emailOtp) ? 0.34 : pressed ? 0.82 : 1,
                        },
                      ]}
                    >
                      {pending === 'email' ? <ActivityIndicator color={theme.primaryText} /> : (
                        <Text style={[styles.providerButtonCopy, { color: theme.primaryText }]}>Verify</Text>
                      )}
                    </Pressable>
                  </>
                )}

                <Pressable
                  accessibilityRole="button"
                  disabled={isBusy}
                  onPress={() => {
                    if (sentTo) {
                      setSentTo(null);
                      setEmailOtp('');
                    } else if (recoveryMode) {
                      resetEmailEntry();
                      setEmailOpen(false);
                      setRecoveryMode(false);
                    } else {
                      resetEmailEntry();
                      setEmailOpen(false);
                    }
                  }}
                  style={styles.backToOptions}
                >
                  <Text style={[styles.smallActionCopy, { color: theme.muted }]}>
                    {sentTo ? 'Use a different email' : recoveryMode ? 'Back to sign in' : 'Back to sign-in options'}
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {requiresConsent ? (
              <View style={styles.consentRow}>
                <Pressable
                  accessibilityLabel="Accept Terms and Privacy Notice"
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: termsAccepted }}
                  onPress={() => setTermsAccepted((accepted) => !accepted)}
                  style={({ pressed }) => [styles.checkboxTarget, pressed && styles.checkboxTargetPressed]}
                >
                  <View
                    style={[
                      styles.checkbox,
                      {
                        backgroundColor: termsAccepted ? theme.primaryFill : theme.card,
                        borderColor: termsAccepted ? theme.primaryFill : theme.muted,
                      },
                    ]}
                  >
                    {termsAccepted ? <NativeSymbol color={theme.primaryText} name="checkmark" size={12} /> : null}
                  </View>
                </Pressable>
                <View style={styles.consentCopy}>
                  <Text style={[styles.consentText, { color: theme.muted }]}>I agree to FLYNT&apos;s</Text>
                  <View style={styles.legalLinks}>
                    <Pressable accessibilityRole="button" onPress={() => setLegalView('terms')}>
                      <Text style={[styles.legalLink, { color: theme.ink }]}>Terms &amp; Safety Notice</Text>
                    </Pressable>
                    <Text style={[styles.consentText, { color: theme.muted }]}>and</Text>
                    <Pressable accessibilityRole="button" onPress={() => setLegalView('privacy')}>
                      <Text style={[styles.legalLink, { color: theme.ink }]}>Privacy Notice</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ) : null}

            {error ? <Text accessibilityLiveRegion="polite" style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}

            {!emailOpen && !sentTo && !recoveryMode ? (
              <View style={styles.secondaryActions}>
                <Pressable accessibilityRole="button" onPress={toggleMode} style={styles.secondaryAction}>
                  <Text style={[styles.smallActionCopy, { color: theme.muted }]}>
                    {authMode === 'create' ? 'Already have an account? ' : 'New to FLYNT? '}
                    <Text style={{ color: theme.ink, fontWeight: '700' }}>{authMode === 'create' ? 'Sign in' : 'Create account'}</Text>
                  </Text>
                </Pressable>
                {authMode === 'sign-in' ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      resetEmailEntry();
                      setRecoveryMode(true);
                      setEmailOpen(true);
                    }}
                    style={styles.secondaryAction}
                  >
                    <Text style={[styles.smallActionCopy, { color: theme.muted }]}>Trouble signing in?</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </View>
        </ScrollView>
      </SafeAreaView>
      <AuthLegalSheet kind={legalView} onDismiss={() => setLegalView(null)} />
    </KeyboardAvoidingView>
  );
}

function OtpCodeField({
  disabled,
  onChange,
  theme,
  value,
}: {
  disabled: boolean;
  onChange: (value: string) => void;
  theme: ReturnType<typeof useFlyntTheme>['theme'];
  value: string;
}) {
  const activeIndex = Math.min(value.length, 5);
  return (
    <View style={styles.otpField}>
      <TextInput
        accessibilityLabel="Six-digit code"
        autoComplete="one-time-code"
        autoFocus
        editable={!disabled}
        keyboardType="number-pad"
        maxLength={6}
        onChangeText={(nextValue) => onChange(normalizeEmailOtp(nextValue))}
        onSubmitEditing={() => undefined}
        style={styles.otpInput}
        textContentType="oneTimeCode"
        value={value}
      />
      <View accessibilityElementsHidden importantForAccessibility="no" pointerEvents="none" style={styles.otpSlots}>
        {Array.from({ length: 6 }, (_, index) => (
          <View
            key={index}
            style={[
              styles.otpSlot,
              {
                backgroundColor: theme.raised,
                borderColor: index === activeIndex && value.length < 6 ? theme.ink : theme.line,
              },
            ]}
          >
            <Text style={[styles.otpDigit, { color: theme.ink }]}>{value[index] ?? ''}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function AuthLegalSheet({ kind, onDismiss }: { kind: LegalView; onDismiss: () => void }) {
  return (
    <FlyntSheet
      eyebrow="EFFECTIVE JULY 27, 2026"
      isPresented={kind !== null}
      onDismiss={onDismiss}
      title={kind === 'privacy' ? 'Privacy Notice' : 'Terms & Safety Notice'}
    >
      {kind === 'privacy' ? (
        <View style={styles.legalContent}>
          <LegalParagraph>FLYNT stores the account, consultation answers, training plan, completed sets, progress, and settings needed to operate and personalize the app.</LegalParagraph>
          <LegalSection title="How your data is used">Relevant profile and training context may be sent to our AI service providers to generate plans and Trainer responses. FLYNT does not use health or training information for advertising or sell it to data brokers.</LegalSection>
          <LegalSection title="Storage and control">Signed-in data is stored with our infrastructure providers, including Supabase and Vercel. Account data is isolated by user. You can sign out, export your data, or permanently delete your account from App settings.</LegalSection>
        </View>
      ) : (
        <View style={styles.legalContent}>
          <LegalParagraph>FLYNT uses artificial intelligence to provide personalized training recommendations. AI output can be incomplete or wrong, and it is not medical advice, diagnosis, rehabilitation, or emergency guidance.</LegalParagraph>
          <LegalSection title="Train within your limits">Use accurate information, appropriate equipment, sound judgment, and a safe environment. Stop an exercise for sharp, severe, radiating, worsening, traumatic, or neurologic symptoms. Consult a physician or qualified clinician before beginning a program when health, injury, pregnancy, medication, or other risk factors may affect exercise.</LegalSection>
          <LegalSection title="You stay in control">Trainer changes are recommendations. FLYNT will show proposed program changes for your approval before applying them. You may reject or edit any proposal.</LegalSection>
          <LegalSection title="Training involves risk">Exercise carries inherent risks, including soreness and injury. FLYNT cannot guarantee safety, performance, physique, or health outcomes. By continuing, you accept responsibility for deciding whether a recommendation is appropriate for you.</LegalSection>
        </View>
      )}
    </FlyntSheet>
  );
}

function LegalParagraph({ children }: { children: string }) {
  const { theme } = useFlyntTheme();
  return <Text style={[styles.legalBody, { color: theme.muted }]}>{children}</Text>;
}

function LegalSection({ children, title }: { children: string; title: string }) {
  const { theme } = useFlyntTheme();
  return (
    <View style={styles.legalSection}>
      <Text style={[styles.legalTitle, { color: theme.ink }]}>{title}</Text>
      <Text style={[styles.legalBody, { color: theme.muted }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 26 },
  brandLockup: { alignItems: 'center', marginTop: 56 },
  brandMark: { width: 39, height: 59, resizeMode: 'contain' },
  wordmark: { marginTop: 25, marginLeft: 12, fontSize: 48, lineHeight: 52, fontWeight: '400', letterSpacing: 12 },
  accountCopy: { alignSelf: 'center', maxWidth: 310, marginTop: spacing.lg, textAlign: 'center', fontSize: 15, lineHeight: 22 },
  actions: { gap: 11, marginTop: 'auto', paddingTop: spacing.xl, paddingBottom: 42 },
  appleButton: { width: '100%', height: 58 },
  providerButton: { position: 'relative', minHeight: 58, borderCurve: 'continuous', borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  providerButtonCopy: { ...type.button, fontSize: 15 },
  googleButtonContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  googleMark: { width: 20, height: 20, resizeMode: 'contain' },
  googleButtonCopy: { fontSize: 18, lineHeight: 22, fontWeight: '600' },
  emailTextAction: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  emailTextActionCopy: { fontSize: 14, lineHeight: 19, fontWeight: '600' },
  emailGroup: { gap: 12 },
  inlineEmail: { minHeight: 58, paddingLeft: 17, paddingRight: 7, borderCurve: 'continuous', borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 8 },
  inlineEmailInput: { flex: 1, minWidth: 0, height: 56, fontSize: 15 },
  inlineContinue: { minWidth: 88, height: 44, paddingHorizontal: 17, borderCurve: 'continuous', borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  inlineContinueCopy: { fontSize: 12, fontWeight: '700' },
  verifyButton: { width: '100%', minHeight: 52, borderCurve: 'continuous', borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  otpField: { position: 'relative', height: 58 },
  otpInput: { position: 'absolute', inset: 0, zIndex: 2, opacity: 0.01, color: 'transparent' },
  otpSlots: { position: 'absolute', inset: 0, flexDirection: 'row', gap: 8 },
  otpSlot: { flex: 1, alignItems: 'center', justifyContent: 'center', borderCurve: 'continuous', borderRadius: 14, borderWidth: StyleSheet.hairlineWidth },
  otpDigit: { fontFamily: 'ui-monospace', fontSize: 20, fontWeight: '600' },
  backToOptions: { minHeight: 32, alignItems: 'center', justifyContent: 'center' },
  consentRow: { marginTop: 2, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  checkboxTarget: { width: 44, height: 44, marginLeft: -11, marginTop: -11, alignItems: 'center', justifyContent: 'center' },
  checkboxTargetPressed: { opacity: 0.7 },
  checkbox: { width: 24, height: 24, borderCurve: 'continuous', borderRadius: 7, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  consentCopy: { flex: 1, gap: 3 },
  consentText: { fontSize: 11, lineHeight: 17 },
  legalLinks: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 5 },
  legalLink: { fontSize: 11, lineHeight: 17, fontWeight: '700', textDecorationLine: 'underline' },
  error: { marginTop: 3, fontSize: 12, lineHeight: 17, textAlign: 'center' },
  secondaryActions: { marginTop: 7, alignItems: 'center', gap: 1 },
  secondaryAction: { minHeight: 32, alignItems: 'center', justifyContent: 'center' },
  smallActionCopy: { fontSize: 11, lineHeight: 16, textAlign: 'center' },
  legalContent: { gap: spacing.md, paddingBottom: spacing.xl },
  legalSection: { gap: spacing.xs },
  legalTitle: { fontSize: 16, lineHeight: 21, fontWeight: '700' },
  legalBody: { fontSize: 15, lineHeight: 23 },
});
