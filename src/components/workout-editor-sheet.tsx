import { Host as SwiftUIHost, Picker as SwiftUIPicker, Text as SwiftUIText } from '@expo/ui/swift-ui';
import { pickerStyle, tag } from '@expo/ui/swift-ui/modifiers';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { FlyntSheet, FlyntSheetCard } from '@/components/flynt-sheet';
import { NativeSymbol } from '@/components/native-symbol';
import { appSurfaces, radius, spacing, type ColorMode, type Theme } from '@/constants/theme';
import type { ExerciseLibraryEntry } from '@/contracts/app-state';
import type { PreviewExercise } from '@/features/app-preview-data';
import { useFlyntTheme } from '@/hooks/use-flynt-theme';
import { directManipulation, failed, saved, selection, warning } from '@/lib/haptics';
import { formatLoad, loadPickerOptions } from '@/lib/load-picker';
import { fetchExerciseCatalog, resolveApiAssetUrl } from '@/lib/api-client';

type PickerField = 'load' | 'reps' | 'rest' | 'rpe';
type EditorPage = 'exercise' | 'library' | PickerField;

type WorkoutEditorSheetProps = {
  exercises: PreviewExercise[];
  initialExerciseIndex?: number;
  initialPage: 'exercise' | 'library';
  initialReplacingIndex?: number;
  isPresented: boolean;
  onDismiss: () => void;
  onSave: (exercises: PreviewExercise[]) => Promise<void>;
};

function editableExercises(exercises: PreviewExercise[]) {
  return exercises.map((exercise, index) => {
    if (exercise.id) return exercise;
    const slug = exercise.name.toLocaleLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 72) || 'movement';
    return { ...exercise, id: `local-${slug}-${index}` };
  });
}

function exerciseGroup(entry: ExerciseLibraryEntry): PreviewExercise['group'] {
  if (entry.category === 'conditioning') return 'conditioning';
  if (entry.category === 'mobility') return 'bodyweight';
  return /squat|hinge|deadlift|lunge|leg|calf|bridge|step|hip/i.test(`${entry.movement_pattern ?? ''} ${entry.name}`)
    ? 'lower'
    : 'upper';
}

function libraryExercise(entry: ExerciseLibraryEntry): PreviewExercise {
  return {
    id: entry.slug,
    name: entry.name,
    detail: `3 sets · 8–10 reps${entry.equipment.length ? ` · ${entry.equipment.join(' · ')}` : ''}`,
    completed: 0,
    total: 3,
    guideSteps: entry.guide_steps,
    group: exerciseGroup(entry),
    movementPattern: entry.movement_pattern ?? undefined,
    restSeconds: entry.category === 'conditioning' ? 60 : 90,
    targetReps: '8–10',
    visualAlt: entry.visual_alt,
    visualHeight: entry.visual_height,
    visualUrl: resolveApiAssetUrl(entry.visual_url),
    visualWidth: entry.visual_width,
  };
}

