import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, View } from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { usePreventRemove } from 'expo-router/build/react-navigation/native';
import { useApp } from '@/context/AppContext';
import { Screen, Card, Copy, Button, Chip, Confirm, ui, usePalette, mealOptions, symptomOptions, toggleSymptom } from '@/components/consumer-ui';
import { MeasurementSession, MeasurementState } from '@/services/measurement';
import { getMeasurementAdapter } from '@/services/measurement-adapter';

export default function RecordScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { patientId } = useLocalSearchParams<{ patientId?: string }>();
  const { patients, settings, addRecord } = useApp();
  const p = usePalette();
  const [selection, setSelection] = useState<string>();
  const selected = selection ?? patientId ?? settings.primaryPatientId ?? '';
  const [meal, setMeal] = useState('未填寫');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [caffeine, setCaffeine] = useState<boolean>();
  const [state, setState] = useState<MeasurementState>({ phase: 'idle', message: '' });
  const [confirm, setConfirm] = useState(false);
  const [leave, setLeave] = useState(false);
  const session = useRef<MeasurementSession | null>(null);
  const mounted = useRef(true);
  const action = useRef<Parameters<typeof navigation.dispatch>[0] | null>(null);
  const busy = ['recording', 'uploading', 'analyzing'].includes(state.phase);
  const adapter = getMeasurementAdapter(settings.apiUrl);
  const person = patients.find(item => item.id === selected);
  usePreventRemove(busy, ({ data }) => { action.current = data.action; setConfirm(true); });
  useEffect(() => {
    mounted.current = true;
    const subscription = AppState.addEventListener('change', next => {
      if (next !== 'active') session.current?.cancel();
    });
    return () => { mounted.current = false; session.current?.cancel(); subscription.remove(); };
  }, []);
  useEffect(() => {
    if (leave && !busy && action.current) {
      const next = action.current; action.current = null;
      navigation.dispatch(next);
    }
  }, [leave, busy, navigation]);
  useEffect(() => {
    if (state.phase === 'completed' && state.result) router.replace({ pathname: '/analytics', params: { recordId: state.result.id } });
  }, [state, router]);
  const start = () => {
    if (!person || !adapter.available || busy) return;
    const input = { patientId: person.id, hasCaffeine: caffeine, symptoms, mealTime: meal };
    // Identity only: no random clinical data is generated.
    const requestId = 'measurement-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
    const nextSession = new MeasurementSession(adapter, input, requestId, next => {
      if (!mounted.current || session.current !== nextSession) return;
      if (next.phase === 'completed' && next.result) addRecord(next.result, input);
      setState(next);
    });
    session.current = nextSession;
    void nextSession.run();
  };
  const reset = () => { session.current?.cancel(); session.current = null; setState({ phase: 'idle', message: '' }); };
  return <Screen title="開始量測">
    {state.phase !== 'idle' ? <Card>
      <Copy title>{{ recording: '收音中', uploading: '上傳中', analyzing: '分析中', completed: '分析完成', insufficient_audio: '收音品質不足', analysis_failed: '分析失敗', failed: '處理未完成', cancelled: '已停止' }[state.phase]}</Copy>
      <Copy>{state.message}</Copy>
      {busy && <ActivityIndicator color={p.tint} accessibilityLabel={state.message} />}
      {state.phase === 'recording' && <Copy>{Math.floor(state.seconds || 0)} / 20 秒</Copy>}
      {state.phase === 'failed' && <><Button label="重試" onPress={() => { void session.current?.run(); }} /><Copy muted>會沿用本次音訊或查詢原分析工作。離開此頁後無法保留重試進度。</Copy></>}
      {busy ? <Button label="停止本次操作" secondary onPress={() => setConfirm(true)} />
        : state.phase !== 'completed' && <Button label="重新量測" secondary onPress={reset} />}
    </Card> : <>
      <Card><Copy title>量測對象</Copy>
        <View style={ui.row}>{patients.map(item => <Chip key={item.id} label={item.name} selected={selected === item.id} onPress={() => setSelection(item.id)} />)}</View>
        {!person && <Copy>請先新增或選擇量測對象。</Copy>}
        <Button label="新增本人或家人" secondary onPress={() => router.push({ pathname: '/patients', params: { create: '1', next: 'record' } })} />
      </Card>
      <Card><Copy title>裝置與服務</Copy><Copy>{adapter.available ? '可開始量測' : '尚未完成串接'}</Copy>
        <Copy muted>{adapter.available ? '每次收音最長 20 秒，完成後上傳分析。' : '目前尚未接收硬體音訊，無法開始量測。串接完成後才會顯示波形與結果。'}</Copy>
        <Button label="連線設定" secondary onPress={() => router.push('/settings')} />
      </Card>
      <Card><Copy title>記錄當下狀態</Copy>
        <Copy>飯後時間</Copy><View style={ui.row}>{mealOptions.map(value => <Chip key={value} label={value} selected={meal === value} onPress={() => setMeal(value)} />)}</View>
        <Copy>量測前喝過咖啡或茶？</Copy><View style={ui.row}>{[{ label: '未填寫', value: undefined }, { label: '沒有', value: false }, { label: '有', value: true }].map(item => <Chip key={item.label} label={item.label} selected={caffeine === item.value} onPress={() => setCaffeine(item.value)} />)}</View>
        <Copy>症狀（可留空）</Copy><View style={ui.row}>{symptomOptions.map(value => <Chip key={value} label={value} selected={symptoms.includes(value)} onPress={() => setSymptoms(toggleSymptom(symptoms, value))} />)}</View>
      </Card>
      <Button label="開始量測" disabled={!person || !adapter.available} onPress={start} />
    </>}
    <Confirm visible={confirm} title="停止本次操作？" message="會停止收音或等待結果。已上傳的資料可能仍在伺服器處理，停止等待不會刪除伺服器資料。" confirmLabel="停止操作" onCancel={() => { setConfirm(false); action.current = null; }} onConfirm={() => { setConfirm(false); session.current?.cancel(); if (action.current) setLeave(true); }} />
  </Screen>;
}
