import React, { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg from 'react-native-svg';
import { backgroundScene } from '../art/backgroundScene';
import { renderNode } from '../art/svgRender';
import type { Theme } from '../game/themes';

export const Backdrop = memo(function Backdrop({ theme, width, height }: { theme: Theme; width: number; height: number }) {
  const nodes = useMemo(() => backgroundScene(theme, width, height), [theme, width, height]);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={width} height={height}>
        {nodes.map((n, i) => renderNode(n, i))}
      </Svg>
    </View>
  );
});
