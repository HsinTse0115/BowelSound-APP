import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { useWellness } from '@/context/WellnessContext';
import { calendarDays, dateKey, HABITS, validDay } from '@/services/wellness';
import { Screen, Card, Copy, Button, formatDate, usePalette } from '@/components/consumer-ui';
import { PersonPicker, useToday, WellnessGate } from '@/components/wellness-ui';

export default function CalendarScreen() {
  const { settings } = useApp();
  const params = useLocalSearchParams<{ date?: string; patientId?: string }>();
  const today = useToday();
  const initialDate = params.date && validDay(params.date) && params.date <= today ? params.date : today;
  const initialPerson = params.patientId || settings.primaryPatientId || '';
  return <CalendarView key={initialPerson + initialDate} initialPerson={initialPerson} initialDate={initialDate} />;
}
function CalendarView({ initialPerson, initialDate }: { initialPerson: string; initialDate: string }) {
  const router = useRouter();
  const p = usePalette();
  const today = useToday();
  const { patients, records } = useApp();
  const { entries } = useWellness();
  const [person, setPerson] = useState(initialPerson);
  const [selected, setSelected] = useState(initialDate);
  const [month, setMonth] = useState(new Date(initialDate + 'T12:00:00'));
  const [picker, setPicker] = useState(false);
  const mine = records.filter(record => record.patientId === person);
  const days = calendarDays(month);
  const entriesForPerson = entries.filter(e => e.patientId === person);
  const dayEntry = entriesForPerson.find(e => e.date === selected);
  const measurements = mine.filter(record => dateKey(new Date(record.createdAt)) === selected);
  const measurementDays = new Set(mine.map(record => dateKey(new Date(record.createdAt))));
  const diaryDays = new Set(entriesForPerson.filter(e => e.bowel !== '未填寫' || e.feeling !== '未填寫' || !!e.note).map(e => e.date));
  const habitDays = new Set(entriesForPerson.filter(e => e.habits.length).map(e => e.date));
  const changeMonth = (delta: number) => {
    const next = new Date(month.getFullYear(), month.getMonth() + delta, 1, 12);
    setMonth(next); setSelected(dateKey(next));
  };
  const name = patients.find(p => p.id === person)?.name;
  return <Screen title="紀錄日曆" back={false}>
    <Copy muted>選擇日期，查看當天的排便、腸音和生活習慣紀錄。</Copy>
    <Button label={name ? name + '的紀錄 · 切換對象' : '選擇紀錄對象'} secondary onPress={() => setPicker(!picker)} />
    {picker && <PersonPicker value={person} onChange={id => { setPerson(id); setPicker(false); }} />}
    <WellnessGate>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable accessibilityRole="button" accessibilityLabel="上一個月" onPress={() => changeMonth(-1)} style={{ padding: 12 }}><Ionicons name="chevron-back" size={22} color={p.tint} /></Pressable>
          <Copy title>{month.getFullYear()} 年 {month.getMonth() + 1} 月</Copy>
          <Pressable accessibilityRole="button" accessibilityLabel="下一個月" accessibilityState={{ disabled: dateKey(month).slice(0,7) >= today.slice(0,7) }} disabled={dateKey(month).slice(0,7) >= today.slice(0,7)} onPress={() => changeMonth(1)} style={{ padding: 12, opacity: dateKey(month).slice(0,7) >= today.slice(0,7) ? 0.3 : 1 }}><Ionicons name="chevron-forward" size={22} color={p.tint} /></Pressable>
        </View>
        <View style={{ flexDirection: 'row' }}>{['日','一','二','三','四','五','六'].map(day => <Text key={day} style={{ flex: 1, textAlign: 'center', color: p.muted, fontSize: 13 }}>{day}</Text>)}</View>
        {Array.from({ length: days.length / 7 }, (_, row) => <View key={row} style={{ flexDirection: 'row' }}>{days.slice(row * 7, row * 7 + 7).map((day, column) => day ? <Pressable key={day} accessibilityRole="button" accessibilityLabel={day + (diaryDays.has(day) ? ' 有每日紀錄' : '') + (measurementDays.has(day) ? ' 有量測' : '') + (habitDays.has(day) ? ' 有習慣紀錄' : '')} accessibilityState={{ selected: selected === day, disabled: day > today }} disabled={day > today} onPress={() => setSelected(day)} style={{ flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 14, gap: 4, backgroundColor: selected === day ? p.tint : 'transparent', opacity: day > today ? 0.3 : 1 }}>
          <Text style={{ color: selected === day ? p.card : p.text, fontSize: 16, fontWeight: day === today ? '800' : '400' }}>{Number(day.slice(-2))}</Text>
          <View style={{ flexDirection: 'row', gap: 3, height: 5 }}>{[[diaryDays.has(day), '#555555'], [measurementDays.has(day), '#999999'], [habitDays.has(day), '#BBBBBB']].map(([visible, color], index) => visible ? <View key={index} style={{ height: 5, width: 5, borderRadius: 3, backgroundColor: color as string }} /> : null)}</View>
        </Pressable> : <View key={'empty' + column} style={{ flex: 1 }} />)}</View>)}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>{[{ label: '每日紀錄', color: '#555555' }, { label: '量測', color: '#999999' }, { label: '習慣', color: '#BBBBBB' }].map(item => <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: item.color }} /><Text style={{ color: p.muted, fontSize: 14 }}>{item.label}</Text></View>)}</View>
        <Button label="回到今天" secondary onPress={() => { setSelected(today); setMonth(new Date(today + 'T12:00:00')); }} />
      </Card>
      <Copy title>{selected} 的紀錄</Copy>
      {!person ? <Card><Copy>選擇對象後，即可查看該人的紀錄。</Copy><Button label="選擇對象" secondary onPress={() => setPicker(true)} /></Card> : <>
        <Card><Copy title>排便與身體狀況</Copy><Copy>排便：{dayEntry?.bowel || '未填寫'} · 身體狀況：{dayEntry?.feeling || '未填寫'}</Copy>
          {!!dayEntry?.note && <Copy>{dayEntry.note}</Copy>}
          <Copy muted>習慣：{dayEntry?.habits.length ? HABITS.filter(h => dayEntry.habits.includes(h.id)).map(h => h.title).join('、') : '尚未勾選'}</Copy>
          <Button label={dayEntry ? '編輯當天紀錄' : '新增當天紀錄'} secondary onPress={() => router.push({ pathname: '/daily', params: { date: selected, patientId: person } })} />
        </Card>
        <Copy title>腸音紀錄</Copy>
        {!measurements.length && <Copy muted>這天沒有腸音紀錄。</Copy>}
        {measurements.map(record => <Card key={record.id}><Copy>{formatDate(record.createdAt)} · {record.duration} 秒</Copy><Copy muted>模擬量測 · 示範資料</Copy><Button label="查看這次量測" secondary onPress={() => router.push({ pathname: '/analytics', params: { recordId: record.id } })} /></Card>)}
      </>}
    </WellnessGate>
    <Button label="查看所有量測紀錄" secondary onPress={() => router.push('/(tabs)/explore')} />
  </Screen>;
}
