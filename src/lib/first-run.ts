import { File, Paths } from 'expo-file-system';

function introductionMarker() {
  return new File(Paths.document, '.flynt-first-run-introduction.v1');
}

export async function hasSeenFirstRunIntroduction() {
  return introductionMarker().exists;
}

export async function markFirstRunIntroductionSeen() {
  const marker = introductionMarker();
  marker.create({ overwrite: true });
  marker.write('seen');
}