export function WorkoutEditorSheet({ exercises, initialExerciseIndex, initialPage, initialReplacingIndex, isPresented, onDismiss, onSave }: WorkoutEditorSheetProps) {
  const { mode, theme } = useFlyntTheme();
  const [page, setPage] = useState<EditorPage>(initialPage);
  const [draft, setDraft] = useState<PreviewExercise[]>(() => editableExercises(exercises));
  const [selectedId, setSelectedId] = useState<string | null>(() => initialExerciseIndex === undefined ? null : editableExercises(exercises)[initialExerciseIndex]?.id ?? null);
  const [replacingId, setReplacingId] = useState<string | null>(() => initialReplacingIndex === undefined ? null : editableExercises(exercises)[initialReplacingIndex]?.id ?? null);
  const [catalog, setCatalog] = useState<ExerciseLibraryEntry[]>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customOpen, setCustomOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [advanced, setAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const selected = selectedId ? draft.find((exercise) => exercise.id === selectedId) ?? null : null;
  const filteredCatalog = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return catalog;
    return catalog.filter((entry) => [entry.name, entry.category, entry.equipment.join(' '), entry.aliases.join(' ')]
      .some((value) => value.toLocaleLowerCase().includes(normalized)));
  }, [catalog, query]);

  async function loadCatalog() {
    setCatalogLoading(true);
    setCatalogError(null);
    try {
      const payload = await fetchExerciseCatalog();
      setCatalog(payload.exercises);
    } catch (error) {
      setCatalogError(error instanceof Error ? error.message : 'The exercise library is unavailable.');
    } finally {
      setCatalogLoading(false);
    }
  }

  useEffect(() => {
    if (!isPresented || initialPage !== 'library') return;
    let active = true;
    void Promise.resolve()
      .then(() => {
        if (!active) return null;
        setCatalogLoading(true);
        setCatalogError(null);
        return fetchExerciseCatalog();
      })
      .then((payload) => {
        if (!active || !payload) return;
        setCatalog(payload.exercises);
      })
      .catch((error: unknown) => {
        if (active) setCatalogError(error instanceof Error ? error.message : 'The exercise library is unavailable.');
      })
      .finally(() => {
        if (active) setCatalogLoading(false);
      });
    return () => {
      active = false;
    };
  }, [initialPage, isPresented]);

  function showLibrary(replaceId: string | null) {
    setReplacingId(replaceId);
    setQuery('');
    setCustomName('');
    setCustomOpen(false);
    setPage('library');
    if (!catalog.length && !catalogLoading) void loadCatalog();
  }

  function applyExercise(exercise: PreviewExercise) {
    let nextDraft: PreviewExercise[];
    if (replacingId) {
      const index = draft.findIndex((item) => item.id === replacingId);
      if (index < 0) return;
      nextDraft = draft.map((item) => item.id === replacingId ? exercise : item);
      setDraft(nextDraft);
    } else {
      nextDraft = [...draft, exercise];
      setDraft(nextDraft);
    }
    void directManipulation();
    if (initialPage === 'library' && (initialReplacingIndex !== undefined || !replacingId)) {
      void saveChanges(nextDraft);
    } else {
      setSelectedId(exercise.id ?? null);
      setPage('exercise');
    }
    setReplacingId(null);
  }

  function addCustomExercise() {
    const name = customName.trim();
    if (!name) return;
    const slug = name.toLocaleLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 72) || 'movement';
    applyExercise({
      id: `custom-${slug}-${Date.now().toString(36)}`,
      name,
      completed: 0,
      detail: '3 sets · 8–10 reps',
      group: 'bodyweight',
      restSeconds: 90,
      targetReps: '8–10',
      total: 3,
    });
  }

  function updateSelected(patch: Partial<PreviewExercise>) {
    if (!selectedId) return;
    setDraft((current) => current.map((exercise) => {
      if (exercise.id !== selectedId) return exercise;
      const next = { ...exercise, ...patch };
      return {
        ...next,
        detail: `${next.total} sets · ${next.targetReps ?? '8–10'} reps${next.targetRpe ? ` · RPE ${next.targetRpe}` : ''}`,
      };
    }));
  }

  function removeSelected() {
    if (!selected) return;
    const nextDraft = draft.filter((exercise) => exercise.id !== selected.id);
    setDraft(nextDraft);
    void saveChanges(nextDraft);
    setSelectedId(null);
    void warning();
  }

  async function saveChanges(nextDraft = draft) {
    if (saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      await onSave(nextDraft);
      await saved();
      onDismiss();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'This workout could not be saved.');
      await failed();
    } finally {
      setSaving(false);
    }
  }

  const title = page === 'exercise' ? selected?.name ?? 'Edit exercise'
      : page === 'library' ? replacingId ? 'Replace exercise' : 'Add an exercise'
        : page === 'load' ? 'Target load'
          : page === 'reps' ? 'Reps'
          : page === 'rest' ? 'Rest'
            : 'RPE target';
  const pickerPage = page === 'load' || page === 'reps' || page === 'rest' || page === 'rpe';
  const showsBack = pickerPage || (page === 'library' && Boolean(replacingId) && initialReplacingIndex === undefined);

  return (
    <FlyntSheet
      closeAccessibilityLabel="Close workout editor"
      eyebrow={page === 'library' ? 'EXERCISE LIBRARY' : pickerPage ? 'EDIT VALUE' : 'EDIT EXERCISE'}
      isPresented={isPresented}
      onBack={showsBack ? () => {
        if (pickerPage) {
          setPage('exercise');
        } else {
          setPage('exercise');
          setReplacingId(null);
        }
      } : undefined}
      onDismiss={onDismiss}
      title={title}
      footer={page === 'exercise' ? (
        <View style={styles.sheetFooter}>
          <Pressable accessibilityRole="button" disabled={saving} onPress={() => void saveChanges()} style={({ pressed }) => [styles.primaryButton, { backgroundColor: theme.primaryFill }, (pressed || saving) && styles.pressed]}>
            {saving ? <ActivityIndicator color={theme.primaryText} /> : <Text style={[styles.primaryCopy, { color: theme.primaryText }]}>Done</Text>}
          </Pressable>
        </View>
      ) : undefined}
    >
      {page === 'exercise' && selected ? (
        <ExercisePage
          advanced={advanced}
          exercise={selected}
          onAdvanced={() => setAdvanced((value) => !value)}
          onRemove={removeSelected}
          onReplace={() => showLibrary(selected.id ?? null)}
          onSelectField={(field) => setPage(field)}
          onUpdate={updateSelected}
          theme={theme}
        />
      ) : pickerPage && selected ? (
        <ValuePickerPage exercise={selected} field={page} mode={mode} onUpdate={updateSelected} theme={theme} />
      ) : (
        <LibraryPage
          catalog={filteredCatalog}
          customName={customName}
          customOpen={customOpen}
          draft={draft}
          error={catalogError}
          loading={catalogLoading}
          mode={mode}
          onAdd={applyExercise}
          onAddCustom={addCustomExercise}
          onCustomName={setCustomName}
          onOpenCustom={() => setCustomOpen(true)}
          onQuery={setQuery}
          onRetry={() => void loadCatalog()}
          query={query}
          replacingId={replacingId}
          theme={theme}
        />
      )}
      {saveError ? <Text accessibilityRole="alert" style={[styles.error, { color: theme.danger }]}>{saveError}</Text> : null}
    </FlyntSheet>
  );
}

