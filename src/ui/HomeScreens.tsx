import React, { useMemo } from 'react';
import { Alert, FlatList, Pressable, ScrollView, Switch, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { G } from 'react-native-svg';
import { backgroundScene } from '../art/backgroundScene';
import { Icon, IconName } from '../art/Icons';
import { Logo } from '../art/Logo';
import { TUBE_H_RATIO, physicsFor } from '../art/geometry';
import { renderNode } from '../art/svgRender';
import { buildTubeScene, glossShadow } from '../art/tubeScene';
import { THEMES, Theme, themeById } from '../game/themes';
import { useStore } from '../state/store';
import { hapticLight } from '../util/haptics';
import { CoinPill, GameButton, GOLD, Stars } from './kit';

export type Tab = 'home' | 'levels' | 'themes' | 'more';

// ---------------------------------------------------------------------------
// Bottom tab bar

export function TabBar({ tab, onTab, bottomInset }: { tab: Tab; onTab: (t: Tab) => void; bottomInset: number }) {
  const store = useStore();
  const theme = themeById(store.data.theme);
  const items: { id: Tab; label: string; icon: IconName }[] = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'levels', label: 'Levels', icon: 'grid' },
    { id: 'themes', label: 'Themes', icon: 'palette' },
    { id: 'more', label: 'More', icon: 'star' },
  ];
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: theme.panel,
        borderTopLeftRadius: 26,
        borderTopRightRadius: 26,
        borderTopWidth: 2,
        borderColor: 'rgba(255,255,255,0.18)',
        paddingBottom: bottomInset + 6,
        paddingTop: 10,
      }}
    >
      {items.map((it) => {
        const on = it.id === tab;
        return (
          <Pressable key={it.id} style={{ flex: 1, alignItems: 'center', gap: 4 }} onPress={() => onTab(it.id)}>
            <Icon name={it.icon} size={28} color={on ? theme.accent : '#8ea0c4'} />
            <Text style={{ color: on ? theme.accent : '#8ea0c4', fontWeight: '800', fontSize: 12 }}>{it.label}</Text>
            <View style={{ height: 3, width: 34, borderRadius: 2, backgroundColor: on ? theme.accent : 'transparent' }} />
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Home

const DEMO: { color: number; u: number }[][] = [
  [{ color: 6, u: 1 }, { color: 1, u: 1 }, { color: 0, u: 1 }],
  [{ color: 7, u: 1 }, { color: 4, u: 1 }, { color: 8, u: 1 }],
  [{ color: 3, u: 1 }, { color: 2, u: 1 }, { color: 5, u: 1 }, { color: 0, u: 1 }],
  [{ color: 4, u: 2 }, { color: 3, u: 1 }],
];

function DemoBottles({ width, maxH }: { width: number; maxH: number }) {
  const w = Math.max(34, Math.min(60, (width - 40) / 5.4, (maxH - 14) / TUBE_H_RATIO));
  const gap = w * 0.45;
  const ph = physicsFor(w);
  const H = ph.H;
  const total = DEMO.length * w + (DEMO.length - 1) * gap;
  const scenes = useMemo(
    () =>
      DEMO.map((d, i) => ({
        shadow: glossShadow(w),
        scene: buildTubeScene({
          id: `demo${i}`,
          w,
          angle: 0,
          segments: d.map((s) => ({ color: s.color, vol: s.u * ph.unit })),
        }),
      })),
    [w, ph],
  );
  return (
    <Svg width={total} height={H + 10}>
      {scenes.map((s, i) => (
        <G key={i} x={i * (w + gap)} y={4}>
          {renderNode(s.shadow)}
          {renderNode(s.scene)}
        </G>
      ))}
    </Svg>
  );
}

export function HomeScreen({
  level,
  maxLevel,
  onLevel,
  onPlay,
  onDaily,
  onAchievements,
}: {
  level: number;
  maxLevel: number;
  onLevel: (n: number) => void;
  onPlay: () => void;
  onDaily: () => void;
  onAchievements: () => void;
}) {
  const store = useStore();
  const theme = themeById(store.data.theme);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const logoW = Math.min(270, width - 60);
  const logoH = logoW * 0.66 - 16;
  // space left for the demo bottles after the fixed pieces (tab bar ~84)
  const demoMaxH = height - insets.top - insets.bottom - 84 - (52 + 88 + logoH + 4 + 68 + 16 + 44 + 28);
  const sideBtn = (icon: IconName, label: string, onPress: () => void, dot?: boolean) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: 78,
        height: 78,
        borderRadius: 20,
        backgroundColor: theme.panel,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.25)',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        transform: [{ scale: pressed ? 0.94 : 1 }],
      })}
    >
      <Icon name={icon} size={32} color={GOLD} />
      <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 }}>{label}</Text>
      {dot ? <View style={{ position: 'absolute', top: 6, right: 6, width: 14, height: 14, borderRadius: 7, backgroundColor: '#ff3b4d', borderWidth: 2, borderColor: '#fff' }} /> : null}
    </Pressable>
  );
  return (
    <View style={{ flex: 1, paddingHorizontal: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 }}>
        <CoinPill coins={store.data.coins} theme={theme} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
        {sideBtn('gift', 'DAILY REWARD', onDaily, store.canClaimDaily)}
        {sideBtn('trophy', 'ACHIEVEMENTS', onAchievements)}
      </View>
      <View style={{ alignItems: 'center', marginTop: -16 }}>
        <Logo width={logoW} />
      </View>
      <View style={{ alignItems: 'center', marginTop: 4 }}>
        <DemoBottles width={width} maxH={demoMaxH} />
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <GameButton label="PLAY" icon="play" width={250} height={68} fontSize={32} onPress={onPlay} />
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.panel,
            borderRadius: 22,
            borderWidth: 2,
            borderColor: 'rgba(255,255,255,0.22)',
            height: 44,
            width: 190,
            justifyContent: 'space-between',
          }}
        >
          <Pressable style={{ paddingHorizontal: 14, height: 44, justifyContent: 'center' }} onPress={() => onLevel(Math.max(1, level - 1))} disabled={level <= 1}>
            <Icon name="left" size={20} color={level <= 1 ? '#52628a' : '#fff'} />
          </Pressable>
          <Text style={{ color: '#fff', fontWeight: '900', letterSpacing: 1 }}>LEVEL {level}</Text>
          <Pressable style={{ paddingHorizontal: 14, height: 44, justifyContent: 'center' }} onPress={() => onLevel(Math.min(maxLevel, level + 1))} disabled={level >= maxLevel}>
            <Icon name="right" size={20} color={level >= maxLevel ? '#52628a' : '#fff'} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Levels

