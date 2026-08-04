import {
  Button as SwiftButton,
  DatePicker,
  Form,
  HStack,
  Host,
  Picker,
  Section,
  Spacer,
  Text as SwiftText,
  Toggle as SwiftToggle,
  VStack,
} from '@expo/ui/swift-ui';
import {
  background,
  buttonStyle,
  cornerRadius,
  controlSize,
  foregroundColor,
  frame,
  datePickerStyle,
  listRowBackground,
  listRowInsets,
  listRowSeparator,
  listStyle,
  pickerStyle,
  scrollContentBackground,
  strokeBorder,
  tag,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { appSurfaces, radius, spacing, themeFor } from '@/constants/theme';
import { FlyntSheet, FlyntSheetCard } from '@/components/flynt-sheet';
import { NativeSymbol } from '@/components/native-symbol';
import { useFlyntTheme } from '@/hooks/use-flynt-theme';
import { selection } from '@/lib/haptics';
import { savePersonalBasics, savePreferences } from '@/lib/api-client';
import { useLifecycleNavigation } from '@/providers/lifecycle-navigation-provider';
import { useSettingsPreferences } from '@/providers/settings-preferences-provider';

type Panel = 'profile' | 'app';
type ProfileSheet = 'personal' | 'training' | null;

function recordValue(value: unknown, key: string) {
  if (!value || typeof value !== 'object' || !(key in value)) return undefined;
  return (value as Record<string, unknown>)[key];
}

function firstText(value: unknown) {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (Array.isArray(value)) {
    const item = value.find((entry) => typeof entry === 'string' && entry.trim());
    return typeof item === 'string' ? item.trim() : '';
  }
  return '';
}

function formatHeight(value: number | null) {
  if (value === null) return 'Not set';
  return `${Math.floor(value / 12)}′ ${Math.round(value % 12)}″`;
}

function initialsForName(value: string) {
  return value.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'F';
}

function twentyFourHourTime(value: string) {
  const match = /^(\d{1,2}):(\d{2})\s(AM|PM)$/.exec(value);
  if (!match) return '08:00';
  const hour = Number(match[1]) % 12 + (match[3] === 'PM' ? 12 : 0);
  return `${String(hour).padStart(2, '0')}:${match[2]}`;
}

function NativeMenuPicker({ label, onChange, options, value }: { label: string; onChange: (value: string) => void; options: readonly string[]; value: string }) {
  const { theme } = useFlyntTheme();
  return (
    <Picker<string>
      label={label}
      modifiers={[pickerStyle('menu'), tint(theme.ink)]}
      onSelectionChange={(next) => {
        void selection();
        onChange(next);
      }}
      selection={value}
    >
      {options.map((option) => <SwiftText key={option} modifiers={[tag(option)]}>{option}</SwiftText>)}
    </Picker>
  );
}

function dateForReminderTime(value: string) {
  const match = /^(\d{1,2}):(\d{2})\s(AM|PM)$/.exec(value);
  if (!match) return new Date(2000, 0, 1, 8, 0);
  const hour = Number(match[1]) % 12 + (match[3] === 'PM' ? 12 : 0);
  return new Date(2000, 0, 1, hour, Number(match[2]));
}

function reminderTimeForDate(value: Date) {
  const hour = value.getHours();
  const displayHour = hour % 12 || 12;
  const minute = String(value.getMinutes()).padStart(2, '0');
  return `${displayHour}:${minute} ${hour >= 12 ? 'PM' : 'AM'}`;
}

function NativeCenteredButton({ label, treatment, onPress }: { label: string; treatment: 'signout' | 'export' | 'delete'; onPress: () => void }) {
  const { mode, theme } = useFlyntTheme();
  const destructive = treatment === 'delete';
  const accentColor = destructive
    ? theme.danger
    : treatment === 'export'
      ? '#0B0B0B'
      : mode === 'light' ? '#F7F6F2' : theme.ink;
  const fillColor = destructive
    ? mode === 'dark' ? '#E06A6124' : '#B43B321F'
    : treatment === 'export'
      ? '#F7F6F2'
      : mode === 'light' ? '#0B0B0B' : '#00000000';
  const borderColor = destructive
    ? theme.danger
    : treatment === 'signout' && mode === 'light' ? '#0B0B0B' : theme.line;
  return (
    <SwiftButton
      modifiers={[buttonStyle('plain')]}
      onPress={onPress}
      role={destructive ? 'destructive' : 'default'}
    >
      <HStack
        modifiers={[
          frame({ height: 50, maxWidth: 1000 }),
          background(fillColor),
          cornerRadius(16),
          strokeBorder({ color: borderColor, shape: 'roundedRectangle', cornerRadius: 16 }),
        ]}
      >
        <Spacer />
        <SwiftText modifiers={[foregroundColor(accentColor)]}>{label}</SwiftText>
        <Spacer />
      </HStack>
    </SwiftButton>
  );
}

function EditField({ label, value, onChangeText, keyboardType = 'default', showDivider = true }: { label: string; value: string; onChangeText: (value: string) => void; keyboardType?: 'default' | 'number-pad'; showDivider?: boolean }) {
  const { mode } = useFlyntTheme();
  const theme = themeFor(mode);
  return (
    <View style={[styles.editField, { borderBottomColor: theme.line, borderBottomWidth: showDivider ? StyleSheet.hairlineWidth : 0 }]}>
      <Text style={[styles.editLabel, { color: theme.muted }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        selectTextOnFocus
        style={[styles.editInput, { color: theme.ink }]}
        value={value}
      />
    </View>
  );
}

function ProfileEditSheet({
  visible,
  kind,
  onClose,
  name,
  setName,
  age,
  setAge,
  height,
  setHeight,
  weight,
  setWeight,
  goal,
  setGoal,
  experience,
  setExperience,
  schedule,
  setSchedule,
  equipment,
  setEquipment,
}: {
  visible: boolean;
  kind: Exclude<ProfileSheet, null>;
  onClose: () => void;
  name: string;
  setName: (value: string) => void;
  age: string;
  setAge: (value: string) => void;
  height: string;
  setHeight: (value: string) => void;
  weight: string;
  setWeight: (value: string) => void;
  goal: string;
  setGoal: (value: string) => void;
  experience: string;
  setExperience: (value: string) => void;
  schedule: string;
  setSchedule: (value: string) => void;
  equipment: string;
  setEquipment: (value: string) => void;
}) {
  const { mode } = useFlyntTheme();
  const usesCurrentSheetStyle = kind === 'personal';
  const sheetMode = usesCurrentSheetStyle ? mode : mode === 'light' ? 'dark' : 'light';
  const theme = themeFor(sheetMode);
  const trainingRows = [
    { label: 'Primary goal', value: goal, choices: ['Build strength', 'Build muscle', 'General fitness', 'Athletic performance'], setValue: setGoal },
    { label: 'Experience', value: experience, choices: ['Beginner', 'Intermediate', 'Advanced'], setValue: setExperience },
    { label: 'Weekly schedule', value: schedule, choices: ['3 days', '4 days', '5 days', '6 days'], setValue: setSchedule },
    { label: 'Equipment', value: equipment, choices: ['Full gym', 'Home gym', 'Dumbbells', 'Bodyweight'], setValue: setEquipment },
  ];
  const [activeTrainingChoice, setActiveTrainingChoice] = useState<string | null>(null);
  const activeRow = trainingRows.find((row) => row.label === activeTrainingChoice);

  if (kind === 'personal') {
    return (
      <FlyntSheet isPresented={visible} onDismiss={onClose} title="Personal Details">
        <FlyntSheetCard style={styles.personalEditFields}>
          <EditField label="Name" onChangeText={setName} value={name} />
          <EditField keyboardType="number-pad" label="Age" onChangeText={setAge} value={age} />
          <EditField label="Height" onChangeText={setHeight} value={height} />
          <EditField label="Weight" onChangeText={setWeight} showDivider={false} value={weight} />
        </FlyntSheetCard>
        <Text style={[styles.sheetNote, { color: theme.muted }]}>These details help Trainer understand your context. Program decisions remain server-owned.</Text>
      </FlyntSheet>
    );
  }

  return (
    <FlyntSheet
      isPresented={visible}
      mode={sheetMode}
      onBack={activeRow ? () => setActiveTrainingChoice(null) : undefined}
      onDismiss={onClose}
      title={activeRow?.label ?? 'Training Profile'}
    >
      <FlyntSheetCard mode={sheetMode} style={styles.trainingChoices}>
        {activeRow ? (
          <View>
            {activeRow.choices.map((choice, index) => (
              <View key={choice}>
                {index > 0 ? <View style={[styles.divider, { backgroundColor: theme.line }]} /> : null}
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: choice === activeRow.value }}
                  onPress={() => {
                    void selection();
                    activeRow.setValue(choice);
                    setActiveTrainingChoice(null);
                  }}
                  style={styles.sheetChoiceRow}
                >
                  <Text style={[styles.rowTitle, { color: theme.ink }]}>{choice}</Text>
                  {choice === activeRow.value ? <NativeSymbol color={theme.ink} name="checkmark" size={15} /> : null}
                </Pressable>
              </View>
            ))}
          </View>
        ) : (
          <View>
            {trainingRows.map((row, index) => (
              <View key={row.label}>
                {index > 0 ? <View style={[styles.divider, { backgroundColor: theme.line }]} /> : null}
                <Pressable accessibilityRole="button" onPress={() => { void selection(); setActiveTrainingChoice(row.label); }} style={styles.sheetChoiceRow}>
                  <Text style={[styles.rowTitle, { color: theme.ink }]}>{row.label}</Text>
                  <View style={styles.rowTrailing}>
                    <Text style={[styles.rowValue, { color: theme.muted }]}>{row.value}</Text>
                    <NativeSymbol color={theme.muted} name="chevron.right" size={13} />
                  </View>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </FlyntSheetCard>
      {!activeRow ? <Text style={[styles.sheetNote, { color: theme.muted }]}>These details help Trainer understand your context. Program decisions remain server-owned.</Text> : null}
    </FlyntSheet>
  );
}

export default function SettingsScreen() {
  const { mode, preference, setPreference, theme } = useFlyntTheme();
  const primaryBackground = appSurfaces[mode].primaryBackground;
  const itemBackground = appSurfaces[mode].itemBackground;
  const { appState, signOut } = useLifecycleNavigation();
  const {
    reminders,
    setReminders,
    reminderTime,
    setReminderTime,
    progression,
    setProgression,
    progressionStyle,
    setProgressionStyle,
    restTimers,
    setRestTimers,
    restLength,
    setRestLength,
    spotifyDisplay,
    setSpotifyDisplay,
  } = useSettingsPreferences();
  const profile = appState?.profile;
  const report = profile?.trainerReport;
  const snapshotProfile = recordValue(profile?.consultationSnapshot, 'profile');
  const snapshotAnswers = recordValue(profile?.consultationSnapshot, 'answers');
  const primaryGoals = recordValue(snapshotAnswers, 'primaryGoals');
  const trainingDays = appState?.program?.filter((day) => day.dayType !== 'rest' && day.exercises.length > 0).length ?? 0;
  const [panel, setPanel] = useState<Panel>('profile');
  const [profileSheet, setProfileSheet] = useState<ProfileSheet>(null);
  const [name, setName] = useState(profile?.fullName || profile?.email.split('@')[0] || 'Your profile');
  const [age, setAge] = useState(profile?.age == null ? 'Not set' : String(profile.age));
  const [height, setHeight] = useState(formatHeight(profile?.heightInches ?? null));
  const [weight, setWeight] = useState(profile?.currentWeightLb == null ? 'Not set' : `${profile.currentWeightLb} lb`);
  const [goal, setGoal] = useState(firstText(primaryGoals) || firstText(recordValue(report, 'summary')) || 'Your current program');
  const [experience, setExperience] = useState(firstText(recordValue(snapshotProfile, 'experience')) || 'Training profile complete');
  const [schedule, setSchedule] = useState(trainingDays ? `${trainingDays} days` : 'Current program');
  const [equipment, setEquipment] = useState(firstText(recordValue(report, 'equipment')) || firstText(recordValue(snapshotAnswers, 'equipment')) || 'Saved equipment');

  async function persistPreferences(overrides: Partial<NonNullable<typeof appState>['preferences']>) {
    if (!appState) return;
    const next = {
      ...appState.preferences,
      appearance: preference,
      reminderEnabled: reminders,
      reminderTime: twentyFourHourTime(reminderTime),
      progressionEnabled: progression,
      progressionMode: progressionStyle.toLowerCase() as NonNullable<typeof appState>['preferences']['progressionMode'],
      restTimersEnabled: restTimers,
      restTimerMode: (restLength === 'Full recovery' ? 'full_recovery' : restLength === 'Quick' ? 'quick' : 'balanced') as NonNullable<typeof appState>['preferences']['restTimerMode'],
      spotifyPlayerDisplay: spotifyDisplay.toLowerCase() as NonNullable<typeof appState>['preferences']['spotifyPlayerDisplay'],
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || appState.preferences.timeZone,
      ...overrides,
    };
    try {
      await savePreferences(next);
    } catch {
      Alert.alert('Setting not saved', 'FLYNT could not update this setting.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Retry', onPress: () => void persistPreferences(overrides) },
      ]);
    }
  }

  function personalBasics() {
    const heightMatch = /(\d+)\D+(\d+)/.exec(height);
    const nextAge = Number.parseInt(age, 10);
    const nextWeight = Number.parseFloat(weight);
    const heightInches = heightMatch
      ? Number(heightMatch[1]) * 12 + Number(heightMatch[2])
      : Number.parseFloat(height);
    return {
      fullName: name.trim(),
      age: Number.isFinite(nextAge) ? nextAge : null,
      heightInches: Number.isFinite(heightInches) ? heightInches : null,
      currentWeightLb: Number.isFinite(nextWeight) ? nextWeight : null,
    };
  }

  async function persistPersonalBasics() {
    if (!appState) return;
    const profile = personalBasics();
    try {
      await savePersonalBasics(profile);
    } catch {
      Alert.alert('Profile not saved', 'FLYNT could not update your personal details.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Retry', onPress: () => void persistPersonalBasics() },
      ]);
    }
  }

  function closeProfileSheet() {
    const closingSheet = profileSheet;
    setProfileSheet(null);
    if (closingSheet === 'personal') void persistPersonalBasics();
  }

  async function performSignOut() {
    await signOut();
    router.replace('/');
  }

  function confirmSignOut() {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: 'Sign out of FLYNT?',
          message: 'You can sign back in on this device at any time.',
          options: ['Sign Out', 'Cancel'],
          destructiveButtonIndex: 0,
          cancelButtonIndex: 1,
        },
        (index) => { if (index === 0) void performSignOut(); },
      );
      return;
    }
    Alert.alert('Sign out of FLYNT?', 'You can sign back in on this device at any time.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void performSignOut() },
    ]);
  }

  function unavailableUntilConnected(action: string) {
    Alert.alert(`${action} will use your FLYNT account`, 'This preview is not connected to the authoritative account workflow yet.');
  }

  function confirmDelete() {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: 'Delete your FLYNT account?',
          message: 'This permanently removes your account and training data.',
          options: ['Delete Account', 'Cancel'],
          destructiveButtonIndex: 0,
          cancelButtonIndex: 1,
        },
        (index) => { if (index === 0) unavailableUntilConnected('Account deletion'); },
      );
      return;
    }
    Alert.alert('Delete your FLYNT account?', 'This permanently removes your account and training data.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Continue', style: 'destructive', onPress: () => unavailableUntilConnected('Account deletion') },
    ]);
  }

  function openTrainer() {
    router.dismissTo('/(tabs)/trainer');
  }

  const modalActive = profileSheet !== null;

  return (
    <View style={[styles.screen, { backgroundColor: primaryBackground }]} testID="screen-settings">
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View
          accessibilityElementsHidden={modalActive}
          importantForAccessibility={modalActive ? 'no-hide-descendants' : 'auto'}
          style={styles.baseContent}
        >
        <View style={styles.topbar}>
          <Pressable accessibilityLabel="Back" accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
            <NativeSymbol color={theme.ink} name="chevron.left" size={18} />
          </Pressable>
          <Text style={[styles.topbarTitle, { color: theme.ink }]}>Profile & Settings</Text>
          <View style={styles.backButton} />
        </View>

        <Host colorScheme={mode} seedColor={mode === 'light' ? '#0B0B0B' : undefined} style={styles.panelPicker}>
          <Picker<Panel>
            modifiers={[pickerStyle('segmented'), controlSize('large'), frame({ height: 40 })]}
            onSelectionChange={setPanel}
            selection={panel}
          >
            <SwiftText modifiers={[tag('profile')]}>Profile</SwiftText>
            <SwiftText modifiers={[tag('app')]}>App</SwiftText>
          </Picker>
        </Host>

        {panel === 'profile' ? (
          <ScrollView contentContainerStyle={styles.profileContent} showsVerticalScrollIndicator={false}>
            <View style={styles.profileHero}>
              <View style={[styles.avatarRing, { borderColor: theme.line }]}>
                <View style={[styles.profileAvatar, { backgroundColor: theme.primaryFill }]}>
                  {appState?.profile.avatarUrl ? (
                    <Image accessibilityLabel={`${name} profile photo`} source={{ uri: appState.profile.avatarUrl }} style={styles.profileAvatarImage} />
                  ) : (
                    <Text style={[styles.profileAvatarText, { color: theme.primaryText }]}>{initialsForName(name)}</Text>
                  )}
                </View>
              </View>
              <Text accessibilityRole="header" style={[styles.profileName, { color: theme.ink }]}>{name || 'Your profile'}</Text>
              <Text style={[styles.profileIdentity, { color: theme.muted }]}>{experience}</Text>
              <Pressable accessibilityRole="button" onPress={() => setProfileSheet('personal')} style={({ pressed }) => [styles.editProfileButton, { backgroundColor: itemBackground, borderColor: theme.line, opacity: pressed ? 0.55 : 1 }]}>
                <Text style={[styles.editProfileText, { color: theme.ink }]}>Edit Personal Details</Text>
              </Pressable>
            </View>

            <View style={[styles.metricsRail, { backgroundColor: itemBackground, borderColor: theme.line }]}>
              {[
                ['HEIGHT', height],
                ['WEIGHT', weight],
                ['AGE', age],
              ].map(([label, value], index) => (
                <View key={label} style={[styles.profileMetric, index > 0 && { borderLeftColor: theme.line, borderLeftWidth: StyleSheet.hairlineWidth }]}>
                  <Text style={[styles.metricLabel, { color: theme.muted }]}>{label}</Text>
                  <Text style={[styles.metricValue, { color: theme.ink }]}>{value}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.trainerContext, { backgroundColor: itemBackground }]}>
              <Text style={[styles.contextEyebrow, { color: theme.muted }]}>TRAINER CONTEXT</Text>
              <Text style={[styles.contextTitle, { color: theme.ink }]}>Built around {schedule.toLowerCase()} of focused training.</Text>
              <Text style={[styles.contextBody, { color: theme.muted }]}>Your current plan prioritizes {goal.toLowerCase()} with {equipment.toLowerCase()} access and recovery-aware progression.</Text>
              <View style={styles.contextActions}>
                <Pressable accessibilityRole="button" onPress={() => setProfileSheet('training')} style={({ pressed }) => [styles.primaryProfileAction, { backgroundColor: theme.primaryFill, opacity: pressed ? 0.72 : 1 }]}>
                  <Text style={[styles.primaryProfileActionText, { color: theme.primaryText }]}>Edit Training Profile</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={openTrainer} style={({ pressed }) => [styles.secondaryProfileAction, { borderColor: theme.line, opacity: pressed ? 0.55 : 1 }]}>
                  <Text style={[styles.secondaryProfileActionText, { color: theme.ink }]}>Open Trainer</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        ) : (
          <Host colorScheme={mode} seedColor="#34C759" style={styles.formHost} useViewportSizeMeasurement>
            <Form modifiers={[listStyle('plain'), scrollContentBackground('hidden'), background(primaryBackground)]}>
              <Section modifiers={[listRowBackground(primaryBackground)]} title="Appearance">
                <Picker
                  modifiers={[
                    pickerStyle('segmented'),
                    controlSize('large'),
                    frame({ height: 40 }),
                    ...(mode === 'light' ? [tint('#0B0B0B')] : []),
                  ]}
                  onSelectionChange={(next) => {
                    const value = next as typeof preference;
                    setPreference(value);
                    void persistPreferences({ appearance: value });
                  }}
                  selection={preference}
                >
                  <SwiftText modifiers={[tag('system')]}>System</SwiftText>
                  <SwiftText modifiers={[tag('light')]}>Light</SwiftText>
                  <SwiftText modifiers={[tag('dark')]}>Dark</SwiftText>
                </Picker>
              </Section>

              <Section modifiers={[listRowBackground(itemBackground)]} title="Music">
                <NativeMenuPicker label="Spotify Player" onChange={(value) => { setSpotifyDisplay(value); void persistPreferences({ spotifyPlayerDisplay: value.toLowerCase() as 'bar' | 'pill' | 'hidden' }); }} options={['Bar', 'Pill', 'Hidden']} value={spotifyDisplay} />
              </Section>

              <Section modifiers={[listRowBackground(itemBackground)]} title="Workout">
                <SwiftToggle isOn={reminders} label="Workout Reminders" onIsOnChange={(value) => { setReminders(value); void persistPreferences({ reminderEnabled: value }); }} />
                {reminders ? (
                  <DatePicker
                    displayedComponents={['hourAndMinute']}
                    modifiers={[datePickerStyle('compact'), tint(theme.ink)]}
                    onDateChange={(next) => {
                      const value = reminderTimeForDate(next);
                      setReminderTime(value);
                      void persistPreferences({ reminderTime: twentyFourHourTime(value) });
                    }}
                    selection={dateForReminderTime(reminderTime)}
                    title="Reminder Time"
                  />
                ) : null}
                <SwiftToggle isOn={progression} label="Automatic Progression" onIsOnChange={(value) => { setProgression(value); void persistPreferences({ progressionEnabled: value }); }} />
                {progression ? <NativeMenuPicker label="Progression Style" onChange={(value) => { setProgressionStyle(value); void persistPreferences({ progressionMode: value.toLowerCase() as 'conservative' | 'balanced' | 'assertive' | 'custom' }); }} options={['Conservative', 'Balanced', 'Assertive', 'Custom']} value={progressionStyle} /> : null}
                <SwiftToggle isOn={restTimers} label="Rest Timers" onIsOnChange={(value) => { setRestTimers(value); void persistPreferences({ restTimersEnabled: value }); }} />
                {restTimers ? <NativeMenuPicker label="Rest Duration" onChange={(value) => { setRestLength(value); void persistPreferences({ restTimerMode: value === 'Full recovery' ? 'full_recovery' : value === 'Quick' ? 'quick' : 'balanced' }); }} options={['Quick', 'Adaptive', 'Full recovery']} value={restLength} /> : null}
              </Section>

              <Section footer={<SwiftText>{appState ? `Signed in as ${appState.profile.email}. Settings save to your FLYNT account.` : 'Sign in to save account settings.'}</SwiftText>} modifiers={[listRowBackground(primaryBackground)]} title="Account & Data">
                <VStack
                  modifiers={[
                    listRowBackground(primaryBackground),
                    listRowInsets({ top: 6, leading: 0, bottom: 6, trailing: 0 }),
                    listRowSeparator('hidden'),
                  ]}
                  spacing={12}
                >
                  <NativeCenteredButton label="Sign Out" onPress={confirmSignOut} treatment="signout" />
                  <NativeCenteredButton label="Export Data" onPress={() => unavailableUntilConnected('Export')} treatment="export" />
                  <NativeCenteredButton label="Delete Account" onPress={confirmDelete} treatment="delete" />
                </VStack>
              </Section>
            </Form>
          </Host>
        )}
        </View>

      {profileSheet ? (
        <ProfileEditSheet
          age={age}
          equipment={equipment}
          experience={experience}
          goal={goal}
          height={height}
          kind={profileSheet}
          name={name}
          onClose={closeProfileSheet}
          schedule={schedule}
          setAge={setAge}
          setEquipment={setEquipment}
          setExperience={setExperience}
          setGoal={setGoal}
          setHeight={setHeight}
          setName={setName}
          setSchedule={setSchedule}
          setWeight={setWeight}
          visible
          weight={weight}
        />
      ) : null}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { flex: 1 },
  baseContent: { flex: 1 },
  topbar: { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.sm },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  topbarTitle: { fontSize: 17, lineHeight: 22, fontWeight: '600', letterSpacing: -0.2 },
  panelPicker: { height: 50, marginHorizontal: 20, marginTop: 4, marginBottom: 8 },
  formHost: { flex: 1 },
  profileContent: { paddingHorizontal: 22, paddingTop: 24, paddingBottom: 64 },
  profileHero: { alignItems: 'center' },
  avatarRing: { width: 94, height: 94, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderRadius: 47 },
  profileAvatar: { width: 82, height: 82, alignItems: 'center', justifyContent: 'center', borderRadius: 41 },
  profileAvatarImage: { width: 82, height: 82, borderRadius: 41 },
  profileAvatarText: { fontSize: 22, lineHeight: 27, fontWeight: '700', letterSpacing: -0.4 },
  profileName: { marginTop: 18, fontSize: 32, lineHeight: 36, fontWeight: '600', letterSpacing: -1.2 },
  profileIdentity: { marginTop: 5, fontSize: 14, lineHeight: 19, textTransform: 'capitalize' },
  editProfileButton: { minHeight: 44, justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.pill, marginTop: 18, paddingHorizontal: 20 },
  editProfileText: { fontSize: 14, lineHeight: 19, fontWeight: '600' },
  metricsRail: { minHeight: 88, flexDirection: 'row', borderWidth: StyleSheet.hairlineWidth, borderCurve: 'continuous', borderRadius: 20, marginTop: 32, overflow: 'hidden' },
  profileMetric: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  metricLabel: { fontSize: 11, lineHeight: 14, fontWeight: '700', letterSpacing: 1.1 },
  metricValue: { fontSize: 17, lineHeight: 22, fontWeight: '600', letterSpacing: -0.25 },
  trainerContext: { borderCurve: 'continuous', borderRadius: 22, marginTop: 18, padding: 22 },
  contextEyebrow: { fontSize: 11, lineHeight: 14, fontWeight: '700', letterSpacing: 1.25 },
  contextTitle: { maxWidth: 315, marginTop: 10, fontSize: 28, lineHeight: 32, fontWeight: '600', letterSpacing: -1 },
  contextBody: { maxWidth: 325, marginTop: 11, fontSize: 15, lineHeight: 22 },
  contextActions: { gap: 10, marginTop: 24 },
  primaryProfileAction: { minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
  primaryProfileActionText: { fontSize: 16, lineHeight: 21, fontWeight: '600' },
  secondaryProfileAction: { minHeight: 50, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderRadius: 16 },
  secondaryProfileActionText: { fontSize: 16, lineHeight: 21, fontWeight: '600' },
  divider: { height: StyleSheet.hairlineWidth },
  rowTitle: { flexShrink: 1, fontSize: 16, lineHeight: 21, fontWeight: '500', letterSpacing: -0.15 },
  rowTrailing: { maxWidth: '58%', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8 },
  rowValue: { flexShrink: 1, fontSize: 14, lineHeight: 19, textAlign: 'right' },
  personalEditFields: { gap: 0, borderCurve: 'continuous', borderRadius: radius.lg, overflow: 'hidden', paddingHorizontal: spacing.md },
  editField: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  editLabel: { width: 92, fontSize: 14, lineHeight: 19, fontWeight: '500' },
  editInput: { flex: 1, minHeight: 44, fontSize: 17, lineHeight: 22, textAlign: 'right' },
  trainingChoices: { paddingHorizontal: spacing.md },
  sheetChoiceRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  sheetNote: { marginTop: spacing.lg, fontSize: 13, lineHeight: 19 },
});
