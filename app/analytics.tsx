import React, { useRef, useState, useEffect } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { usePreventRemove } from 'expo-router/build/react-navigation/native';
import { BowelRecord, useApp } from '@/context/AppContext';
import { Screen, Card, Copy, Button, Chip, Field, DemoNotice, Confirm, ui, usePalette, formatDate, mealOptions, symptomOptions, toggleSymptom } from '@/components/consumer-ui';

export default function ResultsScreen() {
  const { recordId } = useLocalSearchParams<{ recordId?: string }>();
  const { records } = useApp();
  const router = useRouter();
  const record = records.find(r => r.id === recordId);
  if (!record) return <Screen title="量測結果"><Card><Copy title>{recordId ? '找不到這筆紀錄' : '先選擇一筆紀錄'}</Copy><Copy>前往紀錄頁，選擇想查看的日期與對象。</Copy><Button label="前往紀錄" onPress={() => router.replace('/(tabs)/explore')} /></Card></Screen>;
  return <Result key={record.id} record={record} />;
}
function Result({ record }: { record: BowelRecord }) {
  const { patients, updateRecord, deleteRecord } = useApp();
  const router = useRouter();
  const navigation = useNavigation();
  const p = usePalette();
  const [details, setDetails] = useState(false);
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState(record.note || '');
  const [meal, setMeal] = useState(record.mealTime || '未填寫');
  const [symptoms, setSymptoms] = useState(record.symptoms || []);
  const [caffeine, setCaffeine] = useState(record.hasCaffeine);
  const [saved, setSaved] = useState(false);
  const [remove, setRemove] = useState(false);
  const [discard, setDiscard] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const pendingAction = useRef<Parameters<typeof navigation.dispatch>[0] | null>(null);
  const dirty = editing && (note !== (record.note || '') || meal !== (record.mealTime || '未填寫') || caffeine !== record.hasCaffeine || JSON.stringify(symptoms) !== JSON.stringify(record.symptoms || []));
  usePreventRemove(dirty, ({ data }: any) => { pendingAction.current = data.action; setDiscard(true); });
  useEffect(() => {
    if (leaving && !dirty) {
      const action = pendingAction.current; pendingAction.current = null; setLeaving(false);
      if (action) navigation.dispatch(action);
    }
  }, [leaving, dirty, navigation]);
  const reset = () => { setNote(record.note || ''); setMeal(record.mealTime || '未填寫'); setSymptoms(record.symptoms || []); setCaffeine(record.hasCaffeine); setEditing(false); };
  return <Screen title="量測結果">
    <Card>
      <Copy title>腸音波形</Copy>
      <Copy muted>模擬波形 · {record.duration} 秒，非實際收音</Copy>
      <View accessibilityRole="image" accessibilityLabel="本次量測的模擬波形，非實際收音" style={{ height: 140, flexDirection: 'row', gap: 2, alignItems: 'center', overflow: 'hidden' }}>{record.aiResult.waveformMockData.map((value, i) => <View key={i} style={{ flex: 1, height: Math.max(2, Math.min(130, Math.abs(value) * 100)), backgroundColor: p.tint }} />)}</View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Copy muted>0 秒</Copy><Copy muted>{record.duration} 秒</Copy></View>
    </Card>
    <Card>
      <Copy title>分析結果（模擬）</Copy>
      <Copy>範例分類：{record.aiResult.status === 'normal' ? '正常' : '異常'}</Copy>
      <Copy muted>此分類為示範資料，不代表你的健康狀況。</Copy>
      <Copy title>{patients.find(person => person.id === record.patientId)?.name || '未知對象'}</Copy>
      <Copy>{formatDate(record.createdAt)} · 展示量測 {record.duration} 秒</Copy>
      <Copy muted>尚未串接真實收音與分析。下方可補充這次的狀態與備註。</Copy>
    </Card>
    <Card>
      <Copy title>{editing ? '編輯這次紀錄' : '當時的狀態'}</Copy>
      {saved && !editing && <Copy>已更新紀錄。</Copy>}
      {editing ? <>
        <Copy>飯後時間</Copy><View style={ui.row}>{Array.from(new Set([...mealOptions, meal])).map(value => <Chip key={value} label={value} selected={meal === value} onPress={() => setMeal(value)} />)}</View>
        <Copy>量測前喝過咖啡或茶</Copy><View style={ui.row}>{[{ label: '未填寫', value: undefined }, { label: '沒有', value: false }, { label: '有', value: true }].map(option => <Chip key={option.label} label={option.label} selected={caffeine === option.value} onPress={() => setCaffeine(option.value)} />)}</View>
        <Copy>症狀（未選擇代表未填寫）</Copy><View style={ui.row}>{symptomOptions.map(value => <Chip key={value} label={value} selected={symptoms.includes(value)} onPress={() => setSymptoms(toggleSymptom(symptoms, value))} />)}</View>
        <Copy>備註（選填，最多 500 字）</Copy><Field accessibilityLabel="紀錄備註" value={note} onChangeText={setNote} multiline maxLength={500} placeholder="補充這次想記住的事情" style={{ minHeight: 110, textAlignVertical: 'top' }} />
        <Copy muted>只修改填寫內容，展示數據與原始日期不會重新產生。</Copy>
        <Button label="儲存修改" onPress={() => { updateRecord(record.id, { note: note.trim(), mealTime: meal, symptoms, hasCaffeine: caffeine }); setEditing(false); setSaved(true); }} />
        <Button label="取消編輯" secondary onPress={() => dirty ? setDiscard(true) : reset()} />
      </> : <>
        <Copy>飯後時間：{record.mealTime || '未填寫'}</Copy>
        <Copy>咖啡或茶：{record.hasCaffeine === undefined ? '未填寫' : record.hasCaffeine ? '有' : '沒有'}</Copy>
        <Copy>症狀：{record.symptoms?.join('、') || '未填寫'}</Copy>
        <Copy>備註：{record.note || '尚無備註'}</Copy>
        <Button label="編輯狀態與備註" secondary onPress={() => { reset(); setSaved(false); setEditing(true); }} />
      </>}
    </Card>
    {!editing && <>
      <Button label="再次量測" onPress={() => router.push({ pathname: '/record', params: { patientId: record.patientId } })} />
      <Button label={details ? '收合詳細數據' : '查看詳細數據（模擬）'} secondary onPress={() => setDetails(!details)} />
      {details && <Card>
        <Copy title>模擬頻譜</Copy>
        <Copy muted>以下為程式生成的示意數值，非原始音訊或真實模型輸出。</Copy>
        <View accessibilityLabel="模擬頻譜示意圖" style={{ gap: 2 }}>{record.aiResult.spectrogramMockData.map((row, i) => <View key={i} style={{ flexDirection: 'row', gap: 2 }}>{row.map((value, j) => <View key={j} style={{ flex: 1, height: 16, backgroundColor: 'hsl(0,0%,' + (20 + value / 255 * 65) + '%)' }} />)}</View>)}</View>
        <Copy>範例頻率：{record.aiResult.frequency} 次／分</Copy>
        <Copy>範例分類：{record.aiResult.status === 'normal' ? '正常' : '異常'}（不代表健康狀況）</Copy>
        <Copy>模擬信心數值：{(record.aiResult.confidence * 100).toFixed(1)}%（不是準確率）</Copy>
      </Card>}
      <Button label="刪除這筆紀錄" secondary onPress={() => setRemove(true)} />
    </>}
    <DemoNotice />
    <Confirm visible={remove} title="刪除這筆紀錄？" message={formatDate(record.createdAt) + ' 的紀錄將永久移除，無法復原。'} confirmLabel="確認刪除" onCancel={() => setRemove(false)} onConfirm={() => { deleteRecord(record.id); router.replace('/(tabs)/explore'); }} />
    <Confirm visible={discard} title="捨棄未儲存的修改？" message="原本的紀錄會保留，這次尚未儲存的修改會被捨棄。" confirmLabel="捨棄修改" onCancel={() => { pendingAction.current = null; setDiscard(false); }} onConfirm={() => { reset(); setDiscard(false); if (pendingAction.current) setLeaving(true); }} />
  </Screen>;
}
