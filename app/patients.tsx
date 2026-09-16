import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { Screen, Card, Copy, Button, Chip, Field, DemoNotice, ui } from '@/components/consumer-ui';

export default function PeopleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ create?: string; next?: string }>();
  const { patients, settings, ready, addPatient, updateSettings } = useApp();
  const [creating, setCreating] = useState(params.create === '1');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'M' | 'F'>('M');
  const [primary, setPrimary] = useState(!settings.primaryPatientId);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [saved, setSaved] = useState('');
  useEffect(() => { if (ready) setPrimary(!settings.primaryPatientId); }, [ready, settings.primaryPatientId]);
  const save = () => {
    if (!name.trim()) { setError('請輸入姓名或暱稱。'); return; }
    if (!/^\d+$/.test(age) || Number(age) < 1 || Number(age) > 120) { setError('年齡請填寫 1 至 120 的整數。'); return; }
    const person = addPatient({ name: name.trim(), age: Number(age), gender, subjectType: 'participant' });
    if (primary) updateSettings({ primaryPatientId: person.id });
    setCreating(false); setSaved('已新增：' + person.name); setName(''); setAge(''); setError('');
    if (params.next === 'record') router.replace({ pathname: '/record', params: { patientId: person.id } });
  };
  return <Screen title="本人與家人">
    <DemoNotice />
    <Copy muted>選擇「設為本人」後，下次量測會自動帶入這個對象。預載姓名與舊紀錄是展示範例。</Copy>
    {!!saved && <Copy>{saved}</Copy>}
    {creating ? <Card>
      <Copy title>新增個人資料</Copy>
      <Copy>姓名或暱稱 *</Copy><Field accessibilityLabel="姓名或暱稱" value={name} onChangeText={setName} maxLength={40} placeholder="例如：小安" />
      <Copy>年齡 *</Copy><Field accessibilityLabel="年齡" value={age} onChangeText={setAge} keyboardType="number-pad" maxLength={3} placeholder="請輸入年齡" />
      <Copy>性別</Copy><View style={ui.row}><Chip label="男" selected={gender === 'M'} onPress={() => setGender('M')} /><Chip label="女" selected={gender === 'F'} onPress={() => setGender('F')} /></View>
      <Chip label="設為本人（預設量測對象）" selected={primary} onPress={() => setPrimary(!primary)} />
      {!!error && <Copy>{error}</Copy>}
      <Button label={params.next === 'record' ? '儲存並繼續量測' : '儲存資料'} onPress={save} />
      <Button label="取消新增" secondary onPress={() => { setCreating(false); setError(''); }} />
    </Card> : <Button label="新增本人或家人" onPress={() => { setPrimary(!settings.primaryPatientId); setCreating(true); }} />}
    <Field accessibilityLabel="搜尋對象" value={search} onChangeText={setSearch} placeholder="搜尋姓名或暱稱" />
    {patients.filter(p => p.name.includes(search.trim())).map(p => <Card key={p.id}>
      <Copy title>{p.name}{settings.primaryPatientId === p.id ? ' · 本人' : ''}</Copy>
      <Copy muted>{p.age} 歲 · {p.gender === 'M' ? '男' : '女'}</Copy>
      {settings.primaryPatientId !== p.id && <Button label={'將' + p.name + '設為本人'} secondary onPress={() => { updateSettings({ primaryPatientId: p.id }); setSaved('本人已切換為：' + p.name); }} />}
      <Button label={'為' + p.name + '開始量測'} secondary onPress={() => router.push({ pathname: '/record', params: { patientId: p.id } })} />
    </Card>)}
    {!patients.some(p => p.name.includes(search.trim())) && <Copy muted>找不到對象，可以試試其他名字或新增資料。</Copy>}
  </Screen>;
}
