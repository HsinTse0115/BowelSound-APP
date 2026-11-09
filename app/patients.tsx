import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { useApp } from '@/context/AppContext';
import { Screen, Card, Copy, Button, Chip, Field, Confirm, ui } from '@/components/consumer-ui';

export default function PeopleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ create?: string; next?: string }>();
  const { patients, settings, storageError, addPatient, updatePatient, deletePatient, updateSettings } = useApp();
  const [creating, setCreating] = useState(params.create === '1');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'M' | 'F'>('M');
  const [primaryDraft, setPrimary] = useState<boolean>();
  const primary = primaryDraft ?? !settings.primaryPatientId;
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [saved, setSaved] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editGender, setEditGender] = useState<'M' | 'F'>('M');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const original = patients.find(p => p.id === editingId);
  const dirty = (creating && (!!name || !!age || gender !== 'M' || primary !== !settings.primaryPatientId))
    || (!!original && (editName !== original.name || editAge !== String(original.age) || editGender !== original.gender));
  const guard = useUnsavedChanges(dirty, saving || !!busyId);
  const [nextPerson, setNextPerson] = useState('');
  useEffect(() => { if (nextPerson && !saving) router.replace({ pathname: '/record', params: { patientId: nextPerson } }); }, [nextPerson, saving, router]);
  const discardForms = () => { setCreating(false); setName(''); setAge(''); setGender('M'); setEditingId(null); setError(''); };
  const beginEdit = (p: typeof patients[number]) => {
    setEditingId(p.id);
    setDeletingId(null);
    setEditName(p.name);
    setEditAge(String(p.age));
    setEditGender(p.gender);
    setError('');
    setSaved('');
  };
  const saveEdit = async () => {
    if (!editingId || busyId) return;
    if (!editName.trim()) { setError('請輸入姓名或暱稱。'); return; }
    if (!/^\d+$/.test(editAge) || Number(editAge) < 1 || Number(editAge) > 120) {
      setError('年齡請填寫 1 至 120 的整數。'); return;
    }
    setBusyId(editingId); setError(''); setSaved('');
    try {
      const updated = await updatePatient(editingId, { name: editName.trim(), age: Number(editAge), gender: editGender });
      setEditingId(null);
      setSaved('資料已更新：' + updated.name);
    } catch (err) { setError(err instanceof Error ? err.message : '修改資料失敗'); }
    finally { setBusyId(null); }
  };
  const confirmDelete = async (id: string) => {
    if (busyId) return;
    setBusyId(id); setError(''); setSaved('');
    try {
      await deletePatient(id);
      setDeletingId(null);
      setEditingId(null);
      setSaved('個人資料已刪除');
    } catch (err) { setDeletingId(null); setError(err instanceof Error ? err.message : '刪除資料失敗'); }
    finally { setBusyId(null); }
  };
  const save = async () => {
    if (saving) return;
    if (!name.trim()) { setError('請輸入姓名或暱稱。'); return; }
    if (!/^\d+$/.test(age) || Number(age) < 1 || Number(age) > 120) { setError('年齡請填寫 1 至 120 的整數。'); return; }
    setSaving(true);
    setError('');
    setSaved('');
    try {
      const person = await addPatient({ name: name.trim(), age: Number(age), gender, subjectType: 'participant' });
      if (primary) updateSettings({ primaryPatientId: person.id });
      setCreating(false);
      setSaved('已新增：' + person.name);
      setName('');
      setAge('');
      if (params.next === 'record') {
        setNextPerson(person.id);
      }
    } catch (err) {
      console.error('新增病患失敗', err);
      setError(err instanceof Error ? err.message : '新增未完成，請確認連線後再試。');
    } finally {
      setSaving(false);
    }
  };
  return <Screen title="本人與家人">
    <Copy muted>選擇「設為本人」後，下次量測會自動帶入這個對象。個人資料會儲存到設定的服務；「本人」偏好保存在這台裝置。</Copy>
    {!!storageError && <Copy>{storageError}</Copy>}
    {!!saved && <Copy>{saved}</Copy>}
    {!creating && !!error && <Copy>{error}</Copy>}
    {creating ? <Card>
      <Copy title>新增個人資料</Copy>
      <Copy>姓名或暱稱 *</Copy><Field editable={!saving && !busyId} accessibilityLabel="姓名或暱稱" value={name} onChangeText={setName} maxLength={40} placeholder="例如：小安" />
      <Copy>年齡 *</Copy><Field editable={!saving && !busyId} accessibilityLabel="年齡" value={age} onChangeText={setAge} keyboardType="number-pad" maxLength={3} placeholder="請輸入年齡" />
      <Copy>性別</Copy><View style={ui.row}><Chip disabled={saving || !!busyId} label="男" selected={gender === 'M'} onPress={() => setGender('M')} /><Chip disabled={saving || !!busyId} label="女" selected={gender === 'F'} onPress={() => setGender('F')} /></View>
      <Chip disabled={saving || !!busyId} label="設為本人（預設量測對象）" selected={primary} onPress={() => setPrimary(!primary)} />
      {!!error && <Copy>{error}</Copy>}
      <Button disabled={saving || !!busyId} label={saving ? '儲存中…' : params.next === 'record' ? '儲存並繼續量測' : '儲存資料'} onPress={() => { void save(); }} />
      <Button disabled={saving || !!busyId} label="取消新增" secondary onPress={() => guard.requestDiscard(discardForms)} />
    </Card> : <Button disabled={saving || !!busyId} label="新增本人或家人" onPress={() => guard.requestDiscard(() => { discardForms(); setPrimary(!settings.primaryPatientId); setCreating(true); })} />}
    <Field editable={!saving && !busyId} accessibilityLabel="搜尋對象" value={search} onChangeText={setSearch} placeholder="搜尋姓名或暱稱" />
    {patients.filter(p => p.name.includes(search.trim())).map(p => <Card key={p.id}>
      <Copy title>{p.name}{settings.primaryPatientId === p.id ? ' · 本人' : ''}</Copy>
      <Copy muted>{p.age} 歲 · {p.gender === 'M' ? '男' : '女'}</Copy>
      {settings.primaryPatientId !== p.id && <Button disabled={saving || !!busyId} label={'將' + p.name + '設為本人'} secondary onPress={() => { updateSettings({ primaryPatientId: p.id }); setSaved('本人已切換為：' + p.name); }} />}
      {editingId === p.id && <View>
        <Copy title>編輯個人資料</Copy>
        <Copy>姓名或暱稱 *</Copy>
        <Field editable={!saving && !busyId} accessibilityLabel="修改姓名" value={editName} onChangeText={setEditName} maxLength={40} />
        <Copy>年齡 *</Copy>
        <Field editable={!saving && !busyId} accessibilityLabel="修改年齡" value={editAge} onChangeText={setEditAge} keyboardType="number-pad" maxLength={3} />
        <Copy>性別</Copy>
        <View style={ui.row}>
          <Chip disabled={saving || !!busyId} label="男" selected={editGender === 'M'} onPress={() => setEditGender('M')} />
          <Chip disabled={saving || !!busyId} label="女" selected={editGender === 'F'} onPress={() => setEditGender('F')} />
        </View>
        <Button disabled={saving || !!busyId} label={busyId === p.id ? '儲存中…' : '儲存修改'} onPress={() => { void saveEdit(); }} />
        <Button disabled={saving || !!busyId} label="取消編輯" secondary onPress={() => guard.requestDiscard(discardForms)} />
      </View>}
      {deletingId === p.id && <View>
        <Copy title>確定刪除 {p.name}？</Copy>
        <Copy>此操作無法復原。如果這位家人已有量測紀錄，伺服器會拒絕刪除以保護資料。</Copy>
        <Button disabled={saving || !!busyId} label="先保留" secondary onPress={() => { if (!busyId) setDeletingId(null); }} />
        <Button disabled={saving || !!busyId} label={busyId === p.id ? '刪除中…' : '確認刪除'} onPress={() => { void confirmDelete(p.id); }} />
      </View>}
      {editingId !== p.id && deletingId !== p.id && <View>
        <Button disabled={saving || !!busyId} label="編輯資料" secondary onPress={() => guard.requestDiscard(() => { discardForms(); beginEdit(p); })} />
        <Button disabled={saving || !!busyId} label="刪除個人資料" secondary onPress={() => guard.requestDiscard(() => { discardForms(); setDeletingId(p.id); setSaved(''); })} />
      </View>}
      <Button disabled={saving || !!busyId} label={'為' + p.name + '開始量測'} secondary onPress={() => guard.requestDiscard(() => { discardForms(); router.push({ pathname: '/record', params: { patientId: p.id } }); })} />
    </Card>)}
    {!patients.some(p => p.name.includes(search.trim())) && <Copy muted>找不到對象，可以試試其他名字或新增資料。</Copy>}
    <Confirm visible={guard.visible} title="還沒儲存，要離開嗎？" message="這次填寫或修改的內容尚未儲存，離開後會捨棄修改。" confirmLabel="不儲存，直接離開" onCancel={guard.onCancel} onConfirm={guard.onConfirm} />
  </Screen>;
}
