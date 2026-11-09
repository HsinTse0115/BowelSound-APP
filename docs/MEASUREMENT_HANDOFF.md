# 量測串接交接（2026-10-22）

本文件取代舊文件中「隨機分析、模擬連線、固定環境音量」的描述。
這次完成的是前端流程與可測試的串接介面；沒有實作硬體通訊、HTTP 音訊上傳、登入或後端服務。

## 後端與硬體接入點

實作 `services/measurement-adapter.ts` 的 `getMeasurementAdapter(baseUrl)`。
回傳型別在 `services/measurement.ts`：

- `available`：實際裝置與服務準備好才為 true；不能只用 health check 成功判斷。
- `capture({maxSeconds:20, signal, onSeconds})`：回傳真實音訊 URI、MIME type、實際秒數（>0 且 <=20）。可選的 decibelLevel 必須實測，不得填入固定值。取消或逾時必須關閉硬體收音。
- `upload(audio, input, requestId, signal)`：上傳真實音訊，回傳分析狀態。伺服器必須以 requestId 去重；同一使用者及同一 requestId 重試必須回傳原工作或原結果。
- `poll(jobId, signal)`：查詢既有工作，不得建立新工作。

端點、認證、音訊編碼/取樣率/位元深度、硬體傳輸方式及本人/家人 ID 映射需與後端確認後實作，不在前端任意猜測。UI 中的 ID 目前仍是本機 ID。

## 分析回應介面

`JobReply` 是前端內部統一格式，不是已存在的 HTTP API：

| status | 內容／行為 |
|---|---|
| processing | jobId；顯示「分析中」，每 2 秒查詢 |
| completed | result；驗證 ID、對象、實際秒數、日期、分類與數值後才建立本機紀錄 |
| insufficient_audio | 顯示收音不足，要求重新量測，不產生正常／異常結果 |
| failed | 伺服器已結束但未成功；顯示分析失敗，重新量測 |

result：`id, patientId, duration, createdAt, aiResult`。
aiResult：`status: normal|hyperactive|hypoactive|not_detected`, `frequency: number|null`, `confidence: number|null`, `notes: string`, `waveform: number[]`, `spectrogram: number[][]`。

| status | 顯示文字 |
|---|---|
| normal | 正常腸音 |
| hyperactive | 腸音亢進 |
| hypoactive | 腸音減弱 |
| not_detected | 本次未偵測到腸音 |

`not_detected` 僅描述本次有效收音期間的偵測結果，不代表臨床腸音消失或腸道無蠕動。收音品質不足、分析失敗、尚未分析須維持獨立狀態，不可轉成此值。模型須支援四分類並由後端回傳；前端不以頻率自行推論。新分析不接受舊的 `abnormal`，也不猜測其對應四類中的哪一類。

本次只恢復四分類契約及結果標籤，保留遠端新增的人員、日誌、量測紀錄 API 操作與未分析畫面。歷史紀錄的 `fromBackendRecord` 目前仍未載入 `aiResult`，後續須依後端正式結果介面串接，才能在重新載入的歷史紀錄中顯示分析。
無頻率或信心值必須用 null；無圖表用空陣列。波形為 [-1,1]，頻譜為 [0,255]。這是顯示格式，串接層負責將真實服務資料轉換為此格式。頻率單位為次／分，20 秒觀測如何估計由模型端決定。

## 等待與錯誤

- 上傳顯示等待動畫，不製造虛假的百分比。
- 單次網路操作 30 秒逾時；收音工作 25 秒逾時（目標收音上限仍是 20 秒）。
- 分析最多自動查詢 60 次，之後顯示「重試」以續查原工作；不是判為異常。
- 網路失敗或格式錯誤：同頁可重試。上傳前保留音訊及 requestId；取得 jobId 後只查詢原工作。
- 取消／離開前景：中止本機等待及收音；不代表伺服器刪除或取消已接收工作。丟棄遲到回應。
- 目前重試工作只存在記憶體；離開量測頁或重新開啟 App 後無法續查。跨啟動恢復、遠端取消與工作清單是後續串接項目。
- 完成後顯示波形、分析結果、填寫狀態。沒有波形顯示「尚未收到波形資料」。

## 儲存與舊資料

- 不再預載示範人物及紀錄，不再隨機產生波形、頻譜、分類或診斷文案。
- 新量測紀錄寫入 `@bowelsound_records_live_v1`。舊 `@bowelsound_records` 保留原樣，不讀入正式列表，舊紀錄的備註也仍在此儲存區。
- 所有欄位都與原始預載資料完全一致的示範人物從列表隱藏前，原人物列表備份至 `@bowelsound_patients_before_live_v1`；自行新增人物保留。
- 每日紀錄、排便提醒資料保留原儲存區。隱藏的示範人物所屬每日紀錄不會刪除，但需恢復該人物才能查看。
- 個人資料、每日紀錄、量測結果編輯／刪除仍僅在本機，尚未與伺服器同步。
- 原有模擬連線設定不再使用。API 預設留空，不再預填 localhost。

## 驗證

`npm test` 包含成功、未串接、重試去重鍵、工作續查、品質不足、分析失敗、錯誤格式、逾時、取消、遲到回應、重複開始；測試使用注入的測試 adapter，產品預設不會產生假資料。


## 前端交接補充：連線、未填寫與離開確認

- 所有現有 HTTP 呼叫集中在 services/api.ts。一般請求 10 秒、連線測試 5 秒、音檔上傳測試 30 秒；JSON 回應讀取也受逾時限制。HTTP 錯誤顯示一般使用者提示，不直接顯示 SQL、堆疊或伺服器 detail。
- 寫入逾時或斷線不代表伺服器沒有成功，前端不自動重送；提示重新載入確認。後端仍應實作量測 requestId 冪等處理。
- 儲存 API 網址（含同一網址再次儲存）或 reloadData()，會重新載入 GET /api/patients、GET /api/records、GET /api/daily。前端清除舊連線資料、取消舊讀取，忽略舊連線的延遲寫入回應；不能撤銷已被舊伺服器接受的寫入。
- 連線網址直接取自 AppContext，日誌不再另外讀取 AsyncStorage 的舊設定；沒有設定時不會偷偷連到 127.0.0.1。手機請使用電腦可連線的區網 IP 或正式服務網址。
- **後端必須支援 nullable has_caffeine**：JSON PATCH 的 null = 未填寫、false = 沒有、true = 有。GET /api/records 也須回傳同樣語意，資料庫欄位不得以 false 取代 null。前端可讀取舊資料缺少欄位為未填寫，但不會還原已經被舊後端寫成 false 的歷史語意。
- 音檔上傳測試的 multipart has_caffeine 明確送字串 null / false / true；後端請解析這三值（null 不是一般布林值），不得把 null 預設為 false。尚未配合的後端可能回覆 422，前端會保留輸入並顯示失敗。
- symptoms: [] = 未填寫、['無症狀'] = 明確沒有症狀；bowel: '未填寫' 與 '今天沒有' 不同。三天排便提醒仍只計入明確填寫沒有排便的日子。
- 量測紀錄、每日紀錄與個人資料表單使用離開確認；取消編輯／切換個人編輯表單亦會提示。儲存中暫停離開及更改欄位；儲存失敗保留內容。網頁重新整理／關閉另由瀏覽器標準提示處理。
- 硬體與正式分析 adapter 仍由後端／硬體團隊串接；本次沒有產生模擬分析結果。
