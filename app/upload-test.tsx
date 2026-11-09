import React, { useState } from 'react';
import { Platform, ScrollView, Text, TextInput, Pressable, View } from 'react-native';
import { apiJson } from '@/services/api';
import { useApp } from '@/context/AppContext';

type UploadReply = {
  record_id: string;
  patient_id: string;
  audio_file_path: string;
  created_at: string;
};

export default function UploadTestScreen() {
  const { patients, settings } = useApp();
  const [patientId, setPatientId] = useState('');
  const [duration, setDuration] = useState('10');
  const [caffeine, setCaffeine] = useState<boolean | undefined>();
  const [symptoms, setSymptoms] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<UploadReply | null>(null);
  const apiBase = settings.apiUrl;

  function pickAudio() {
    if (Platform.OS !== 'web') return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.wav,.m4a,.mp3,audio/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) { setSelectedFile(file); setMessage(''); setResult(null); }
    };
    input.click();
  }

  async function upload() {
    if (busy) return;
    setMessage('');
    setResult(null);
    if (!patientId || !patients.some(p => p.id === patientId)) {
      setMessage('請先選擇病患。'); return;
    }
    const seconds = Number(duration);
    if (!Number.isInteger(seconds) || seconds < 1 || seconds > 20) {
      setMessage('請輸入 1～20 秒的整數錄音長度。'); return;
    }
    if (!selectedFile || !/\.(wav|m4a|mp3)$/i.test(selectedFile.name)) {
      setMessage('請選擇 WAV、M4A 或 MP3 音檔。'); return;
    }
    const form = new FormData();
    form.append('patient_id', patientId);
    form.append('duration', String(seconds));
    form.append('has_caffeine', caffeine === undefined ? 'null' : String(caffeine));
    form.append('symptoms', JSON.stringify(symptoms.trim() ? [symptoms.trim()] : []));
    form.append('meal_time', '未填寫');
    form.append('audio', selectedFile, selectedFile.name);
    setBusy(true);
    try {
      const reply = await apiJson<UploadReply>(apiBase, '/api/record/upload', { method: 'POST', body: form }, 30000);
      if (!reply.record_id || !reply.audio_file_path) throw new Error('伺服器回傳資料格式不正確。');
      setResult(reply);
      setMessage('上傳成功！這只代表音檔及紀錄已儲存，尚未執行 AI 分析。');
    } catch (error) {
      setMessage(`上傳失敗：${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setBusy(false);
    }
  }

  const btn = (label: string, onPress: () => void, disabled = false) => (
    <Pressable onPress={onPress} disabled={disabled} style={{ padding: 12, backgroundColor: disabled ? '#999' : '#167c80', borderRadius: 8, marginVertical: 6 }}>
      <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );

  return <ScrollView contentContainerStyle={{ padding: 20, maxWidth: 560, width: '100%', alignSelf: 'center', gap: 10 }}>
    <Text style={{ fontSize: 24, fontWeight: '700' }}>音檔上傳測試</Text>
    <Text>僅供本機網頁測試；不會產生 AI 分析結果。</Text>
    {Platform.OS !== 'web' ? <Text>此測試頁面僅支援瀏覽器網頁版。</Text> : <>
      <Text>API：{apiBase}</Text>
      <Text style={{ fontWeight: '700' }}>1. 選擇病患</Text>
      {patients.map(p => btn(`${patientId === p.id ? '✓ ' : ''}${p.name} (${p.id})`, () => setPatientId(p.id), busy))}
      {!patients.length && <Text>尚無病患，請先到「本人與家人」新增。</Text>}
      <Text style={{ fontWeight: '700' }}>2. 選擇音檔</Text>
      {btn('選擇 WAV / M4A / MP3', pickAudio, busy)}
      <Text>{selectedFile ? `${selectedFile.name} (${Math.ceil(selectedFile.size / 1024)} KB)` : '尚未選擇檔案'}</Text>
      <Text style={{ fontWeight: '700' }}>3. 錄音長度（秒，1～20）</Text>
      <TextInput value={duration} onChangeText={setDuration} keyboardType="numeric" editable={!busy}
        style={{ borderWidth: 1, borderColor: '#aaa', padding: 10, borderRadius: 6 }} />
      <Text>量測前喝過咖啡或茶</Text>
      {([{ label: '未填寫', value: undefined }, { label: '沒有', value: false }, { label: '有', value: true }]).map(option =>
        <View key={option.label}>{btn((caffeine === option.value ? '✓ ' : '') + option.label, () => setCaffeine(option.value), busy)}</View>)}
      <Text>症狀（可留空；測試用）</Text>
      <TextInput value={symptoms} onChangeText={setSymptoms} editable={!busy} placeholder="例如：腹痛"
        style={{ borderWidth: 1, borderColor: '#aaa', padding: 10, borderRadius: 6 }} />
      {btn(busy ? '上傳中…' : '上傳測試音檔', () => { void upload(); }, busy)}
      {!!message && <Text selectable>{message}</Text>}
      {result && <View style={{ padding: 12, borderWidth: 1, borderColor: '#aaa', borderRadius: 8 }}>
        <Text selectable>紀錄編號：{result.record_id}</Text>
        <Text selectable>病患編號：{result.patient_id}</Text>
        <Text selectable>音檔位置：{result.audio_file_path}</Text>
        <Text selectable>建立時間：{result.created_at}</Text>
      </View>}
    </>}
  </ScrollView>;
}
