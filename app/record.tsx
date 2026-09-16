import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { usePreventRemove } from '@react-navigation/native';
import { useApp } from '@/context/AppContext';
import { Screen, Card, Copy, Button, Chip, DemoNotice, Confirm, ui, usePalette, mealOptions, symptomOptions, toggleSymptom } from '@/components/consumer-ui';
import { WaveformVisualizer } from '@/components/WaveformVisualizer';

export default function RecordScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { patientId } = useLocalSearchParams<{ patientId?: string }>();
  const { patients, settings, ready, updateSettings, addRecord } = useApp();
  const p = usePalette();
  const [selected, setSelected] = useState(patientId || settings.primaryPatientId || '');
  const [duration, setDuration] = useState(settings.defaultDuration);
  const [meal, setMeal] = useState('未填寫');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [caffeine, setCaffeine] = useState(false);
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [confirm, setConfirm] = useState(false);
  const [cancelled, setCancelled] = useState('');
  const [completedId, setCompletedId] = useState('');
  const started = useRef(0);
  const active = useRef(false);
  const exitAction = useRef<Parameters<typeof navigation.dispatch>[0] | null>(null);
  const [leaving, setLeaving] = useState(false);
  const selectedPerson = patients.find(person => person.id === selected);

  useEffect(() => {
    if (ready) { setSelected(patientId || settings.primaryPatientId || ''); setDuration(settings.defaultDuration); }
  }, [ready, patientId, settings.primaryPatientId, settings.defaultDuration]);
  usePreventRemove(running, ({ data }) => { exitAction.current = data.action; setConfirm(true); });
  useEffect(() => {
    if (leaving && !running) {
      const action = exitAction.current;
      exitAction.current = null;
      setLeaving(false);
      if (action) navigation.dispatch(action);
    }
  }, [leaving, running, navigation]);
  const stop = useCallback(() => {
    if (!active.current) return;
    active.current = false;
    setRunning(false);
    const elapsed = Math.max(1, Math.floor((Date.now() - started.current) / 1000));
    const finalDuration = duration > 0 ? Math.min(duration, elapsed) : elapsed;
    setSeconds(finalDuration);
    const record = addRecord(selected, finalDuration, caffeine, symptoms, meal, 35);
    setCompletedId(record.id);
    setConfirm(false);
    exitAction.current = null;
  }, [addRecord, selected, caffeine, symptoms, meal, duration]);
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - started.current) / 1000);
      setSeconds(duration > 0 ? Math.min(duration, elapsed) : elapsed);
      if (duration > 0 && elapsed >= duration) stop();
    }, 200);
    return () => clearInterval(timer);
  }, [running, duration, stop]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state !== 'active' && active.current) {
        active.current = false; setRunning(false); setConfirm(false);
        exitAction.current = null; setCancelled('APP 已離開前景，本次展示已取消，未新增紀錄。');
      }
    });
    return () => subscription.remove();
  }, []);
  const cancel = () => {
    active.current = false; setRunning(false); setConfirm(false); setSeconds(0);
    setCancelled('本次量測已取消，未新增紀錄。');
    if (exitAction.current) setLeaving(true);
  };
  const clock = (value: number) => String(Math.floor(value / 60)).padStart(2, '0') + ':' + String(value % 60).padStart(2, '0');
  return <Screen title="開始量測">
    <DemoNotice />
    {!!cancelled && <Copy>{cancelled}</Copy>}
    {completedId ? <Card>
      <Copy title>展示量測已完成</Copy><Copy>已新增 {selectedPerson?.name} 的 {seconds} 秒模擬紀錄。沒有錄製音訊或執行真實 AI 分析。</Copy>
      <Button label="查看這次紀錄" onPress={() => router.replace({ pathname: '/analytics', params: { recordId: completedId } })} />
      <Button label="返回首頁" secondary onPress={() => router.replace('/')} />
    </Card> : running ? <Card>
      <Copy title>{selectedPerson?.name} · 展示進行中</Copy>
      <Copy muted>動畫僅為示意，並未接收感測器訊號。</Copy>
      <WaveformVisualizer isRecording />
      <Text style={{ color: p.text, fontSize: 48, fontWeight: '700', textAlign: 'center' }}>{clock(seconds)}</Text>
      <Copy>{duration ? '剩餘 ' + clock(Math.max(0, duration - seconds)) + '，完成後自動儲存展示紀錄。' : '不限時，按「結束並儲存」完成。'}</Copy>
      {duration > 0 && <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: duration, now: seconds }} style={{ backgroundColor: p.line, height: 10, borderRadius: 5, overflow: 'hidden' }}>
        <View style={{ width: Math.min(100, seconds / duration * 100) + '%' as `${number}%`, height: 10, backgroundColor: p.tint }} />
      </View>}
      <Button label="結束並儲存" onPress={stop} />
      <Button label="取消本次量測" secondary onPress={() => setConfirm(true)} />
    </Card> : <>
      <Card>
        <Copy title>這次為誰量測？</Copy>
        <View style={ui.row}>{patients.map(person => <Chip key={person.id} label={person.name + (person.id === settings.primaryPatientId ? '（本人）' : '')} selected={selected === person.id} onPress={() => setSelected(person.id)} />)}</View>
        {!selectedPerson && <Copy>請選擇對象，或新增個人資料後繼續。</Copy>}
        <Button label="新增資料並繼續" secondary onPress={() => router.push({ pathname: '/patients', params: { create: '1', next: 'record' } })} />
      </Card>
      <Card><Copy title>準備好了嗎？</Copy>
        <Copy>展示裝置：{settings.hardwareConnected ? '已啟用（模擬連線）' : '尚未啟用'}</Copy>
        <Copy muted>展示模式不會讀取麥克風，也不會實測環境音量。</Copy>
        {!settings.hardwareConnected && <Button label="啟用展示裝置" secondary onPress={() => updateSettings({ hardwareConnected: true })} />}
        <Button label="查看操作教學" secondary onPress={() => router.push('/guide')} />
        <Copy>這次展示時長</Copy><View style={ui.row}>{[10, 30, 60, 0].map(value => <Chip key={value} label={value ? value + ' 秒' : '不限時'} selected={duration === value} onPress={() => setDuration(value)} />)}</View>
      </Card>
      <Card>
        <Copy title>記錄當下狀態</Copy><Copy muted>症狀與飯後時間可留空，會標記為「未填寫」。</Copy>
        <Copy>飯後時間</Copy><View style={ui.row}>{mealOptions.map(value => <Chip key={value} label={value} selected={meal === value} onPress={() => setMeal(value)} />)}</View>
        <Copy>這次量測前喝過咖啡或茶嗎？</Copy><View style={ui.row}><Chip label="沒有" selected={!caffeine} onPress={() => setCaffeine(false)} /><Chip label="有" selected={caffeine} onPress={() => setCaffeine(true)} /></View>
        <Copy>目前症狀（可複選）</Copy><View style={ui.row}>{symptomOptions.map(value => <Chip key={value} label={value} selected={symptoms.includes(value)} onPress={() => setSymptoms(toggleSymptom(symptoms, value))} />)}</View>
      </Card>
      <Button label="開始展示量測" disabled={!selectedPerson || !settings.hardwareConnected} onPress={() => {
        if (active.current) return;
        active.current = true; started.current = Date.now(); setSeconds(0); setCancelled(''); setRunning(true);
      }} />
      {(!selectedPerson || !settings.hardwareConnected) && <Copy muted>請先選擇量測對象並啟用展示裝置。</Copy>}
    </>}
    <Confirm visible={confirm} title="取消這次量測？" message="本次進度不會儲存。選擇「先保留」可繼續量測；達到設定時長仍會自動完成。" confirmLabel="取消並捨棄" onConfirm={cancel} onCancel={() => { exitAction.current = null; setConfirm(false); }} />
  </Screen>;
}
