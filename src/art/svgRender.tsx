import React from 'react';
import {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import type { SvgNode } from './tubeScene';

const MAP: Record<string, React.ComponentType<any>> = {
  G,
  Defs,
  LinearGradient,
  RadialGradient,
  ClipPath,
  Stop,
  Rect,
  Ellipse,
  Circle,
  Path,
};

/** Turns a scene node tree into react-native-svg elements. */
export function renderNode(nd: SvgNode, key?: string | number): React.ReactElement {
  const C = MAP[nd.tag];
  const props: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(nd.props)) {
    if (v === undefined) continue;
    if (k === 'rotate') {
      props.rotation = v;
    } else if (k === 'ox') {
      props.originX = v;
    } else if (k === 'oy') {
      props.originY = v;
    } else {
      props[k] = v;
    }
  }
  return (
    <C key={key} {...props}>
      {nd.children ? nd.children.map((c, i) => renderNode(c, i)) : undefined}
    </C>
  );
}
