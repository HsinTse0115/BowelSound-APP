# 腸音檢測系統 - 詳細規格

## 模組清單
| 模組名稱 | 負責檔案 | 相依模組 | 執行順序 |
| :--- | :--- | :--- | :--- |
| **context_module** (全域狀態與資料共享) | `context/AppContext.tsx` | 無 | 第 1 批 |
| **patients_module** (病患管理頁面) | `app/patients.tsx`<br>`styles/patients.styles.ts` | `context_module` | 第 2 批 |
| **record_module** (即時採集功能優化) | `app/(tabs)/record.tsx`<br>`styles/record.styles.ts` | `context_module` | 第 2 批 |
| **analytics_module** (視覺化分析頁面) | `app/analytics.tsx`<br>`styles/analytics.styles.ts` | `context_module` | 第 2 批 |
| **settings_module** (系統設定頁面) | `app/settings.tsx`<br>`styles/settings.styles.ts` | `context_module` | 第 2 批 |

## 執行批次
- **第 1 批（基礎）**：`context_module` (建立核心資料結構與資料操作介面)
- **第 2 批（並行開發）**：`patients_module`、`record_module`、`analytics_module`、`settings_module` (各子頁面開發，皆相依於 context)

---

## 模組介面定義

### 1. context_module (`context/AppContext.tsx`)
提供全域狀態容器，管理病患資料、歷史採集紀錄與設定參數。

#### 主要資料結構

##### `Patient` (受測者資料，保留既有型別名稱以相容舊資料)
```typescript
interface Patient {
  id: string;        // 受測者識別碼 (例: P-1001)
  name: string;      // 姓名
  age: number;       // 年齡
  gender: 'M' | 'F'; // 性別
  subjectType?: 'participant' | 'patient'; // 一般受測者 / 病患
  note?: string;     // 臨床備註
  createdAt: string; // 建立時間
}
```

##### `BowelRecord` (腸音採集紀錄)
```typescript
interface BowelRecord {
  id: string;        // 紀錄識別碼 (例: R-2001)
  patientId: string; // 關聯的病患 ID
  duration: number;  // 錄音時長 (秒)
  createdAt: string; // 採集時間
  // AI 診斷結果 (模擬數據)
  aiResult: {
    frequency: number;                     // 腸鳴音頻率 (次/分鐘)
    status: 'normal' | 'abnormal';          // 正常 / 異常
    confidence: number;                    // AI 信心度 (0-1)
    notes: string;                         // 臨床提示與分析摘要
    waveformMockData: number[];            // 模擬音訊波形序列 (時域)
    spectrogramMockData: number[][];       // 模擬頻譜圖矩陣 (頻域)
  };
}
```

##### `AppSettings` (系統設定)
```typescript
interface AppSettings {
  apiUrl: string;             // API 伺服器網址
  defaultDuration: number;    // 預設錄音時長 (秒)
  hardwareConnected: boolean; // 藍牙/感測硬體連線模擬狀態
  themeMode: 'light' | 'dark'; // 使用者選擇的介面主題
}
```

#### Provider 提供之 API
- `patients`: `Patient[]`
- `records`: `BowelRecord[]`
- `settings`: `AppSettings`
- `addPatient(patient: Omit<Patient, 'id' | 'createdAt'>): void`
- `addRecord(patientId: string, duration: number, hasCaffeine: boolean, symptoms: string[], mealTime: string, decibelLevel: number): BowelRecord`
- `updateSettings(settings: Partial<AppSettings>): void`

---

### 2. patients_module
- **輸入**：從 `context_module` 獲取 `patients` 列表與 `records` 列表；`addPatient` 動作。
- **輸出**：呼叫 `addPatient` 新增病患資訊；點擊病患將其 ID 帶入詳情或在畫面上呈現該病患之歷史採集列表。

### 3. record_module
- **輸入**：從 `context_module` 獲取 `patients` 列表、`settings` 參數；`addRecord` 動作。
- **輸出**：選擇要綁定的病患，確認感測器已連線並完成環境檢查；採集結束後以完整生理與環境參數呼叫 `addRecord` 新增紀錄。

### 4. analytics_module
- **輸入**：從 `context_module` 獲取 `patients` 與 `records` 列表；若路由帶入 `recordId`，優先顯示該筆紀錄。
- **輸出**：透過 UI 選擇特定病患與特定採集紀錄，將其時域波形（繪製成 Canvas/SVG 或自訂折線圖）與頻譜圖（熱圖或網格）呈現。

### 5. settings_module
- **輸入**：從 `context_module` 獲取 `settings` 狀態與 `updateSettings` 動作。
- **輸出**：修改設定值並呼叫 `updateSettings` 更新全域狀態。
