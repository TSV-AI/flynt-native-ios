import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import test from 'node:test';

async function sourceFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const url = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory);
    if (entry.isDirectory()) files.push(...await sourceFiles(url));
    if (entry.isFile() && entry.name.endsWith('.tsx')) files.push(url);
  }
  return files;
}

test('all native sheets use the locked global FLYNT presentation', async () => {
  const directSheetHosts = [];
  for (const file of await sourceFiles(new URL('../', import.meta.url))) {
    const source = await readFile(file, 'utf8');
    assert.doesNotMatch(source, /\bdetents=|\bmaterialOverlayColor=/);
    if (!source.includes('<BottomSheet')) continue;
    directSheetHosts.push(file.pathname.slice(file.pathname.lastIndexOf('/src/') + 5));
    assert.match(source, /flyntSheetBackgroundColor/);
    assert.match(source, /flyntSheetDetent/);
    assert.doesNotMatch(source, /presentationBackgroundMaterial/);
  }

  assert.deepEqual(directSheetHosts.sort(), [
    'components/native-material-sheet.tsx',
    'components/native-today-workout.tsx',
  ]);

  const tokens = await readFile(new URL('../constants/sheet.ts', import.meta.url), 'utf8');
  assert.match(tokens, /fraction: 0\.98/);
  assert.match(tokens, /'#18181ADD'/);
  assert.match(tokens, /'#F7F6F2E8'/);
  assert.match(tokens, /FlyntSheetPresentationOverride/);

  const sharedSheet = await readFile(new URL('../components/flynt-sheet.tsx', import.meta.url), 'utf8');
  assert.match(sharedSheet, /presentationOverride\?: FlyntSheetPresentationOverride/);
  assert.match(sharedSheet, /presentationOverride=\{presentationOverride\}/);
});