function Stepper({ label, onDecrease, onIncrease, theme, value }: { label: string; onDecrease: () => void; onIncrease: () => void; theme: Theme; value: number }) {
  return <View style={styles.fieldGroup}><Text style={[styles.fieldLabel, { color: theme.muted }]}>{label}</Text><View style={[styles.stepper, { backgroundColor: theme.raised }]}>
    <Pressable accessibilityLabel={`Decrease ${label.toLocaleLowerCase()}`} accessibilityRole="button" onPress={onDecrease} style={styles.stepperButton}><NativeSymbol color={theme.ink} name="minus" size={15} /></Pressable>
    <Text accessibilityLabel={`${label} ${value}`} style={[styles.stepperValue, { color: theme.ink }]}>{value}</Text>
    <Pressable accessibilityLabel={`Increase ${label.toLocaleLowerCase()}`} accessibilityRole="button" onPress={onIncrease} style={styles.stepperButton}><NativeSymbol color={theme.ink} name="plus" size={15} /></Pressable>
  </View></View>;
}

function Field({ keyboardType = 'default', label, onChangeText, placeholder, theme, value }: { keyboardType?: 'default' | 'decimal-pad' | 'number-pad'; label: string; onChangeText: (value: string) => void; placeholder?: string; theme: Theme; value: string }) {
  return <View style={styles.fieldGroup}><Text style={[styles.fieldLabel, { color: theme.muted }]}>{label}</Text><TextInput accessibilityLabel={label} keyboardType={keyboardType} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={theme.muted} style={[styles.input, { backgroundColor: theme.raised, color: theme.ink }]} value={value} /></View>;
}

function SelectionField({ label, onPress, theme, value }: { label: string; onPress: () => void; theme: Theme; value: string }) {
  return <View style={styles.fieldGroup}>
    <Text style={[styles.fieldLabel, { color: theme.muted }]}>{label}</Text>
    <Pressable accessibilityLabel={`${label}, ${value}`} accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.selectionField, { backgroundColor: theme.raised }, pressed && styles.pressed]}>
      <Text style={[styles.selectionValue, { color: theme.ink }]}>{value}</Text>
      <NativeSymbol color={theme.muted} name="chevron.right" size={15} />
    </Pressable>
  </View>;
}

function formatRest(seconds: number) {
  if (seconds < 60) return `${seconds} sec`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder ? `${minutes} min ${remainder} sec` : `${minutes} min`;
}

