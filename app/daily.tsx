import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { usePreventRemove } from 'expo-router/build/react-navigation/native';
import { useApp } from '@/context/AppContext';
import { useWellness } from '@/context/WellnessContext';
import { BOWEL_OPTIONS, FEELING_OPTIONS, DailyEntry, validDay } from '@/services/wellness';
import { Screen, Card, Copy, Button, Chip, Field, Confirm, ui } from '@/components/consumer-ui';
import { useToday, WellnessGate } from '@/components/wellness-ui';

export default function DailyScreen() {
  const router = useRouter();
  const today = useToday();
  const params = useLocalSearchParams<{ patientId?: string; date?: string }>();
  const { patients, settings } = useApp();
  const { entries, ready } = useWellness();
  const person = patients.find(p => p.id === (params.patientId || settings.primaryPatientId));
  const day = params.date || today;
  return <Screen title="每日紀錄"><WellnessGate>
    {!person || !validDay(day) || day > today ? <Card><Copy>請選擇本人或家人，以及今天或過去的日期。</Copy><Button label="前往日曆" onPress={() => router.replace('/(tabs)/calendar')} /><Button label="設定本人資料" secondary onPress={() => router.push('/patients')} /></Card> :
      ready && <DailyForm key={person.id + day} patientId={person.id} name={person.name} date={day} entry={entries.find(e => e.patientId === person.id && e.date === day)} />}
  </WellnessGate></Screen>;
}
function DailyForm({ patientId, name, date, entry }: { patientId: string; name: string; date: string; entry?: DailyEntry }) {
  const { save, busy } = useWellness();
  const router = useRouter();
  const navigation = useNavigation();
  const [bowel, setBowel] = useState(entry?.bowel || '未填寫');
  const [feeling, setFeeling] = useState(entry?.feeling || '未填寫');
  const [note, setNote] = useState(entry?.note || '');
  const [message, setMessage] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const action = useRef<Parameters<typeof navigation.dispatch>[0] | null>(null);
  const dirty = !leaving && (bowel !== (entry?.bowel || '未填寫') || feeling !== (entry?.feeling || '未填寫') || note !== (entry?.note || ''));
  usePreventRemove(dirty || busy, ({ data }: { data: { action: Parameters<typeof navigation.dispatch>[0] } }) => { if (!busy) { action.current = data.action; setConfirm(true); } });
  useEffect(() => { if (leaving && action.current) { const next = action.current; action.current = null; navigation.dispatch(next); } }, [leaving, navigation]);
  const submit = async () => {
    setMessage('');
    try { await save(patientId, date, { bowel, feeling, note }); setNote(note.trim()); setMessage('紀錄已儲存。'); }
    catch { setMessage('儲存失敗，輸入內容仍保留，請重試。'); }
  };
  return <>
    <Copy muted>{name} · {date}</Copy>
    <Card><Copy title>當天排便次數</Copy><Copy muted>如果當天沒有排便，也可以記錄；還不確定就選「未填寫」。</Copy><View style={ui.row}>{BOWEL_OPTIONS.map(value => <Chip key={value} label={value} selected={bowel === value} onPress={() => { if (!busy) { setBowel(value); setMessage(''); } }} />)}</View></Card>
    <Card><Copy title>身體狀況</Copy><View style={ui.row}>{FEELING_OPTIONS.map(value => <Chip key={value} label={value} selected={feeling === value} onPress={() => { if (!busy) { setFeeling(value); setMessage(''); } }} />)}</View></Card>
    <Card><Copy title>備註</Copy><Copy muted>可以記錄吃了什麼、睡得如何，或有沒有肚子不舒服。最多 500 字。</Copy><Field accessibilityLabel="紀錄備註" value={note} onChangeText={value => { setNote(value); setMessage(''); }} editable={!busy} multiline maxLength={500} placeholder="例如：午餐吃得比較晚，下午有點脹氣。" style={{ minHeight: 120, textAlignVertical: 'top' }} /></Card>
    {!!message && <Copy>{message}</Copy>}
    <Button label={busy ? '儲存中…' : '儲存紀錄'} disabled={busy} onPress={submit} />
    <Button label="返回日曆" secondary disabled={busy} onPress={() => router.replace({ pathname: '/(tabs)/calendar', params: { date, patientId } })} />
    <Copy muted>內容由你自行填寫，不是 AI 分析結果。如要清除當天的排便、身體狀況和備註，請選回「未填寫」、清空備註，再按儲存。</Copy>
    <Confirm visible={confirm} title="還沒儲存，要離開嗎？" message="離開後，這次修改不會儲存，原本的紀錄仍會保留。" confirmLabel="不儲存，直接離開" onCancel={() => { action.current = null; setConfirm(false); }} onConfirm={() => { setConfirm(false); setLeaving(true); }} />
  </>;
}
