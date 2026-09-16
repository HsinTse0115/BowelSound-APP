import React, { PropsWithChildren } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';

export function usePalette() {
  const { settings } = useApp();
  return settings.themeMode === 'dark'
    ? { bg: '#101820', card: '#192633', text: '#EEF4FA', muted: '#B3C1CF', line: '#3D5062', tint: '#8CBDFF', soft: '#233B52' }
    : { bg: '#F5F8FC', card: '#FFFFFF', text: '#192D42', muted: '#53677B', line: '#D7E1EC', tint: '#1264C4', soft: '#EAF3FF' };
}
export function Copy({ children, muted = false, title = false }: PropsWithChildren<{ muted?: boolean; title?: boolean }>) {
  const p = usePalette();
  return <Text style={{ color: muted ? p.muted : p.text, fontSize: title ? 21 : 16, fontWeight: title ? '700' : '400', lineHeight: title ? 30 : 25 }}>{children}</Text>;
}
export function Card({ children }: PropsWithChildren) {
  const p = usePalette();
  return <View style={[ui.card, { backgroundColor: p.card, borderColor: p.line }]}>{children}</View>;
}
export function Button({ label, onPress, secondary = false, disabled = false, danger = false }: { label: string; onPress: () => void; secondary?: boolean; disabled?: boolean; danger?: boolean }) {
  const p = usePalette();
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [ui.button, { backgroundColor: secondary ? p.soft : danger ? '#B63740' : '#1264C4', opacity: disabled ? 0.45 : pressed ? 0.75 : 1 }]}>
    <Text style={{ color: secondary ? p.tint : '#FFFFFF', fontSize: 16, fontWeight: '700', textAlign: 'center' }}>{label}</Text>
  </Pressable>;
}
export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const p = usePalette();
  return <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected }}
    style={[ui.chip, { backgroundColor: selected ? '#1264C4' : p.card, borderColor: selected ? '#1264C4' : p.line }]}>
    <Text style={{ color: selected ? '#FFFFFF' : p.text, fontSize: 15 }}>{selected ? '✓ ' : ''}{label}</Text>
  </Pressable>;
}
export function Field(props: TextInputProps) {
  const p = usePalette();
  return <TextInput {...props} placeholderTextColor={p.muted} style={[ui.input, { color: p.text, backgroundColor: p.card, borderColor: p.line }, props.style]} />;
}
export function DemoNotice() {
  const p = usePalette();
  return <View style={[ui.notice, { backgroundColor: p.soft }]}><Text style={{ color: p.tint, fontSize: 14, lineHeight: 22 }}>
    展示模式 · 未使用真實感測器或麥克風。波形與分析為模擬資料，不代表你的健康狀況。
  </Text></View>;
}
export function Screen({ children, title, back = true, onBack }: PropsWithChildren<{ title: string; back?: boolean; onBack?: () => void }>) {
  const p = usePalette();
  const router = useRouter();
  const { ready, storageError } = useApp();
  return <SafeAreaView style={{ flex: 1, backgroundColor: p.bg }} edges={['top', 'left', 'right', ...(back ? ['bottom'] as const : [])]}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={ui.page}>
      <View style={ui.header}>
        {back && <Pressable accessibilityRole="button" accessibilityLabel="返回上一頁" onPress={onBack || (() => router.canGoBack() ? router.back() : router.replace('/'))} style={ui.back}>
          <Ionicons name="chevron-back" size={25} color={p.text} />
        </Pressable>}
        <Text accessibilityRole="header" style={{ color: p.text, fontSize: 26, fontWeight: '800', flex: 1 }}>{title}</Text>
      </View>
      {storageError && <Card><Copy>{storageError}</Copy></Card>}
      {!ready ? (!storageError && <ActivityIndicator accessibilityLabel="正在載入資料" color={p.tint} />) : children}
    </ScrollView>
  </SafeAreaView>;
}
export function Confirm({ visible, title, message, confirmLabel, onConfirm, onCancel }: { visible: boolean; title: string; message: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void }) {
  const p = usePalette();
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
    <View style={ui.overlay}><View accessibilityViewIsModal style={[ui.dialog, { backgroundColor: p.card }]}>
      <Copy title>{title}</Copy><Copy>{message}</Copy>
      <Button label="先保留" secondary onPress={onCancel} /><Button label={confirmLabel} danger onPress={onConfirm} />
    </View></View>
  </Modal>;
}
export const symptomOptions = ['無症狀', '脹氣', '腹痛', '便秘', '腹瀉'];
export const mealOptions = ['未填寫', '空腹', '飯後1小時內', '飯後1-2小時', '飯後2小時以上'];
export function toggleSymptom(values: string[], value: string) {
  if (value === '無症狀') return values.includes(value) ? [] : [value];
  return values.includes(value) ? values.filter(item => item !== value) : [...values.filter(item => item !== '無症狀'), value];
}
export const formatDate = (value: string) => new Date(value).toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
export const ui = StyleSheet.create({
  page: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: 20, paddingBottom: 40, gap: 18 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  back: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  card: { padding: 20, borderRadius: 20, borderWidth: 1, gap: 14 },
  button: { minHeight: 50, borderRadius: 13, padding: 14, alignItems: 'center', justifyContent: 'center' },
  chip: { minHeight: 46, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderRadius: 12, justifyContent: 'center' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  input: { minHeight: 50, borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 16 },
  notice: { padding: 14, borderRadius: 13 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', padding: 24, justifyContent: 'center', alignItems: 'center' },
  dialog: { width: '100%', maxWidth: 480, padding: 24, gap: 18, borderRadius: 20 },
});
