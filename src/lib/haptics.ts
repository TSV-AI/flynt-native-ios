import * as Haptics from 'expo-haptics';

export async function selection() {
  await Haptics.selectionAsync();
}

export async function directManipulation() {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export async function deliberateAction() {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

export async function saved() {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

export async function warning() {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}

export async function failed() {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}
