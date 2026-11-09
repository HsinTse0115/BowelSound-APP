import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { WaveformVisualizer } from '@/components/WaveformVisualizer';
import { bowelSoundLabel } from '@/services/measurement';
import { BowelRecord, useApp } from '@/context/AppContext';
import { Screen, Card, Copy, Button, Chip, Confirm, ui, formatDate, mealOptions, symptomOptions, toggleSymptom } from '@/components/consumer-ui';

export default function ResultsScreen() {
  const { recordId } = useLocalSearchParams<{ recordId?: string }>();
  const { records, connectionVersion } = useApp();
  const [snapshot, setSnapshot] = useState<{ version: number; record: BowelRecord }>();
  const router = useRouter();
  const found = records.find(item => item.id === recordId);
  const record = found || (snapshot?.version === connectionVersion && snapshot.record.id === recordId ? snapshot.record : undefined);
  if (!record) return <Screen title="量測結果"><Card>
    <Copy title>{recordId ? '找不到這筆紀錄' : '先選擇一筆紀錄'}</Copy>
    <Button label="返回歷史紀錄" onPress={() => router.replace('/(tabs)/explore')} />
  </Card></Screen>;
  return <RecordDetail key={connectionVersion + record.id} record={record} retainForDeletion={() => setSnapshot({ version: connectionVersion, record })} />;
}

