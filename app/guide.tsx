import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { Screen, Card, Copy, Button, DemoNotice, usePalette } from '@/components/consumer-ui';
import { Ionicons } from '@expo/vector-icons';

const steps = [
  { icon: 'person-outline' as const, title: '1. 建立本人資料', text: '填寫姓名或暱稱，將自己設為本人。之後開始量測會自動選好你，也能切換家人。' },
  { icon: 'radio-outline' as const, title: '2. 準備裝置與環境', text: '這個版本可直接啟用展示裝置，不需要麥克風權限。使用真實設備時，請依該設備的操作說明確認放置位置與姿勢；目前尚未提供經驗證的放置圖。' },
  { icon: 'timer-outline' as const, title: '3. 記錄狀態並開始', text: '填寫飯後時間與症狀，也可以留空。選好展示時長，開始後會看到進度與剩餘時間；取消本次不會留下紀錄。' },
  { icon: 'document-text-outline' as const, title: '4. 看懂這次紀錄', text: '完成後先看對象、時間與填寫內容。模擬圖表只展示畫面功能，不能用來判斷健康。你可以補充備註、修正內容或刪除紀錄。' },
];
export default function GuideScreen() {
  const [step, setStep] = useState(0);
  const { patients, settings, updateSettings } = useApp();
  const router = useRouter();
  const p = usePalette();
  const item = steps[step];
  const complete = () => {
    updateSettings({ onboardingCompleted: true });
    if (patients.some(person => person.id === settings.primaryPatientId)) router.replace('/record');
    else router.replace({ pathname: '/patients', params: { create: '1', next: 'record' } });
  };
  return <Screen title="第一次使用">
    <DemoNotice />
    <Copy muted>操作教學 · 第 {step + 1} / {steps.length} 步</Copy>
    <View style={{ flexDirection: 'row', gap: 8 }}>{steps.map((_, i) => <View key={i} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: i <= step ? p.tint : p.line }} />)}</View>
    <Card><View style={{ alignItems: 'center', padding: 24, backgroundColor: p.soft, borderRadius: 16 }}><Ionicons name={item.icon} size={72} color={p.tint} /></View>
      <Copy title>{item.title}</Copy><Copy>{item.text}</Copy>
    </Card>
    <Button label={step === steps.length - 1 ? '完成教學，開始體驗' : '下一步'} onPress={() => step === steps.length - 1 ? complete() : setStep(step + 1)} />
    {step > 0 && <Button label="上一步" secondary onPress={() => setStep(step - 1)} />}
  </Screen>;
}
