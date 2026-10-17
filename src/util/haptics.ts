import * as Haptics from 'expo-haptics';

let enabled = true;

export function setHapticsEnabled(v: boolean) {
  enabled = v;
}

export function hapticSelect() {
  if (enabled) Haptics.selectionAsync().catch(() => {});
}

export function hapticLight() {
  if (enabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function hapticSuccess() {
  if (enabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

export function hapticError() {
  if (enabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
}
