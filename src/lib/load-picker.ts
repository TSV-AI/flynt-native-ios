const maximumLoad = 1000;
const loadStep = 2.5;

export function normalizedLoad(value: string | number | undefined) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(maximumLoad, Math.round(parsed * 2) / 2));
}

export function loadPickerOptions(current: string | number | undefined) {
  const selected = normalizedLoad(current);
  return [...new Set([
    selected,
    ...Array.from({ length: (maximumLoad / loadStep) + 1 }, (_, index) => index * loadStep),
  ])].sort((left, right) => left - right);
}

export function formatLoad(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function normalizedReps(value: string | number | null | undefined) {
  const parsed = typeof value === 'number' ? value : Number.parseInt(value ?? '', 10);
  return Math.min(99, Math.max(1, Number.isFinite(parsed) ? Math.round(parsed) : 1));
}

export function repPickerOptions() {
  return Array.from({ length: 99 }, (_, index) => index + 1);
}
