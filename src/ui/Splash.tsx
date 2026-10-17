import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, View, useWindowDimensions } from 'react-native';
import { Logo } from '../art/Logo';

const SHOW_MS = 1900;

/** Logo intro shown once at launch, before the home screen. Tap to skip. */
export function Splash({ onDone }: { onDone: () => void }) {
  const { width } = useWindowDimensions();
  const intro = useRef(new Animated.Value(0)).current; // logo pop-in
  const bar = useRef(new Animated.Value(0)).current; // loading bar
  const out = useRef(new Animated.Value(1)).current; // whole splash fade-out
  const done = useRef(false);

  const finish = () => {
    if (done.current) return;
    done.current = true;
    Animated.timing(out, { toValue: 0, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(() => onDone());
  };

  useEffect(() => {
    Animated.spring(intro, { toValue: 1, friction: 6, tension: 70, useNativeDriver: true }).start();
    Animated.timing(bar, { toValue: 1, duration: SHOW_MS - 300, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }).start();
    const t = setTimeout(finish, SHOW_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logoW = Math.min(300, width - 60);
  const barW = Math.min(180, width * 0.5);

  return (
    <Pressable style={{ flex: 1 }} onPress={finish}>
      <Animated.View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', opacity: out }}>
        <Animated.View
          style={{
            opacity: intro,
            transform: [
              { scale: intro.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) },
              { translateY: intro.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
            ],
          }}
        >
          <Logo width={logoW} />
        </Animated.View>
        <View style={{ marginTop: 36, width: barW, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.18)', overflow: 'hidden' }}>
          <Animated.View
            style={{
              height: 8,
              borderRadius: 4,
              backgroundColor: '#5cc8ff',
              width: bar.interpolate({ inputRange: [0, 1], outputRange: [0, barW] }),
            }}
          />
        </View>
      </Animated.View>
    </Pressable>
  );
}
