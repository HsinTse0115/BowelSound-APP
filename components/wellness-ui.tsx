import React, { PropsWithChildren, useEffect, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { useWellness } from '@/context/WellnessContext';
import { dateKey } from '@/services/wellness';
import { Button, Card, Chip, Copy, ui, usePalette } from './consumer-ui';

export function useToday() {
  const [today, setToday] = useState(dateKey());
  useEffect(() => {
    const refresh = () => setToday(dateKey());
    const timer = setInterval(refresh, 30000);
    const subscription = AppState.addEventListener('change', refresh);
    return () => { clearInterval(timer); subscription.remove(); };
  }, []);
  return today;
}
export function WellnessGate({ children }: PropsWithChildren) {
  const { ready, error } = useWellness();
  return <>{!!error && <Card><Copy>{error}</Copy></Card>}{ready ? children : !error && <Copy muted>正在載入日常紀錄…</Copy>}</>;
}
export function PersonPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const { patients } = useApp();
  const router = useRouter();
  return <View style={{ gap: 12 }}><View style={ui.row}>{patients.map(p => <Chip key={p.id} label={p.name} selected={value === p.id} onPress={() => onChange(p.id)} />)}</View>
    {!patients.length && <Button label="建立本人資料" onPress={() => router.push('/patients')} />}
  </View>;
}
export function SectionLabel({ title, detail }: { title: string; detail?: string }) {
  const p = usePalette();
  return <View style={{ gap: 3 }}><Text style={{ color: p.tint, fontSize: 12, letterSpacing: 2, fontWeight: '700' }}>{detail}</Text><Copy title>{title}</Copy></View>;
}
export function Shortcut({ title, subtitle, icon, onPress }: { title: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  const p = usePalette();
  return <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({ pressed }) => [wellnessStyles.shortcut, { backgroundColor: p.card, borderColor: p.line, opacity: pressed ? 0.7 : 1 }]}>
    <View style={[wellnessStyles.icon, { backgroundColor: p.soft }]}><Ionicons name={icon} size={24} color={p.tint} /></View>
    <Text style={{ color: p.text, fontSize: 17, fontWeight: '700' }}>{title}</Text><Text style={{ color: p.muted, fontSize: 13, lineHeight: 20 }}>{subtitle}</Text>
  </Pressable>;
}
export const wellnessStyles = StyleSheet.create({
  shortcuts: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  shortcut: { flexGrow: 1, flexBasis: 140, padding: 18, borderRadius: 24, borderWidth: 1, gap: 10 },
  icon: { width: 48, height: 48, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  hero: { padding: 24, borderRadius: 28, gap: 18, overflow: 'hidden' },
  week: { flexDirection: 'row', justifyContent: 'space-between', gap: 3 },
});
