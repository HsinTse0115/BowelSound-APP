# context_module 需求規格

## 負責檔案
- `context/AppContext.tsx`

## 功能描述
建立 React Context，用於在整個 App 中跨頁面共享病患資料、腸音檢測紀錄以及系統設定參數。本模組會提供資料提供者 (Provider) 以及一個自訂的 Hook `useApp()`，並預載一組合理的臨床測試資料 (Mock Data)，以便在無後端連線的情況下完美展示 App 的所有功能。

## 輸入 / 輸出
- **輸入**：新增病患資料、新增採集紀錄、更新設定。
- **輸出**：全域的 `patients` 陣列、`records` 陣列、`settings` 物件，以及狀態修改函數。

## 相依模組
- 無

## 實作要求
1. **預載模擬資料**：
   - 預載 3 位病患（ID: P-1001, P-1002, P-1003）的病歷。
   - 預載 4 筆腸音採集紀錄，分布於不同病患中，包含不同的錄音時間、AI 診斷結果（正常、亢進、減弱），以及包含 50 個點的模擬波形數組、10x10 的模擬頻譜圖數組。
2. **新增病患與紀錄生成邏輯**：
   - `addPatient`：自動生成遞增的 ID（例如 `P-1004`），時間設定為目前 ISO 時間，並將新增的病患加入 state 中。
   - `addRecord`：傳入 `patientId` 與錄音時長後，自動隨達隨機生成一筆採集紀錄（ID: `R-XXXX`）。其 AI 結果隨機設定狀態為（正常/亢進/減弱），信心度在 0.8 至 0.98 之間，隨機生成 50 個 [-1.0, 1.0] 的浮點數作為時域波形 mock data，以及 10x10 的二維陣列（數值 0-255）作為頻譜 mock data。
3. **系統設定儲存**：
   - `updateSettings`：支援局部更新設定，預設 API 伺服器網址為 `http://localhost:8000`，預設錄音時長為 10 秒，預設硬體連線狀態為 `false`。

## 測試要求

### 測試工具
- 使用 Jest 或 React Native Testing Library。若無測試框架，可使用前端 UI 元件印出 Log 或自訂斷言函數來驗證。

### 測試情境

#### 測試情境 1：初始資料載入驗證
- **輸入**：初始化 `AppProvider`
- **預期輸出**：`patients` 陣列長度等於 3，`records` 陣列長度等於 4，且各資料欄位符合 TypeScript 介面規範。
- **允許偏差**：無

#### 測試情境 2：新增病患功能
- **輸入**：呼叫 `addPatient({ name: '張三', age: 45, gender: 'M', note: '無異常' })`
- **預期輸出**：
  - `patients` 陣列長度變為 4
  - 最新新增的病患 ID 為 `P-1004`
  - 其建立時間 `createdAt` 為有效的 ISO 時間戳記。
- **允許偏差**：無

#### 測試情境 3：新增檢測紀錄與 AI 結果自動生成
- **輸入**：呼叫 `addRecord('P-1001', 10)`
- **預期輸出**：
  - `records` 陣列長度變為 5。
  - 新增紀錄的 `patientId` 等於 `'P-1001'`。
  - 新增紀錄的 `aiResult.waveformMockData` 長度為 50，且每個值介於 [-1.0, 1.0] 之間。
  - 新增紀錄的 `aiResult.spectrogramMockData` 為 10x10 的二維數組，所有元素介於 [0, 255] 之間。
- **允許偏差**：無

#### 測試情境 4：系統設定更新功能
- **輸入**：呼叫 `updateSettings({ defaultDuration: 30, hardwareConnected: true })`
- **預期輸出**：
  - `settings.defaultDuration` 變為 30。
  - `settings.hardwareConnected` 變為 `true`。
  - 未修改的 `apiUrl` 保持原預設值。
- **允許偏差**：無

## 禁止事項
- 嚴禁使用持久化本地存儲（如 AsyncStorage）在未經用戶設定的情況下寫死不可修改的快取。
- 規格有任何不清楚之處，停止開發並回報主控台。
