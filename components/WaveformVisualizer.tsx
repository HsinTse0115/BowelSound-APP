import React from 'react';
import { View } from 'react-native';
import { Copy, usePalette } from './consumer-ui';

/** Displays normalized samples supplied by the device or backend. No synthetic signal. */
export function WaveformVisualizer({ samples = [] }: { samples?: readonly number[] }) {
  const p = usePalette();
  if (!samples.length) return <Copy muted>尚未收到波形資料。</Copy>;
  return <View accessibilityRole="image" accessibilityLabel="腸音波形" style={{ height: 140, flexDirection: 'row', gap: 2, alignItems: 'center', overflow: 'hidden' }}>
    {samples.map((value, index) => <View key={index} style={{ flex: 1, height: Math.max(2, Math.min(130, Math.abs(value) * 100)), backgroundColor: p.tint }} />)}
  </View>;
}
