import { useState } from 'react';
import { Animated } from 'react-native';

// Creates one Animated.Value for the lifetime of the component.
export function useAnimatedValue(initial: number): Animated.Value {
  const [value] = useState(() => new Animated.Value(initial));
  return value;
}
