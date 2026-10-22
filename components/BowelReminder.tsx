import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePathname, useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { useWellness } from '@/context/WellnessContext';
import { bowelReminderEnd } from '@/services/wellness';
import { Button, Copy, ui, usePalette } from './consumer-ui';
import { useToday } from './wellness-ui';

const STORAGE_KEY = '@bowelsound_reminder_seen_v1';
export function BowelReminder() {
  const { patients, settings } = useApp();
  const { entries, ready } = useWellness();
  const today = useToday();
  const router = useRouter();
  const pathname = usePathname();
  const p = usePalette();
  const [seen, setSeen] = useState<Record<string, string> | null>(null);
  const person = patients.find(item => item.id === settings.primaryPatientId);
  const end = person && ready ? bowelReminderEnd(entries, person.id, today) : null;
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      const parsed = raw ? JSON.parse(raw) : {};
      const valid = parsed && !Array.isArray(parsed) && typeof parsed === 'object'
        ? Object.fromEntries(Object.entries(parsed).filter(([, value]) => typeof value === 'string')) as Record<string, string> : {};
      if (active) setSeen(valid);
    }).catch(() => { if (active) setSeen({}); });
    return () => { active = false; };
  }, []);
  const dismiss = () => {
    if (!person) return;
    const next = { ...seen, [person.id]: today };
    setSeen(next);
    // If storage is unavailable, dismissal still lasts for this app session.
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  };
  const visible = !!(person && end && seen && seen[person.id] !== today && (pathname === '/' || pathname === '/(tabs)'));
  // A hidden Modal can still have its children evaluated. Do not build reminder
  // actions until the profile and reminder data are available.
  if (!person || !end || !visible) return null;

  const openRecords = () => {
    dismiss();
    router.push({ pathname: '/(tabs)/calendar', params: { patientId: person.id, date: end } });
  };
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={dismiss}>
    <View style={ui.overlay}><View accessibilityViewIsModal style={[ui.dialog, { backgroundColor: p.card, maxHeight: '90%' }]}>
      <ScrollView contentContainerStyle={{ gap: 18 }}>
        <Copy title>排便狀況提醒</Copy>
        <Copy>{person?.name}，截至 {end}，你已連續 3 天記錄「沒有排便」。排便狀況可能需要留意，建議諮詢醫療人員。</Copy>
        <Copy muted>提醒依你填寫的紀錄產生，不是診斷。若有持續腹痛、嘔吐、血便或無法排氣，請儘速就醫，不必等滿 3 天。</Copy>
        <Button label="查看或修正紀錄" onPress={openRecords} />
        <Button label="知道了，今天不再提醒" secondary onPress={dismiss} />
      </ScrollView>
    </View></View>
  </Modal>;
}
