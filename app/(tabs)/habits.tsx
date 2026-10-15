import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { useWellness } from '@/context/WellnessContext';
import { HABITS } from '@/services/wellness';
import { Screen, Card, Copy, Button, usePalette } from '@/components/consumer-ui';
import { SectionLabel, useToday, WellnessGate } from '@/components/wellness-ui';

export default function HabitsScreen() {
  const router = useRouter();
  const p = usePalette();
  const today = useToday();
  const { patients, settings } = useApp();
  const { entries, busy, save } = useWellness();
  const [message, setMessage] = useState('');
  const person = patients.find(p => p.id === settings.primaryPatientId);
  const completed = entries.find(e => e.patientId === person?.id && e.date === today)?.habits || [];
  const toggle = async (id: string) => {
    if (!person) return;
    setMessage('');
    try { await save(person.id, today, { habits: completed.includes(id) ? completed.filter(value => value !== id) : [...completed, id] }); }
    catch { setMessage('尚未儲存，請稍後再試。'); }
  };
  return <Screen title="生活習慣" back={false}>
    <Copy muted>{today} · {person?.name || '尚未設定本人'}</Copy>
    <SectionLabel title="今天做了哪些事？" />
    <Copy muted>勾選今天完成的項目，方便之後查看。這份清單不代表腸音分析結果，也不是醫療建議。</Copy>
    <WellnessGate>
      {!person ? <Card><Copy>先設定個人資料，就能記錄自己的生活習慣。</Copy><Button label="設定本人" onPress={() => router.push('/patients')} /></Card> : <>
        <Card><Copy title>今天已完成 {completed.length} / {HABITS.length}</Copy><View style={{ height: 8, borderRadius: 4, backgroundColor: p.soft, overflow: 'hidden' }}><View style={{ height: 8, width: (completed.length / HABITS.length * 100) + '%' as `${number}%`, backgroundColor: p.tint }} /></View><Copy muted>點選項目即可勾選，再點一次可取消。</Copy></Card>
        {HABITS.map(habit => <Pressable key={habit.id} accessibilityRole="checkbox" accessibilityLabel={habit.title} aria-checked={completed.includes(habit.id)} accessibilityState={{ checked: completed.includes(habit.id), disabled: busy }} disabled={busy} onPress={() => toggle(habit.id)}
          style={({ pressed }) => ({ backgroundColor: completed.includes(habit.id) ? p.soft : p.card, borderColor: p.line, borderWidth: 1, borderRadius: 24, padding: 22, gap: 14, opacity: busy || pressed ? 0.65 : 1 })}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}><Ionicons name={habit.icon} color={p.tint} size={27} /><Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: p.text }}>{habit.title}</Text><Ionicons name={completed.includes(habit.id) ? 'checkmark-circle' : 'ellipse-outline'} size={27} color={p.tint} /></View><Copy muted>{habit.detail}</Copy>
        </Pressable>)}
        {!!message && <Copy>{message}</Copy>}
        <Button label="查看過去的紀錄" secondary onPress={() => router.push('/(tabs)/calendar')} />
      </>}
    </WellnessGate>
    <Card><Copy title>使用說明</Copy><Copy muted>查看量測方式、紀錄說明與常見問題。</Copy><Button label="查看使用說明" secondary onPress={() => router.push('/education')} /></Card>
  </Screen>;
}
