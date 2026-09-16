import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { Screen, Card, Copy, Button, Chip, Field, DemoNotice, ui } from '@/components/consumer-ui';
import { apiRequest, normalizeApiUrl } from '@/services/api';

export default function SettingsScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const { settings, patients, updateSettings } = useApp();
  const [advanced, setAdvanced] = useState(false);
  const [url, setUrl] = useState(settings.apiUrl);
  const [message, setMessage] = useState('');
  const [testing, setTesting] = useState(false);
  useEffect(() => setUrl(settings.apiUrl), [settings.apiUrl]);
  const person = patients.find(p => p.id === settings.primaryPatientId);
  const save = () => {
    try { const value = normalizeApiUrl(url); updateSettings({ apiUrl: value }); setUrl(value); setMessage('已儲存網址。'); }
    catch (error) { setMessage(error instanceof Error ? error.message : '請檢查網址格式。'); }
  };
  const test = async () => {
    setTesting(true); setMessage('');
    try { const response = await apiRequest(normalizeApiUrl(url), '/api/health', {}, 5000); if (!response.ok) throw new Error('伺服器回應 ' + response.status); setMessage('伺服器可連線。量測功能仍使用模擬資料。'); }
    catch (error) { setMessage(error instanceof Error ? error.message : '連線失敗，請稍後重試。'); }
    finally { setTesting(false); }
  };
  return <Screen title="我的" back={pathname === '/settings'}>
    <Card><Copy title>{person?.name || '還沒有設定本人'}</Copy><Copy muted>管理本人與家人的資料，選擇預設量測對象。</Copy>
      <Button label="本人與家人資料" secondary onPress={() => router.push('/patients')} />
      <Button label="操作教學" secondary onPress={() => router.push('/guide')} />
    </Card>
    <DemoNotice />
    <Card><Copy title>展示裝置</Copy><Copy>{settings.hardwareConnected ? '已啟用模擬連線' : '尚未啟用'}</Copy>
      <Button label={settings.hardwareConnected ? '停用展示裝置' : '啟用展示裝置'} secondary onPress={() => updateSettings({ hardwareConnected: !settings.hardwareConnected })} />
      <Copy muted>這個開關只控制展示狀態，不會搜尋或連接藍牙設備。</Copy>
    </Card>
    <Card><Copy title>預設展示時長</Copy><View style={ui.row}>{[10, 30, 60, 0].map(value => <Chip key={value} label={value ? value + ' 秒' : '不限時'} selected={settings.defaultDuration === value} onPress={() => updateSettings({ defaultDuration: value })} />)}</View></Card>
    <Card><Copy title>介面外觀</Copy><View style={ui.row}><Chip label="淺色" selected={settings.themeMode === 'light'} onPress={() => updateSettings({ themeMode: 'light' })} /><Chip label="深色" selected={settings.themeMode === 'dark'} onPress={() => updateSettings({ themeMode: 'dark' })} /></View></Card>
    <Card><Copy title>資料與隱私</Copy><Copy>目前個人資料與紀錄保存在這台裝置的 APP 儲存空間；網頁版則保存在此瀏覽器。量測流程不會上傳資料，也沒有雲端備份。</Copy><Copy muted>清除 APP／瀏覽器資料可能失去紀錄。可在每筆紀錄內編輯或刪除量測資料。</Copy></Card>
    <Button label={advanced ? '收合開發者設定' : '開發者設定'} secondary onPress={() => setAdvanced(!advanced)} />
    {advanced && <Card><Copy title>API 連線設定</Copy><Copy muted>供開發測試使用；測試連線只會向指定網址發出健康檢查請求。</Copy>
      <Field accessibilityLabel="API 伺服器網址" value={url} onChangeText={setUrl} autoCapitalize="none" keyboardType="url" />
      <Button label="儲存網址" onPress={save} /><Button label={testing ? '測試中…' : '測試連線'} secondary disabled={testing} onPress={test} />
      {!!message && <Copy>{message}</Copy>}
    </Card>}
    <Copy muted>BowelSound 1.0.0 · 展示版本</Copy>
  </Screen>;
}
