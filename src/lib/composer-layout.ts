export const composerMinimumHeight = 44;
export const trainerComposerMaximumHeight = 92;
export const consultationComposerMaximumHeight = 128;

export function boundedComposerHeight(height: number, maximumHeight: number) {
  return Math.max(composerMinimumHeight, Math.min(maximumHeight, Math.ceil(height)));
}

export function estimatedComposerHeight(message: string, maximumHeight: number) {
  const estimatedLines = message.split('\n').reduce(
    (total, line) => total + Math.max(1, Math.ceil(line.length / 28)),
    0,
  );
  return boundedComposerHeight(
    composerMinimumHeight + (estimatedLines - 1) * 21,
    maximumHeight,
  );
}
