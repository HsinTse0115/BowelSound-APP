import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { Screen, Card, Copy, Button, Chip, Field, DemoNotice, formatDate, ui } from '@/components/consumer-ui';
import { filterRecords, isValidDateInput } from '@/services/record-utils';

export default function RecordsScreen() {
  const router = useRouter();
  const { patients, records } = useApp();
  const [person, setPerson] = useState('');
  const [period, setPeriod] = useState('全部');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const valid = period !== '自訂' || (isValidDateInput(start) && isValidDateInput(end) && (!start || !end || start <= end));
  const filtered = valid ? filterRecords(records, { patientId: person, period, start, end }) : [];
  return <Screen title="紀錄" back={false}>
    <DemoNotice />
    <Card>
      <Copy title>找到你要的紀錄</Copy>
      <Copy>對象</Copy>
      <View style={ui.row}><Chip label="全部對象" selected={!person} onPress={() => setPerson('')} />
        {patients.map(p => <Chip key={p.id} label={p.name} selected={p.id === person} onPress={() => setPerson(p.id)} />)}</View>
      <Copy>日期範圍</Copy>
      <View style={ui.row}>{['全部', '近7天', '近30天', '自訂'].map(value => <Chip key={value} label={value} selected={period === value} onPress={() => setPeriod(value)} />)}</View>
      {period === '自訂' && <>
        <Copy muted>格式 YYYY-MM-DD；留空代表不限起日或迄日。</Copy>
        <Field accessibilityLabel="開始日期" placeholder="開始日期，例如 2026-09-01" value={start} onChangeText={setStart} autoCapitalize="none" />
        <Field accessibilityLabel="結束日期" placeholder="結束日期，例如 2026-09-30" value={end} onChangeText={setEnd} autoCapitalize="none" />
        {!valid && <Copy>請輸入有效日期，結束日期不能早於開始日期。</Copy>}
      </>}
    </Card>
    <Copy title>{valid ? '共 ' + filtered.length + ' 筆紀錄' : '請先修正日期'}</Copy>
    {valid && filtered.length === 0 && <Card><Copy>這個範圍還沒有紀錄。</Copy>
      <Button label="清除篩選" secondary onPress={() => { setPerson(''); setPeriod('全部'); setStart(''); setEnd(''); }} />
      <Button label="開始一次量測" onPress={() => router.push('/record')} /></Card>}
    {filtered.map(record => <Card key={record.id}>
      <Copy title>{patients.find(p => p.id === record.patientId)?.name || '已移除的對象'}</Copy>
      <Copy>{formatDate(record.createdAt)} · {record.duration} 秒</Copy>
      <Copy muted>模擬紀錄 · {record.symptoms?.join('、') || '症狀未填寫'}</Copy>
      {!!record.note && <Copy>{record.note}</Copy>}
      <Button label="查看或編輯紀錄" secondary onPress={() => router.push({ pathname: '/analytics', params: { recordId: record.id } })} />
    </Card>)}
  </Screen>;
}
