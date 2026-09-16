import React from 'react';
import { useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { Screen, Card, Copy, Button, DemoNotice, formatDate } from '@/components/consumer-ui';

export default function HomeScreen() {
  const router = useRouter();
  const { patients, records, settings } = useApp();
  const person = patients.find(p => p.id === settings.primaryPatientId);
  const latest = [...records].filter(r => r.patientId === person?.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  return <Screen title="BowelSound" back={false}>
    <Copy muted>從一次紀錄，開始認識自己的日常。</Copy>
    <DemoNotice />
    {!settings.onboardingCompleted && <Card>
      <Copy title>第一次使用？一起開始</Copy>
      <Copy>了解展示模式、建立本人資料，再試一次量測流程。大約需要 1 分鐘。</Copy>
      <Button label="開始使用教學" onPress={() => router.push('/guide')} />
    </Card>}
    <Card>
      <Copy title>{person ? '你好，' + person.name : '先建立你的個人資料'}</Copy>
      <Copy muted>{person ? '每次量測會預設選擇你，也可以切換家人。' : '已有資料可至「我的」設為本人；新使用者可直接新增。'}</Copy>
      <Copy>展示裝置：{settings.hardwareConnected ? '已就緒（模擬）' : '尚未啟用'}</Copy>
      <Button label={person ? '開始量測' : '建立本人資料'} onPress={() => person ? router.push('/record') : router.push({ pathname: '/patients', params: { create: '1', next: 'record' } })} />
      <Button label="切換本人或管理家人" secondary onPress={() => router.push('/patients')} />
    </Card>
    <Card>
      <Copy title>我的最近一次紀錄</Copy>
      {latest ? <>
        <Copy>{person?.name} · {formatDate(latest.createdAt)}</Copy>
        <Copy muted>展示量測 {latest.duration} 秒 · {latest.symptoms?.join('、') || '症狀未填寫'}</Copy>
        <Button label="查看這次紀錄" secondary onPress={() => router.push({ pathname: '/analytics', params: { recordId: latest.id } })} />
      </> : <Copy muted>{person ? '還沒有你的紀錄，試試上方的開始量測。' : '選定本人後，這裡會顯示你的最近紀錄。'}</Copy>}
      <Button label="查看所有紀錄" secondary onPress={() => router.push('/(tabs)/explore')} />
    </Card>
    {settings.onboardingCompleted && <Button label="再看一次操作教學" secondary onPress={() => router.push('/guide')} />}
  </Screen>;
}
