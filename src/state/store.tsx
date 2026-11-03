import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { DAILY_REWARDS, REPLAY_REWARD } from '../config';
import { LEVELS } from '../game/levelData';
import { THEMES, themeById } from '../game/themes';
import { setHapticsEnabled } from '../util/haptics';
import { setSoundEnabled } from '../util/sound';

export type SaveData = {
  stars: Record<string, number>; // best stars per level
  coins: number;
  owned: string[];
  theme: string;
  haptics: boolean;
  sound: boolean;
  dailyDate: string;
  dailyStreak: number;
  bestStreak: number;
};

const DEFAULTS: SaveData = {
  stars: {},
  coins: 0,
  owned: [THEMES[0].id],
  theme: THEMES[0].id,
  haptics: true,
  sound: true,
  dailyDate: '',
  dailyStreak: 0,
  bestStreak: 0,
};

const KEY = 'watersort:save:v1';

const pad = (n: number) => String(n).padStart(2, '0');
export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** The previous calendar day, including across daylight saving changes. */
export function yesterdayKey(now = new Date()): string {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  return dateKey(d);
}

export type Achievement = { id: string; title: string; desc: string; done: boolean; progress: string };

type Store = {
  ready: boolean;
  data: SaveData;
  /** highest level the player may open */
  unlocked: number;
  levelCount: number;
  completeLevel: (level: number, stars: number) => { reward: number; first: boolean };
  spendCoins: (n: number) => boolean;
  buyTheme: (id: string) => boolean;
  setTheme: (id: string) => void;
  setHaptics: (v: boolean) => void;
  setSound: (v: boolean) => void;
  canClaimDaily: boolean;
  nextDailyReward: number;
  claimDaily: () => { reward: number; streak: number } | null;
  achievements: Achievement[];
  resetAll: () => void;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<SaveData>(DEFAULTS);
  const [ready, setReady] = useState(false);
  const dataRef = useRef(data);
  // Actions read the latest save without waiting for a re-render.
  // eslint-disable-next-line react-hooks/refs
  dataRef.current = data;

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (!alive) return;
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as Partial<SaveData>;
            setData({ ...DEFAULTS, ...parsed, owned: parsed.owned?.length ? parsed.owned : DEFAULTS.owned });
          } catch {
            /* corrupted save: start fresh */
          }
        }
      })
      .finally(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    setHapticsEnabled(data.haptics);
    setSoundEnabled(data.sound);
    AsyncStorage.setItem(KEY, JSON.stringify(data)).catch(() => {});
  }, [data, ready]);

  const levelCount = LEVELS.length;
  const completed = Object.keys(data.stars).length;
  const unlocked = Math.min(levelCount, completed + 1);

  const completeLevel = useCallback((level: number, stars: number) => {
    const cur = dataRef.current;
    const prev = cur.stars[String(level)] ?? 0;
    const first = prev === 0;
    const reward = first ? 20 + 10 * stars : REPLAY_REWARD;
    setData({
      ...cur,
      stars: { ...cur.stars, [String(level)]: Math.max(prev, stars) },
      coins: cur.coins + reward,
    });
    return { reward, first };
  }, []);

  const spendCoins = useCallback((n: number) => {
    const cur = dataRef.current;
    if (cur.coins < n) return false;
    setData({ ...cur, coins: cur.coins - n });
    return true;
  }, []);

  const buyTheme = useCallback((id: string) => {
    const cur = dataRef.current;
    if (cur.owned.includes(id)) return true;
    const price = themeById(id).price;
    if (cur.coins < price) return false;
    setData({ ...cur, coins: cur.coins - price, owned: [...cur.owned, id], theme: id });
    return true;
  }, []);

  const setTheme = useCallback((id: string) => {
    const cur = dataRef.current;
    if (cur.owned.includes(id)) setData({ ...cur, theme: id });
  }, []);

  const setHaptics = useCallback((v: boolean) => setData((d) => ({ ...d, haptics: v })), []);
  const setSound = useCallback((v: boolean) => setData((d) => ({ ...d, sound: v })), []);

  const today = dateKey(new Date());
  const canClaimDaily = data.dailyDate !== today;
  const yesterday = yesterdayKey();
  const streakIfClaimed = data.dailyDate === yesterday ? data.dailyStreak + 1 : 1;
  const nextDailyReward = DAILY_REWARDS[(streakIfClaimed - 1) % DAILY_REWARDS.length];

  const claimDaily = useCallback(() => {
    const cur = dataRef.current;
    const t = dateKey(new Date());
    if (cur.dailyDate === t) return null;
    const y = yesterdayKey();
    const streak = cur.dailyDate === y ? cur.dailyStreak + 1 : 1;
    const reward = DAILY_REWARDS[(streak - 1) % DAILY_REWARDS.length];
    setData({
      ...cur,
      coins: cur.coins + reward,
      dailyDate: t,
      dailyStreak: streak,
      bestStreak: Math.max(cur.bestStreak, streak),
    });
    return { reward, streak };
  }, []);

  const resetAll = useCallback(() => setData(DEFAULTS), []);

  const achievements = useMemo<Achievement[]>(() => {
    const done = Object.keys(data.stars).length;
    const threes = Object.values(data.stars).filter((s) => s >= 3).length;
    const mk = (id: string, title: string, desc: string, cur: number, goal: number): Achievement => ({
      id,
      title,
      desc,
      done: cur >= goal,
      progress: `${Math.min(cur, goal)}/${goal}`,
    });
    return [
      mk('first', 'First Pour', 'Complete level 1', done, 1),
      mk('ten', 'Warming Up', 'Complete 10 levels', done, 10),
      mk('twentyfive', 'Getting Serious', 'Complete 25 levels', done, 25),
      mk('fifty', 'Half Century', 'Complete 50 levels', done, 50),
      mk('hundred', 'Centurion', 'Complete 100 levels', done, 100),
      mk('perfect', 'Perfectionist', 'Earn 3 stars on 10 levels', threes, 10),
      mk('decor', 'Decorator', 'Own 3 themes', data.owned.length, 3),
      mk('streak', 'Regular', 'Claim the daily reward 7 days in a row', data.bestStreak, 7),
    ];
  }, [data]);

  const value: Store = {
    ready,
    data,
    unlocked,
    levelCount,
    completeLevel,
    spendCoins,
    buyTheme,
    setTheme,
    setHaptics,
    setSound,
    canClaimDaily,
    nextDailyReward,
    claimDaily,
    achievements,
    resetAll,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const v = useContext(Ctx);
  if (!v) throw new Error('StoreProvider missing');
  return v;
}