function ExercisePage({ advanced, exercise, onAdvanced, onRemove, onReplace, onSelectField, onUpdate, theme }: { advanced: boolean; exercise: PreviewExercise; onAdvanced: () => void; onRemove: () => void; onReplace: () => void; onSelectField: (field: PickerField) => void; onUpdate: (patch: Partial<PreviewExercise>) => void; theme: Theme }) {
  return <View style={styles.stack}>
    <Stepper label="Sets" onDecrease={() => onUpdate({ total: Math.max(1, exercise.total - 1) })} onIncrease={() => onUpdate({ total: Math.min(20, exercise.total + 1) })} theme={theme} value={exercise.total} />
    <SelectionField label="REPS" onPress={() => onSelectField('reps')} theme={theme} value={exercise.targetReps || 'Not set'} />
    <SelectionField label="TARGET LOAD" onPress={() => onSelectField('load')} theme={theme} value={exercise.targetLoad === undefined ? 'Not set' : `${exercise.targetLoad} lb`} />
    <SelectionField label="REST" onPress={() => onSelectField('rest')} theme={theme} value={formatRest(exercise.restSeconds ?? 90)} />
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: advanced }} onPress={onAdvanced} style={({ pressed }) => [styles.disclosure, { borderColor: theme.line }, pressed && styles.pressed]}>
      <View><Text style={[styles.rowTitle, { color: theme.ink }]}>Advanced</Text><Text style={[styles.rowDetail, { color: theme.muted }]}>RPE, tempo, and coaching notes</Text></View>
      <NativeSymbol color={theme.muted} name={advanced ? 'chevron.up' : 'chevron.down'} size={15} />
    </Pressable>
    {advanced ? <View style={styles.stack}>
      <SelectionField label="RPE TARGET" onPress={() => onSelectField('rpe')} theme={theme} value={exercise.targetRpe === undefined ? 'Not set' : String(exercise.targetRpe)} />
      <Field label="Tempo" onChangeText={(value) => onUpdate({ tempo: value })} placeholder="Optional" theme={theme} value={exercise.tempo ?? ''} />
      <View style={styles.fieldGroup}><Text style={[styles.fieldLabel, { color: theme.muted }]}>NOTES</Text><TextInput accessibilityLabel="Notes" maxLength={180} multiline onChangeText={(value) => onUpdate({ note: value })} placeholder="Add a cue or reminder" placeholderTextColor={theme.muted} style={[styles.noteInput, { backgroundColor: theme.raised, color: theme.ink }]} value={exercise.note ?? ''} /></View>
    </View> : null}
    <Pressable accessibilityRole="button" onPress={onReplace} style={({ pressed }) => [styles.actionRow, { borderColor: theme.line }, pressed && styles.pressed]}><View><Text style={[styles.rowTitle, { color: theme.ink }]}>Replace exercise</Text><Text style={[styles.rowDetail, { color: theme.muted }]}>Choose another movement from the library</Text></View><NativeSymbol color={theme.muted} name="chevron.right" size={15} /></Pressable>
    <Pressable accessibilityRole="button" onPress={onRemove} style={({ pressed }) => [styles.actionRow, { borderColor: theme.line }, pressed && styles.pressed]}><View><Text style={[styles.rowTitle, { color: theme.danger }]}>Remove exercise</Text><Text style={[styles.rowDetail, { color: theme.muted }]}>Remove this exercise from the workout</Text></View></Pressable>
  </View>;
}

function repOptions(current: string | undefined) {
  const standard = [
    ...Array.from({ length: 30 }, (_, index) => String(index + 1)),
    '3–5', '5–8', '6–8', '8–10', '10–12', '12–15', '15–20', 'AMRAP',
  ];
  return [...new Set([current, ...standard].filter((value): value is string => Boolean(value)))];
}

