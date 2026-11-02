import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Tubes } from '../game/logic';

const PREFIX = 'watersort:progress:';
const key = (level: number) => `${PREFIX}${level}`;

export type LevelProgress = { tubes: Tubes; history: Tubes[]; moves: number; extraUsed: boolean };

export function isValidProgress(value: unknown, tubeCount: number): value is LevelProgress {
  if (!value || typeof value !== 'object') return false;
  const p = value as LevelProgress;
  return (
    Array.isArray(p.tubes) &&
    p.tubes.every(Array.isArray) &&
    p.tubes.length === tubeCount + (p.extraUsed ? 1 : 0) &&
    Array.isArray(p.history) &&
    Number.isInteger(p.moves) &&
    p.moves >= 0
  );
}

export async function loadProgress(level: number, tubeCount: number): Promise<LevelProgress | null> {
  try {
    const raw = await AsyncStorage.getItem(key(level));
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return isValidProgress(parsed, tubeCount) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveProgress(level: number, progress: LevelProgress) {
  AsyncStorage.setItem(key(level), JSON.stringify(progress)).catch(() => {});
}

export function clearProgress(level: number) {
  AsyncStorage.removeItem(key(level)).catch(() => {});
}

export async function clearAllProgress() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    await AsyncStorage.multiRemove(keys.filter((k) => k.startsWith(PREFIX)));
  } catch {
    // Nothing else depends on this finishing.
  }
}
