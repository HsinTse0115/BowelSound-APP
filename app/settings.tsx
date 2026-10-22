import React, { useState } from 'react';
import { View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { Screen, Card, Copy, Button, Chip, Field, ui } from '@/components/consumer-ui';
import { getMeasurementAdapter } from '@/services/measurement-adapter';
import { apiRequest, normalizeApiUrl } from '@/services/api';

export default function SettingsScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const { settings, patients, updateSettings } = useApp();
  const [advanced, setAdvanced] = useState(false);
  const [urlDraft, setUrl] = useState<string>();
  const url = urlDraft ?? settings.apiUrl;
  const [message, setMessage] = useState('');
  const [testing, setTesting] = useState(false);
  const person = patients.find(p => p.id === settings.primaryPatientId);
  const save = () => {
    try { const value = normalizeApiUrl(url); updateSettings({ apiUrl: value }); setUrl(value); setMessage('已儲存網址。'); }
    catch (error) { setMessage(error instanceof Error ? error.message : '請檢查網址格式。'); }
  };
  const test = async () => {
    setTesting(true); setMessage('');
    try { const response = await apiRequest(normalizeApiUrl(url), '/api/health', {}, 5000); if (!response.ok) throw new Error('伺服器回應 ' + response.status); setMessage('伺服器可連線；這不代表硬體已連線或分析服務可用。'); }
    catch (error) { setMessage(error instanceof Error ? error.message : '連線失敗，請稍後重試。'); }
    finally { setTesting(false); }
  };
  return <Screen title="我的" back={pathname === '/settings'}>
    <Card><Copy title>{person?.name || '還沒有設定本人'}</Copy><Copy muted>管理本人與家人的資料，選擇預設量測對象。</Copy>
      <Button label="本人與家人資料" secondary onPress={() => router.push('/patients')} />
      <Button label="操作教學" secondary onPress={() => router.push('/guide')} />
      <Button label="知識與使用說明" secondary onPress={() => router.push('/education')} />
    </Card>
    <Card><Copy title>量測裝置</Copy><Copy>{getMeasurementAdapter(settings.apiUrl).available ? '可開始量測' : '硬體與分析服務尚未完成串接'}</Copy></Card>
    <Card><Copy title>量測時間</Copy><Copy>每次 20 秒</Copy><Copy muted>配合目前硬體收音長度，時間到會自動結束。</Copy></Card>
    <Card><Copy title>介面外觀</Copy><View style={ui.row}><Chip label="淺色" selected={settings.themeMode === 'light'} onPress={() => updateSettings({ themeMode: 'light' })} /><Chip label="深色" selected={settings.themeMode === 'dark'} onPress={() => updateSettings({ themeMode: 'dark' })} /></View></Card>
    <Card><Copy title>資料與隱私</Copy><Copy>目前個人資料與紀錄保存在這台裝置的 APP 儲存空間；網頁版則保存在此瀏覽器。目前沒有雲端同步。硬體與分析服務串接後，開始量測會將音訊傳送至設定的服務。</Copy><Copy muted>清除 APP／瀏覽器資料可能失去紀錄。可在每筆紀錄內編輯或刪除量測資料。</Copy></Card>
    <Button label={advanced ? '收合開發者設定' : '開發者設定'} secondary onPress={() => setAdvanced(!advanced)} />
    {advanced && <Card><Copy title>API 連線設定</Copy><Copy muted>供開發測試使用；測試連線只會向指定網址發出健康檢查請求。</Copy>
      <Field accessibilityLabel="API 伺服器網址" value={url} onChangeText={setUrl} autoCapitalize="none" keyboardType="url" />
      <Button label="儲存網址" onPress={save} /><Button label={testing ? '測試中…' : '測試連線'} secondary disabled={testing} onPress={test} />
      {!!message && <Copy>{message}</Copy>}
    </Card>}
    <Copy muted>BowelSound 1.0.0 · 串接準備版本</Copy>
  </Screen>;
}