function ValuePickerPage({ exercise, field, mode, onUpdate, theme }: { exercise: PreviewExercise; field: PickerField; mode: ColorMode; onUpdate: (patch: Partial<PreviewExercise>) => void; theme: Theme }) {
  const options = field === 'load'
    ? [
        { label: 'Not set', value: 'unset' },
        ...loadPickerOptions(exercise.targetLoad).map((value) => ({ label: `${formatLoad(value)} lb`, value: String(value) })),
      ]
    : field === 'reps'
    ? repOptions(exercise.targetReps).map((value) => ({ label: value, value }))
    : field === 'rest'
      ? Array.from({ length: 901 }, (_, seconds) => ({ label: formatRest(seconds), value: String(seconds) }))
      : [{ label: 'Not set', value: 'unset' }, ...Array.from({ length: 19 }, (_, index) => {
        const value = 1 + index * 0.5;
        return { label: String(value), value: String(value) };
      })];
  const selectedValue = field === 'load'
    ? exercise.targetLoad === undefined ? 'unset' : String(exercise.targetLoad)
    : field === 'reps'
    ? exercise.targetReps || options[0].value
    : field === 'rest'
      ? String(exercise.restSeconds ?? 90)
      : exercise.targetRpe === undefined ? 'unset' : String(exercise.targetRpe);

  return <View style={styles.pickerPage}>
    <Text style={[styles.helper, { color: theme.muted }]}>{field === 'load' ? 'Choose the prescribed load in pounds.' : field === 'reps' ? 'Choose the prescribed rep target.' : field === 'rest' ? 'Choose the exact recovery time.' : 'Choose the target effort for this exercise.'}</Text>
    <SwiftUIHost colorScheme={mode} style={styles.pickerHost}>
      <SwiftUIPicker
        modifiers={[pickerStyle('wheel')]}
        onSelectionChange={(value) => {
          const next = String(value);
          if (field === 'load') onUpdate({ targetLoad: next === 'unset' ? undefined : Number(next) });
          if (field === 'reps') onUpdate({ targetReps: next });
          if (field === 'rest') onUpdate({ restSeconds: Number(next) });
          if (field === 'rpe') onUpdate({ targetRpe: next === 'unset' ? undefined : Number(next) });
          void selection();
        }}
        selection={selectedValue}
      >
        {options.map((option) => <SwiftUIText key={option.value} modifiers={[tag(option.value)]}>{option.label}</SwiftUIText>)}
      </SwiftUIPicker>
    </SwiftUIHost>
  </View>;
}

function LibraryPage({ catalog, customName, customOpen, draft, error, loading, mode, onAdd, onAddCustom, onCustomName, onOpenCustom, onQuery, onRetry, query, replacingId, theme }: {
  catalog: ExerciseLibraryEntry[]; customName: string; customOpen: boolean; draft: PreviewExercise[]; error: string | null; loading: boolean;
  mode: ColorMode; onAdd: (exercise: PreviewExercise) => void; onAddCustom: () => void; onCustomName: (value: string) => void; onOpenCustom: () => void; onQuery: (value: string) => void; onRetry: () => void; query: string; replacingId: string | null; theme: Theme;
}) {
  return <View style={styles.stack}>
    <View style={[styles.search, { backgroundColor: theme.raised }]}><NativeSymbol color={theme.muted} name="magnifyingglass" size={16} /><TextInput accessibilityLabel="Search exercises" autoCapitalize="none" autoCorrect={false} onChangeText={onQuery} placeholder="Search exercises" placeholderTextColor={theme.muted} returnKeyType="search" style={[styles.searchInput, { color: theme.ink }]} value={query} /></View>
    {loading ? <View style={styles.center}><ActivityIndicator color={theme.ink} /><Text style={[styles.helper, { color: theme.muted }]}>Getting the current FLYNT library.</Text></View> : null}
    {error ? <View style={styles.center}><Text accessibilityRole="alert" style={[styles.error, { color: theme.danger }]}>{error}</Text><Pressable accessibilityRole="button" onPress={onRetry} style={styles.undoButton}><Text style={[styles.undoCopy, { color: theme.ink }]}>Try again</Text></Pressable></View> : null}
    {!loading && !error && !catalog.length ? <View style={styles.center}><Text style={[styles.rowTitle, { color: theme.ink }]}>No exact match yet.</Text><Text style={[styles.helper, { color: theme.muted }]}>Add your own name and track it immediately.</Text></View> : null}
    {catalog.map((entry) => {
      const alreadyAdded = draft.some((exercise) => exercise.id === entry.slug && exercise.id !== replacingId);
      const visual = resolveApiAssetUrl(entry.visual_url);
      return <FlyntSheetCard key={entry.slug} style={styles.libraryRow}>
        <View style={[styles.libraryVisual, { backgroundColor: appSurfaces[mode].exerciseSurface }]}>{visual ? <Image accessibilityIgnoresInvertColors resizeMode="contain" source={{ uri: visual }} style={styles.libraryImage} /> : <NativeSymbol color={theme.muted} name="figure.strengthtraining.traditional" size={22} />}</View>
        <View style={styles.libraryCopy}><Text style={[styles.fieldLabel, { color: theme.muted }]}>{entry.category.toLocaleUpperCase()}</Text><Text style={[styles.rowTitle, { color: theme.ink }]}>{entry.name}</Text><Text style={[styles.rowDetail, { color: theme.muted }]}>{entry.equipment.length ? entry.equipment.join(' · ') : 'Bodyweight'}</Text></View>
        <Pressable accessibilityLabel={alreadyAdded ? `${entry.name} already added` : replacingId ? `Replace with ${entry.name}` : `Add ${entry.name}`} accessibilityRole="button" disabled={alreadyAdded} onPress={() => onAdd(libraryExercise(entry))} style={styles.iconButton}><NativeSymbol color={alreadyAdded ? theme.muted : theme.ink} name={alreadyAdded ? 'checkmark' : replacingId ? 'arrow.left.arrow.right' : 'plus'} size={17} /></Pressable>
      </FlyntSheetCard>;
    })}
    {customOpen ? <FlyntSheetCard style={styles.customForm}><Text style={[styles.fieldLabel, { color: theme.muted }]}>EXERCISE NAME</Text><View style={styles.customRow}><TextInput accessibilityLabel="Custom exercise name" autoFocus maxLength={100} onChangeText={onCustomName} placeholder="Type your exercise" placeholderTextColor={theme.muted} style={[styles.input, styles.customInput, { backgroundColor: theme.raised, color: theme.ink }]} value={customName} /><Pressable accessibilityRole="button" disabled={!customName.trim()} onPress={onAddCustom} style={[styles.customAdd, { backgroundColor: theme.primaryFill, opacity: customName.trim() ? 1 : 0.4 }]}><Text style={[styles.buttonCopy, { color: theme.primaryText }]}>Add</Text></Pressable></View></FlyntSheetCard> : <Pressable accessibilityRole="button" onPress={onOpenCustom} style={({ pressed }) => [styles.secondaryButton, { borderColor: theme.line }, pressed && styles.pressed]}><NativeSymbol color={theme.ink} name="plus" size={17} /><Text style={[styles.buttonCopy, { color: theme.ink }]}>Add a custom exercise</Text></Pressable>}
  </View>;
}

