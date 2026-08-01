import {
  Button as SwiftButton,
  Form,
  HStack,
  Host,
  Image as SwiftImage,
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
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { radius, spacing, themeFor } from '@/constants/theme';
import { NativeMaterialSheet } from '@/components/native-material-sheet';
import { NativeSymbol } from '@/components/native-symbol';
import { type ChoiceKind, SettingsChoiceSheet } from '@/components/settings-choice-sheet';
import { useFlyntTheme } from '@/hooks/use-flynt-theme';
import { selection } from '@/lib/haptics';
import { clearSecureSession } from '@/lib/secure-session';
import { useLifecycleNavigation } from '@/providers/lifecycle-navigation-provider';
import { useSettingsPreferences } from '@/providers/settings-preferences-provider';

type Panel = 'profile' | 'app';
type ProfileSheet = 'personal' | 'training' | null;

function NativeValueButton({ label, value, danger = false, onPress }: { label: string; value?: string; danger?: boolean; onPress: () => void }) {
  const { theme } = useFlyntTheme();
  return (
    <SwiftButton modifiers={[buttonStyle('plain')]} onPress={() => { void selection(); onPress(); }}>
      <HStack spacing={8}>
        <SwiftText modifiers={[foregroundColor(danger ? theme.danger : theme.ink)]}>{label}</SwiftText>
        <Spacer />
        {value ? <SwiftText modifiers={[foregroundColor(theme.muted)]}>{value}</SwiftText> : null}
        <SwiftImage color={theme.muted} size={13} systemName="chevron.right" />
      </HStack>
    </SwiftButton>
  );
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

function EditField({ label, value, onChangeText, keyboardType = 'default' }: { label: string; value: string; onChangeText: (value: string) => void; keyboardType?: 'default' | 'number-pad' }) {
  const { mode } = useFlyntTheme();
  const theme = themeFor(mode === 'dark' ? 'light' : 'dark');
  return (
    <View style={[styles.editField, { borderBottomColor: theme.line }]}>
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
  const isDarkSheet = mode === 'light';
  const theme = themeFor(isDarkSheet ? 'dark' : 'light');
  const title = kind === 'personal' ? 'Personal Details' : 'Training Profile';
  const trainingRows = [
    { label: 'Primary goal', value: goal, choices: ['Build strength', 'Build muscle', 'General fitness', 'Athletic performance'], setValue: setGoal },
    { label: 'Experience', value: experience, choices: ['Beginner', 'Intermediate', 'Advanced'], setValue: setExperience },
    { label: 'Weekly schedule', value: schedule, choices: ['3 days', '4 days', '5 days', '6 days'], setValue: setSchedule },
    { label: 'Equipment', value: equipment, choices: ['Full gym', 'Home gym', 'Dumbbells', 'Bodyweight'], setValue: setEquipment },
  ];
  const [activeTrainingChoice, setActiveTrainingChoice] = useState<string | null>(null);
  const activeRow = trainingRows.find((row) => row.label === activeTrainingChoice);

  return (
    <NativeMaterialSheet
      colorScheme={isDarkSheet ? 'dark' : 'light'}
      detents={[{ fraction: kind === 'personal' ? 0.7 : 0.66 }]}
      isPresented={visible}
      onDismiss={onClose}
    >
      <View style={styles.sheet}>
          <SafeAreaView edges={['bottom']} style={styles.sheetSafeArea}>
          <View style={[styles.sheetHeader, { borderBottomColor: theme.line }]}>
            <View style={styles.sheetHeaderSide}>
              {activeRow ? (
                <Pressable accessibilityLabel="Back" accessibilityRole="button" onPress={() => setActiveTrainingChoice(null)} style={styles.sheetBackButton}>
                  <NativeSymbol color={theme.ink} name="chevron.left" size={17} />
                </Pressable>
              ) : null}
            </View>
            <Text accessibilityRole="header" style={[styles.sheetTitle, { color: theme.ink }]}>{activeRow?.label ?? title}</Text>
            <View style={styles.sheetHeaderSide}>
              <Pressable accessibilityLabel="Close" accessibilityRole="button" onPress={() => { void selection(); onClose(); }} style={[styles.sheetCloseButton, { backgroundColor: theme.card }]}>
                <NativeSymbol color={theme.ink} name="xmark" size={16} />
              </Pressable>
            </View>
          </View>
          <ScrollView contentContainerStyle={styles.sheetContent} keyboardDismissMode="interactive">
            {activeRow ? (
              <View style={styles.sheetChoices}>
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
            ) : kind === 'personal' ? (
              <View style={styles.editFields}>
                <EditField label="Name" onChangeText={setName} value={name} />
                <EditField keyboardType="number-pad" label="Age" onChangeText={setAge} value={age} />
                <EditField label="Height" onChangeText={setHeight} value={height} />
                <EditField label="Weight" onChangeText={setWeight} value={weight} />
              </View>
            ) : (
              <View style={styles.sheetChoices}>
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
            {!activeRow ? <Text style={[styles.sheetNote, { color: theme.muted }]}>These details help Trainer understand your context. Program decisions remain server-owned.</Text> : null}
          </ScrollView>
          </SafeAreaView>
      </View>
    </NativeMaterialSheet>
  );
}

export default function SettingsScreen() {
  const { mode, preference, setPreference, theme } = useFlyntTheme();
  const { signOut } = useLifecycleNavigation();
  const {
    reminders,
    setReminders,
    reminderTime,
    progression,
    setProgression,
    progressionStyle,
    restTimers,
    setRestTimers,
    restLength,
    spotifyDisplay,
  } = useSettingsPreferences();
  const [panel, setPanel] = useState<Panel>('profile');
  const [profileSheet, setProfileSheet] = useState<ProfileSheet>(null);
  const [choiceSheet, setChoiceSheet] = useState<ChoiceKind | null>(null);
  const [name, setName] = useState('Luke');
  const [age, setAge] = useState('35');
  const [height, setHeight] = useState(`5′ 11″`);
  const [weight, setWeight] = useState('180 lb');
  const [goal, setGoal] = useState('Build strength');
  const [experience, setExperience] = useState('Intermediate');
  const [schedule, setSchedule] = useState('4 days');
  const [equipment, setEquipment] = useState('Full gym');

  async function performSignOut() {
    await clearSecureSession();
    signOut();
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
    void selection();
    router.dismissTo('/(tabs)/trainer');
  }

  function openChoice(kind: ChoiceKind) {
    void selection();
    setChoiceSheet(kind);
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.canvas }]} testID="screen-settings">
      <SafeAreaView edges={['top']} style={styles.safeArea}>
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
            onSelectionChange={(next) => { void selection(); setPanel(next); }}
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
                <View style={[styles.profileAvatar, { backgroundColor: theme.primaryFill }]}><Text style={[styles.profileAvatarText, { color: theme.primaryText }]}>LM</Text></View>
              </View>
              <Text accessibilityRole="header" style={[styles.profileName, { color: theme.ink }]}>{name || 'Your profile'}</Text>
              <Text style={[styles.profileIdentity, { color: theme.muted }]}>{goal} · {experience}</Text>
              <Pressable accessibilityRole="button" onPress={() => { void selection(); setProfileSheet('personal'); }} style={({ pressed }) => [styles.editProfileButton, { borderColor: theme.line, opacity: pressed ? 0.55 : 1 }]}>
                <Text style={[styles.editProfileText, { color: theme.ink }]}>Edit Personal Details</Text>
              </Pressable>
            </View>

            <View style={[styles.metricsRail, { borderColor: theme.line }]}>
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

            <View style={styles.trainerContext}>
              <Text style={[styles.contextEyebrow, { color: theme.muted }]}>TRAINER CONTEXT</Text>
              <Text style={[styles.contextTitle, { color: theme.ink }]}>Built around {schedule.toLowerCase()} of focused training.</Text>
              <Text style={[styles.contextBody, { color: theme.muted }]}>Your current plan prioritizes {goal.toLowerCase()} with {equipment.toLowerCase()} access and recovery-aware progression.</Text>
              <View style={styles.contextActions}>
                <Pressable accessibilityRole="button" onPress={() => { void selection(); setProfileSheet('training'); }} style={({ pressed }) => [styles.primaryProfileAction, { backgroundColor: theme.primaryFill, opacity: pressed ? 0.72 : 1 }]}>
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
            <Form modifiers={[listStyle('plain'), scrollContentBackground('hidden'), background(theme.canvas)]}>
              <Section modifiers={[listRowBackground('transparent')]} title="Appearance">
                <Picker
                  modifiers={[
                    pickerStyle('segmented'),
                    controlSize('large'),
                    frame({ height: 40 }),
                    ...(mode === 'light' ? [tint('#0B0B0B')] : []),
                  ]}
                  onSelectionChange={(next) => { void selection(); setPreference(next as typeof preference); }}
                  selection={preference}
                >
                  <SwiftText modifiers={[tag('system')]}>System</SwiftText>
                  <SwiftText modifiers={[tag('light')]}>Light</SwiftText>
                  <SwiftText modifiers={[tag('dark')]}>Dark</SwiftText>
                </Picker>
              </Section>

              <Section modifiers={[listRowBackground('transparent')]} title="Music">
                <NativeValueButton label="Spotify Player" onPress={() => openChoice('spotify')} value={spotifyDisplay} />
              </Section>

              <Section modifiers={[listRowBackground('transparent')]} title="Workout">
                <SwiftToggle isOn={reminders} label="Workout Reminders" onIsOnChange={setReminders} />
                {reminders ? <NativeValueButton label="Reminder Time" onPress={() => openChoice('reminder')} value={reminderTime} /> : null}
                <SwiftToggle isOn={progression} label="Automatic Progression" onIsOnChange={setProgression} />
                {progression ? <NativeValueButton label="Progression Style" onPress={() => openChoice('progression')} value={progressionStyle} /> : null}
                <SwiftToggle isOn={restTimers} label="Rest Timers" onIsOnChange={setRestTimers} />
                {restTimers ? <NativeValueButton label="Rest Duration" onPress={() => openChoice('rest')} value={restLength} /> : null}
              </Section>

              <Section footer={<SwiftText>FLYNT for iOS Preview</SwiftText>} modifiers={[listRowBackground('transparent')]} title="Account & Data">
                <VStack
                  modifiers={[
                    listRowBackground('transparent'),
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

      {profileSheet ? (
        <ProfileEditSheet
          age={age}
          equipment={equipment}
          experience={experience}
          goal={goal}
          height={height}
          kind={profileSheet}
          name={name}
          onClose={() => setProfileSheet(null)}
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
      <SettingsChoiceSheet
        isPresented={choiceSheet !== null}
        kind={choiceSheet ?? 'spotify'}
        onDismiss={() => setChoiceSheet(null)}
      />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { flex: 1 },
  topbar: { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.sm },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  topbarTitle: { fontSize: 17, lineHeight: 22, fontWeight: '600', letterSpacing: -0.2 },
  panelPicker: { height: 50, marginHorizontal: 20, marginTop: 4, marginBottom: 8 },
  formHost: { flex: 1 },
  profileContent: { paddingHorizontal: 22, paddingTop: 24, paddingBottom: 64 },
  profileHero: { alignItems: 'center' },
  avatarRing: { width: 94, height: 94, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderRadius: 47 },
  profileAvatar: { width: 82, height: 82, alignItems: 'center', justifyContent: 'center', borderRadius: 41 },
  profileAvatarText: { fontSize: 22, lineHeight: 27, fontWeight: '700', letterSpacing: -0.4 },
  profileName: { marginTop: 18, fontSize: 32, lineHeight: 36, fontWeight: '600', letterSpacing: -1.2 },
  profileIdentity: { marginTop: 5, fontSize: 14, lineHeight: 19, textTransform: 'capitalize' },
  editProfileButton: { minHeight: 44, justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.pill, marginTop: 18, paddingHorizontal: 20 },
  editProfileText: { fontSize: 14, lineHeight: 19, fontWeight: '600' },
  metricsRail: { minHeight: 88, flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, marginTop: 32 },
  profileMetric: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  metricLabel: { fontSize: 9, lineHeight: 12, fontWeight: '700', letterSpacing: 1.1 },
  metricValue: { fontSize: 17, lineHeight: 22, fontWeight: '600', letterSpacing: -0.25 },
  trainerContext: { paddingTop: 32 },
  contextEyebrow: { fontSize: 10, lineHeight: 13, fontWeight: '700', letterSpacing: 1.25 },
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
  sheet: { flex: 1 },
  sheetSafeArea: { flex: 1 },
  sheetHeader: { minHeight: 58, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: spacing.sm },
  sheetHeaderSide: { width: 64, alignItems: 'flex-end', justifyContent: 'center' },
  sheetBackButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  sheetTitle: { flex: 1, fontSize: 17, lineHeight: 22, fontWeight: '600', textAlign: 'center' },
  sheetCloseButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
  sheetContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  editFields: { gap: spacing.xs },
  editField: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth },
  editLabel: { width: 92, fontSize: 14, lineHeight: 19, fontWeight: '500' },
  editInput: { flex: 1, minHeight: 44, fontSize: 17, lineHeight: 22, textAlign: 'right' },
  sheetChoices: { marginTop: spacing.xs },
  sheetChoiceRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  sheetNote: { marginTop: spacing.lg, fontSize: 13, lineHeight: 19 },
});