const COLS = 5;

export function LevelsScreen({ onPlay }: { onPlay: (n: number) => void }) {
  const store = useStore();
  const theme = themeById(store.data.theme);
  const { width } = useWindowDimensions();
  const cell = (width - 32 - (COLS - 1) * 10) / COLS;
  const rowH = cell + 10;
  const rows = useMemo(() => {
    const out: number[][] = [];
    for (let i = 1; i <= store.levelCount; i += COLS) out.push(Array.from({ length: Math.min(COLS, store.levelCount - i + 1) }, (_, k) => i + k));
    return out;
  }, [store.levelCount]);
  const startRow = Math.max(0, Math.floor((store.unlocked - 1) / COLS) - 1);

  return (
    <View style={{ flex: 1, paddingHorizontal: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 }}>
        <Text style={{ color: '#fff', fontSize: 28, fontWeight: '900' }}>Levels</Text>
        <CoinPill coins={store.data.coins} theme={theme} />
      </View>
      <FlatList
        data={rows}
        keyExtractor={(r) => String(r[0])}
        getItemLayout={(_, i) => ({ length: rowH, offset: rowH * i, index: i })}
        initialScrollIndex={startRow}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={{ flexDirection: 'row', gap: 10, height: rowH }}>
            {item.map((n) => {
              const locked = n > store.unlocked;
              const stars = store.data.stars[String(n)] ?? 0;
              const current = n === store.unlocked;
              return (
                <Pressable
                  key={n}
                  disabled={locked}
                  onPress={() => {
                    hapticLight();
                    onPlay(n);
                  }}
                  style={({ pressed }) => ({
                    width: cell,
                    height: cell,
                    borderRadius: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: locked ? 'rgba(255,255,255,0.07)' : current ? GOLD : theme.panel,
                    borderWidth: 2,
                    borderColor: current ? '#fff3c4' : locked ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.25)',
                    transform: [{ scale: pressed ? 0.94 : 1 }],
                  })}
                >
                  {locked ? (
                    <Icon name="lock" size={cell * 0.34} color="#6f80a8" />
                  ) : (
                    <>
                      <Text style={{ color: current ? '#5a2e05' : '#fff', fontWeight: '900', fontSize: cell * 0.32 }}>{n}</Text>
                      <Stars count={stars} total={3} size={cell * 0.2} dim={current ? 0.35 : 0.22} />
                    </>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Themes

function ThemePreview({ theme, width, height }: { theme: Theme; width: number; height: number }) {
  const nodes = useMemo(() => backgroundScene(theme, 200, 300), [theme]);
  return (
    <Svg width={width} height={height} viewBox="0 0 200 300" preserveAspectRatio="xMidYMid slice">
      {nodes.map((n, i) => renderNode(n, i))}
    </Svg>
  );
}

export function ThemesScreen() {
  const store = useStore();
  const theme = themeById(store.data.theme);
  return (
    <View style={{ flex: 1, paddingHorizontal: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 }}>
        <Text style={{ color: '#fff', fontSize: 28, fontWeight: '900' }}>Themes</Text>
        <CoinPill coins={store.data.coins} theme={theme} />
      </View>
      <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
        {THEMES.map((t) => {
          const owned = store.data.owned.includes(t.id);
          const selected = store.data.theme === t.id;
          const canBuy = store.data.coins >= t.price;
          return (
            <View
              key={t.id}
              style={{
                flexDirection: 'row',
                gap: 14,
                padding: 10,
                borderRadius: 22,
                backgroundColor: theme.panel,
                borderWidth: 2.5,
                borderColor: selected ? theme.accent : 'rgba(255,255,255,0.15)',
                alignItems: 'center',
              }}
            >
              <View style={{ width: 84, height: 126, borderRadius: 14, overflow: 'hidden' }}>
                <ThemePreview theme={t} width={84} height={126} />
              </View>
              <View style={{ flex: 1, gap: 8 }}>
                <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>{t.name}</Text>
                {selected ? (
                  <Text style={{ color: theme.accent, fontWeight: '900' }}>IN USE</Text>
                ) : owned ? (
                  <GameButton
                    label="USE"
                    width={120}
                    height={42}
                    fontSize={16}
                    colors={['#5cc8ff', '#2a8cff']}
                    edge="#1560c4"
                    textColor="#04204d"
                    onPress={() => store.setTheme(t.id)}
                  />
                ) : (
                  <GameButton
                    label={`${t.price}`}
                    icon="lock"
                    width={130}
                    height={42}
                    fontSize={17}
                    disabled={!canBuy}
                    onPress={() => {
                      if (store.buyTheme(t.id)) hapticLight();
                    }}
                  />
                )}
                {!owned && !canBuy ? <Text style={{ color: '#9fb0d0', fontSize: 12 }}>Earn coins by clearing levels</Text> : null}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// More / settings

export function MoreScreen() {
  const store = useStore();
  const theme = themeById(store.data.theme);
  const done = Object.keys(store.data.stars).length;
  const totalStars = Object.values(store.data.stars).reduce((a, b) => a + b, 0);
  const rowStyle = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    padding: 16,
    borderRadius: 18,
    backgroundColor: theme.panel,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
  };
  return (
    <View style={{ flex: 1, paddingHorizontal: 16 }}>
      <View style={{ paddingVertical: 10 }}>
        <Text style={{ color: '#fff', fontSize: 28, fontWeight: '900' }}>More</Text>
      </View>
      <View style={{ gap: 12 }}>
        <View style={rowStyle}>
          <View>
            <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800' }}>Your progress</Text>
            <Text style={{ color: '#9fb0d0', marginTop: 2 }}>{done} levels cleared</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="star" size={26} color={GOLD} />
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>{totalStars}</Text>
          </View>
        </View>
        <View style={rowStyle}>
          <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800' }}>Vibration</Text>
          <Switch value={store.data.haptics} onValueChange={store.setHaptics} trackColor={{ true: theme.accent, false: '#3a4a70' }} thumbColor="#fff" />
        </View>
        <Pressable
          style={rowStyle}
          onPress={() =>
            Alert.alert('Reset progress?', 'All levels, coins and themes will be erased.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Reset', style: 'destructive', onPress: store.resetAll },
            ])
          }
        >
          <Text style={{ color: '#ff8a96', fontSize: 17, fontWeight: '800' }}>Reset progress</Text>
          <Icon name="restart" size={22} color="#ff8a96" />
        </Pressable>
        <Text style={{ color: '#7c8db5', textAlign: 'center', marginTop: 12 }}>No ads. No purchases. Just water.</Text>
      </View>
    </View>
  );
}

