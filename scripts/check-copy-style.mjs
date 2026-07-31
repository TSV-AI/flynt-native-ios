import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';

const projectDirectory = new URL('..', import.meta.url).pathname;
const ignoredDirectories = new Set([
  '.expo',
  '.git',
  'android',
  'dist',
  'ios',
  'node_modules',
]);
const textExtensions = new Set([
  '.css',
  '.html',
  '.js',
  '.json',
  '.md',
  '.mjs',
  '.ts',
  '.tsx',
]);
const forbiddenCharacter = '\u2014';
const violations = [];

async function scan(directory) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;

    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await scan(path);
      continue;
    }
    if (!entry.isFile() || !textExtensions.has(extname(entry.name))) continue;

    const lines = (await readFile(path, 'utf8')).split('\n');
    lines.forEach((line, index) => {
      if (line.includes(forbiddenCharacter)) {
        violations.push(`${relative(projectDirectory, path)}:${index + 1}`);
      }
    });
  }
}

await scan(projectDirectory);

if (violations.length > 0) {
  console.error(`Copy style failed. Remove em dashes from:\n${violations.join('\n')}`);
  process.exitCode = 1;
} else {
  console.log('Copy style passed.');
}
