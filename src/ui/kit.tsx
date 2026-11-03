import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { Animated, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useAnimatedValue } from './useAnimatedValue';
import { Coin, Icon, IconName } from '../art/Icons';
import type { Theme } from '../game/themes';

export const GOLD = '#ffc43a';

/** Chunky yellow call-to-action button. */
export function GameButton({
  label,
  onPress,
  width = 220,
  height = 62,
  colors = ['#ffd84a', '#ffb21e'],
  edge = '#d98a0c',
  textColor = '#5a2e05',
  fontSize = 26,
  disabled,
  icon,
}: {
  label: string;
  onPress: () => void;
  width?: number;
  height?: number;
  colors?: [string, string];
  edge?: string;
  textColor?: string;
  fontSize?: number;
  disabled?: boolean;
  icon?: IconName;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        { width, height: height + 6, opacity: disabled ? 0.5 : 1, transform: [{ translateY: pressed ? 3 : 0 }] },
      ]}
    >
      <View style={{ position: 'absolute', left: 0, right: 0, top: 6, height, borderRadius: height / 2, backgroundColor: edge }} />
      <LinearGradient
        colors={colors}
        style={{ height, borderRadius: height / 2, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}
      >
        {icon && <Icon name={icon} size={fontSize} color={textColor} />}
        <Text style={{ color: textColor, fontSize, fontWeight: '900', letterSpacing: 1 }}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

/** Round icon button used in the game's bottom bar and headers. */
export function RoundButton({
  icon,
  onPress,
  size = 56,
  disabled,
  badge,
  label,
  a11yLabel,
  theme,
  active,
}: {
  icon: IconName;
  onPress: () => void;
  size?: number;
  disabled?: boolean;
  badge?: string;
  label?: string;
  a11yLabel?: string;
  theme: Theme;
  active?: boolean;
}) {
  return (
    <View style={{ alignItems: 'center', opacity: disabled ? 0.4 : 1 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={a11yLabel ?? label ?? icon}
        accessibilityState={{ disabled: !!disabled, selected: !!active }}
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => ({
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: active ? theme.accent : theme.panel,
          borderWidth: 2,
          borderColor: 'rgba(255,255,255,0.28)',
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale: pressed ? 0.92 : 1 }],
        })}
      >
        <Icon name={icon} size={size * 0.46} color={active ? '#06142f' : '#ffffff'} />
        {badge ? (
          <View style={styles.badge}>
            <Coin size={13} />
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </Pressable>
      {label ? <Text style={styles.btnLabel}>{label}</Text> : null}
    </View>
  );
}

export function CoinPill({ coins, theme }: { coins: number; theme: Theme }) {
  return (
    <View style={[styles.pill, { backgroundColor: theme.panel }]}>
      <Coin size={30} />
      <Text style={styles.pillText}>{coins}</Text>
    </View>
  );
}

export function Stars({ count, size = 20, total = 3, dim = 0.28 }: { count: number; size?: number; total?: number; dim?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={{ opacity: i < count ? 1 : dim }}>
          <Icon name="star" size={size} color={i < count ? GOLD : '#9fb0d0'} />
        </View>
      ))}
    </View>
  );
}

/** Dimmed full-screen layer with a centered card. */
export function ModalCard({
  theme,
  title,
  children,
  onClose,
  width = 320,
}: {
  theme: Theme;
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  width?: number;
}) {
  const scale = useAnimatedValue(0.88);
  const fade = useAnimatedValue(0);
  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 7, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 160, useNativeDriver: true }),
    ]).start();
  }, [scale, fade]);
  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.overlay, { opacity: fade }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <Animated.View style={[styles.card, { width, backgroundColor: '#0c1d45', borderColor: theme.accent, transform: [{ scale }] }]}>
        {title ? <Text style={styles.cardTitle}>{title}</Text> : null}
        {children}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    bottom: -8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#07122b',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    gap: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  btnLabel: { color: '#fff', fontSize: 11, fontWeight: '700', marginTop: 10, opacity: 0.85 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 6,
    paddingRight: 16,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  pillText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  overlay: { alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(2,8,24,0.72)', zIndex: 50 },
  card: {
    borderRadius: 26,
    borderWidth: 2,
    padding: 20,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  cardTitle: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: 0.5 },
});

export const row: StyleProp<ViewStyle> = { flexDirection: 'row', alignItems: 'center' };
