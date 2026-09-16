import React from 'react';
import { usePathname, useRouter } from 'expo-router';
import { Screen, Card, Copy, Button, DemoNotice } from '@/components/consumer-ui';

export default function EducationScreen() {
  const router = useRouter();
  const pathname = usePathname();
  return <Screen title="知識與使用說明" back={pathname === '/education'}>
    <DemoNotice />
    <Card><Copy title>不知道怎麼開始？</Copy><Copy>從建立本人資料、啟用展示裝置到查看結果，跟著四個步驟體驗。</Copy><Button label="查看操作教學" onPress={() => router.push('/guide')} /></Card>
    <Card><Copy title>我需要準備感測器嗎？</Copy><Copy>目前是展示版本，不需要實際設備或麥克風權限。真實設備的放置位置、姿勢與量測時間，需依該設備經驗證的操作說明。</Copy></Card>
    <Card><Copy title>結果與圖表代表什麼？</Copy><Copy>目前波形、頻譜、分類和信心數值都是模擬資料。它們只能用來了解畫面，不是你的健康檢查結果。</Copy></Card>
    <Card><Copy title>怎麼讓紀錄更容易回顧？</Copy><Copy>每次確認量測對象，填寫飯後時間與當時症狀。忘了填可以留空，也能在結果頁補充備註；「未填寫」與「無症狀」會分開保存。</Copy></Card>
    <Card><Copy title>填錯或不想保留，怎麼辦？</Copy><Copy>到「紀錄」選取一筆資料，使用「編輯狀態與備註」修正。刪除前會再次確認；刪除後無法復原。</Copy></Card>
    <Card><Copy title>關於健康與飲食內容</Copy><Copy>本版本先提供操作說明。醫療與飲食衛教將在完成專業審閱、補上來源與更新日期後提供。</Copy></Card>
  </Screen>;
}