function RecordDetail({ record, retainForDeletion }: { record: BowelRecord; retainForDeletion: () => void }) {
  const { patients, updateRecord, deleteRecord } = useApp();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [meal, setMeal] = useState(record.mealTime || '未填寫');
  const [symptoms, setSymptoms] = useState<string[]>(record.symptoms || []);
  const [caffeine, setCaffeine] = useState<boolean | undefined>(record.hasCaffeine);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [details, setDetails] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [removed, setRemoved] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const dirty = editing && (meal !== (record.mealTime || '未填寫') || caffeine !== record.hasCaffeine
    || JSON.stringify([...symptoms].sort()) !== JSON.stringify([...(record.symptoms || [])].sort()));
  const guard = useUnsavedChanges(dirty, saving || deleting);
  useEffect(() => { if (deleted && !deleting) router.replace('/(tabs)/explore'); }, [deleted, deleting, router]);
  const reset = () => {
    setMeal(record.mealTime || '未填寫');
    setSymptoms(record.symptoms || []);
    setCaffeine(record.hasCaffeine);
    setError('');
    setEditing(false);
  };
  const save = async () => {
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      await updateRecord(record.id, { mealTime: meal, symptoms, hasCaffeine: caffeine });
      setEditing(false);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : '儲存失敗，請稍後再試');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (deleting) return;
    setDeleting(true);
    setDeleteError('');
    try {
      retainForDeletion();
      const result = await deleteRecord(record.id);
      setConfirmDelete(false);
      setRemoved(true);
      if (!result.audioDeleted) {
        // 紀錄已刪除，但音檔未能確認清理，讓使用者知道需要檢查伺服器。
        setDeleteError('紀錄已刪除，但音檔尚未確認移除，請聯絡管理人員協助。');
      } else {
        setDeleted(true);
      }
    } catch (e) {
      setConfirmDelete(false);
      setDeleteError(e instanceof Error ? e.message : '刪除失敗，請稍後再試');
    } finally {
      setDeleting(false);
    }
  };

  return <Screen title="量測紀錄">
    <Card>
      <Copy title>{record.aiResult ? '分析結果' : '已上傳，尚未分析'}</Copy>
      {!record.aiResult && <Copy>音檔已儲存至伺服器，目前沒有 AI 分析結果。</Copy>}
      <Copy>紀錄編號：{record.id}</Copy>
      <Copy>量測對象：{patients.find(item => item.id === record.patientId)?.name || record.patientId}</Copy>
      <Copy>量測時間：{formatDate(record.createdAt)}</Copy>
      <Copy>量測長度：{record.duration} 秒</Copy>
      {record.aiResult && <>
        <Copy>腸音狀態：{bowelSoundLabel(record.aiResult.status)}</Copy>
        {record.aiResult.status === 'not_detected' && <Copy muted>本次收音期間未偵測到腸音，不代表腸道沒有蠕動。</Copy>}
        <Copy>{record.aiResult.notes}</Copy>
        <Copy muted>分析結果不等同醫療診斷。</Copy>
      </>}
    </Card>
    {record.aiResult && <Card>
      <Copy title>腸音波形</Copy>
      <WaveformVisualizer samples={record.aiResult.waveform} />
      <Button label={details ? '收合詳細數據' : '查看詳細數據'} secondary onPress={() => setDetails(!details)} />
      {details && <>
        <Copy>頻率：{record.aiResult.frequency ?? '未提供'} 次／分</Copy>
        <Copy>信心值：{record.aiResult.confidence === null ? '未提供' : (record.aiResult.confidence * 100).toFixed(1) + '%'}</Copy>
        {!record.aiResult.spectrogram.length && <Copy muted>目前沒有頻譜資料。</Copy>}
        <View accessibilityLabel="頻譜圖" style={{ gap: 2 }}>
          {record.aiResult.spectrogram.map((row, i) => <View key={i} style={{ flexDirection: 'row', gap: 2 }}>
            {row.map((value, j) => <View key={j} style={{ flex: 1, height: 16, backgroundColor: 'hsl(0,0%,' + (20 + value / 255 * 65) + '%)' }} />)}
          </View>)}
        </View>
      </>}
    </Card>}
    <Card>
      <Copy title>{editing ? '編輯這次紀錄' : '當時的狀態'}</Copy>
      {saved && !editing && <Copy>修改已儲存。</Copy>}
      {editing ? <>
        <Copy>飯後時間</Copy>
        <View style={ui.row}>{Array.from(new Set([...mealOptions, meal])).map(value =>
          <Chip disabled={saving} key={value} label={value} selected={meal === value} onPress={() => setMeal(value)} />)}</View>
        <Copy>量測前喝過咖啡或茶</Copy>
        <View style={ui.row}>{[{ label: '未填寫', value: undefined }, { label: '沒有', value: false }, { label: '有', value: true }].map(option =>
          <Chip key={option.label} label={option.label} selected={caffeine === option.value} onPress={() => setCaffeine(option.value)} />)}</View>
        <Copy>症狀（可留空）</Copy>
        <View style={ui.row}>{symptomOptions.map(value =>
          <Chip key={value} label={value} selected={symptoms.includes(value)} onPress={() => setSymptoms(toggleSymptom(symptoms, value))} />)}</View>
        {!!error && <Copy>{error}</Copy>}
        <Button label={saving ? '儲存中…' : '儲存修改'} disabled={saving} onPress={() => { void save(); }} />
        <Button label="取消編輯" secondary disabled={saving} onPress={() => guard.requestDiscard(reset)} />
      </> : <>
        <Copy>飯後時間：{record.mealTime || '未填寫'}</Copy>
        <Copy>咖啡或茶：{record.hasCaffeine === undefined ? '未填寫' : record.hasCaffeine ? '有' : '沒有'}</Copy>
        <Copy>症狀：{record.symptoms?.join('、') || '未填寫'}</Copy>
        <Button disabled={removed || deleting} label="編輯紀錄" onPress={() => { setSaved(false); setEditing(true); }} />
      </>}
      <Copy muted>可以修改症狀、飯後時間，以及是否喝過咖啡或茶。</Copy>
    </Card>
    {!editing && <>
      {!!deleteError && <Card><Copy>{deleteError}</Copy><Button label="返回歷史紀錄" secondary onPress={() => router.replace('/(tabs)/explore')} /></Card>}
      <Button label={deleting ? '刪除中…' : '刪除這筆紀錄'} secondary disabled={deleting || removed} onPress={() => { setDeleteError(''); setConfirmDelete(true); }} />
      <Button label="返回歷史紀錄" secondary disabled={deleting} onPress={() => router.replace('/(tabs)/explore')} />
    </>}
    <Confirm visible={guard.visible} title="還沒儲存，要離開嗎？" message="這次修改尚未儲存，離開後會捨棄修改。" confirmLabel="不儲存，直接離開" onCancel={guard.onCancel} onConfirm={guard.onConfirm} />
    <Confirm
      visible={confirmDelete}
      title="確定刪除這筆量測紀錄？"
      message={`紀錄 ${record.id} 將永久刪除，原始音檔也會一併申請移除。此操作無法復原。`}
      confirmLabel={deleting ? '刪除中…' : '確認刪除'}
      onCancel={() => { if (!deleting) setConfirmDelete(false); }}
      onConfirm={() => { void remove(); }}
    />
  </Screen>;
}