const styles = StyleSheet.create({
  stack: { gap: spacing.sm }, helper: { fontSize: 15, lineHeight: 21 }, pressed: { opacity: 0.7 },
  rowTitle: { fontSize: 16, lineHeight: 21, fontWeight: '600' }, rowDetail: { marginTop: 3, fontSize: 13, lineHeight: 18 },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill },
  secondaryButton: { minHeight: 52, borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs }, buttonCopy: { fontSize: 16, lineHeight: 21, fontWeight: '600' },
  sheetFooter: { paddingHorizontal: 18, paddingTop: spacing.xs, paddingBottom: spacing.xs },
  primaryButton: { minHeight: 56, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' }, primaryCopy: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  undoButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }, undoCopy: { fontSize: 15, fontWeight: '700' }, error: { fontSize: 14, lineHeight: 20 },
  fieldGroup: { gap: 6 }, fieldLabel: { fontSize: 11, lineHeight: 14, fontWeight: '700', letterSpacing: 1.1 }, input: { minHeight: 50, borderRadius: radius.md, paddingHorizontal: spacing.md, fontSize: 17 }, noteInput: { minHeight: 112, borderRadius: radius.md, padding: spacing.md, fontSize: 16, lineHeight: 22, textAlignVertical: 'top' },
  selectionField: { minHeight: 50, borderRadius: radius.md, paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, selectionValue: { fontSize: 17, lineHeight: 22, fontWeight: '500', fontVariant: ['tabular-nums'] },
  pickerPage: { gap: spacing.lg }, pickerHost: { alignSelf: 'stretch', height: 260 },
  stepper: { height: 50, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center' }, stepperButton: { width: 50, height: 50, alignItems: 'center', justifyContent: 'center' }, stepperValue: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '600', fontVariant: ['tabular-nums'] },
  disclosure: { minHeight: 62, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.xs },
  actionRow: { minHeight: 68, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm },
  search: { minHeight: 50, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, gap: spacing.xs }, searchInput: { flex: 1, minHeight: 48, fontSize: 17 }, center: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  libraryRow: { minHeight: 84, flexDirection: 'row', alignItems: 'center', padding: spacing.xs }, libraryVisual: { width: 72, height: 56, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, libraryImage: { width: '100%', height: '100%' }, libraryCopy: { flex: 1, minWidth: 0, paddingHorizontal: spacing.sm },
  customForm: { padding: spacing.md, gap: spacing.xs }, customRow: { flexDirection: 'row', gap: spacing.xs }, customInput: { flex: 1 }, customAdd: { minWidth: 64, minHeight: 50, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});
