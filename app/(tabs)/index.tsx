import React from 'react';
import { BowelReminder } from '@/components/BowelReminder';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { useWellness } from '@/context/WellnessContext';
import { dateKey } from '@/services/wellness';
import { Screen, Card, Copy, Button, DemoNotice, formatDate, usePalette } from '@/components/consumer-ui';
import { SectionLabel, Shortcut, useToday, WellnessGate, wellnessStyles as s } from '@/components/wellness-ui';

export default function HomeScreen() {
  const router = useRouter();
  const p = usePalette();
  const { patients, records, settings } = useApp();
  const { entries } = useWellness();
  const today = useToday();
  const person = patients.find(person => person.id === settings.primaryPatientId);
  const entry = entries.find(e => e.patientId === person?.id && e.date === today);
  const mine = records.filter(r => r.patientId === person?.id);
  const latest = [...mine].sort((a,b) => b.createdAt.localeCompare(a.createdAt))[0];
  const loggedDays = new Set(entries.filter(e => e.patientId === person?.id && (e.bowel !== '未填寫' || e.feeling !== '未填寫' || !!e.note || e.habits.length > 0)).map(e => e.date));
  mine.forEach(record => loggedDays.add(dateKey(new Date(record.createdAt))));
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(today + 'T12:00:00'); d.setDate(d.getDate() - 6 + i); return dateKey(d); });
  const daily = () => person ? router.push({ pathname: '/daily', params: { patientId: person.id, date: today } }) : router.push({ pathname: '/patients', params: { create: '1' } });
  return <Screen title="腸聽你說（LOGO 預留）" back={false}>
    <BowelReminder />
    <WellnessGate>
      <View style={[s.hero, { backgroundColor: p.soft }]}>
        <Copy title>今天的紀錄</Copy>
        <View style={{ gap: 12 }}>
          {[
            { label: '身體狀況', value: entry?.feeling || '未填寫' },
            { label: '排便', value: entry?.bowel === '今天沒有' ? '沒有排便' : entry?.bowel || '未填寫' },
          ].map(item => <View key={item.label} style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', columnGap: 16, rowGap: 4 }}>
            <Copy muted>{item.label}</Copy>
            <Text style={{ color: item.value === '未填寫' ? p.muted : p.text, fontSize: 17, lineHeight: 26, fontWeight: '600', flexShrink: 1 }}>{item.value}</Text>
          </View>)}
        </View>
        <Button label={entry ? '編輯今天的紀錄' : '新增今天的紀錄'} onPress={daily} />
      </View>
      <View style={s.shortcuts}>
        <Shortcut title="量測腸音" subtitle="試用模擬量測" icon="pulse-outline" onPress={() => router.push('/record')} />
        <Shortcut title="記錄排便" subtitle="填寫排便次數和身體狀況" icon="create-outline" onPress={daily} />
      </View>
      {!person && <Card><Copy title>設定個人資料</Copy><Copy muted>設定本人後，首頁只會顯示你的紀錄。</Copy><Button label="設定本人或新增資料" secondary onPress={() => router.push('/patients')} /></Card>}
      <SectionLabel title="最近 7 天的紀錄" />
      <Card><View style={s.week}>{days.map(day => <View key={day} style={{ alignItems: 'center', gap: 9, flex: 1 }}>
        <Text style={{ color: p.muted, fontSize: 13 }}>{['日','一','二','三','四','五','六'][new Date(day + 'T12:00:00').getDay()]}</Text>
        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: loggedDays.has(day) ? p.tint : p.soft, alignItems: 'center', justifyContent: 'center', borderWidth: day === today ? 1 : 0, borderColor: p.tint }}><Text style={{ color: loggedDays.has(day) ? p.bg : p.text, fontSize: 14 }}>{loggedDays.has(day) ? '✓' : Number(day.slice(-2))}</Text></View>
      </View>)}</View><Copy muted>近 7 天有 {days.filter(day => loggedDays.has(day)).length} 天有紀錄。點選日曆可查看或補填。</Copy><Button label="查看日曆" secondary onPress={() => router.push('/(tabs)/calendar')} /></Card>
      {latest && <Card><Copy title>最近一次腸音紀錄</Copy><Copy muted>{formatDate(latest.createdAt)} · {latest.duration} 秒 · 模擬數據</Copy><Button label="查看量測紀錄" secondary onPress={() => router.push({ pathname: '/analytics', params: { recordId: latest.id } })} /></Card>}
    </WellnessGate>
    {!settings.onboardingCompleted && <Button label="第一次使用？看看操作教學" secondary onPress={() => router.push('/guide')} />}
    <DemoNotice />
  </Screen>;
}
