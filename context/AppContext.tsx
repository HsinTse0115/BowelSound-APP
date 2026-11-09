import React, { createContext, useContext, useState, useRef, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { keepUserPatients } from '../services/legacy-data';
import { ApiError, apiJson, errorMessage } from '../services/api';
import type { AnalysisResult, MeasurementResult, MeasurementInput } from '../services/measurement';

const STORAGE_KEYS = {
  patients: '@bowelsound_patients',
  records: '@bowelsound_records_live_v1',
  settings: '@bowelsound_settings',
} as const;

/**
 * 病患資料介面
 */
export interface Patient {
  /** 病患識別碼 (例如: P-1001) */
  id: string;
  /** 姓名 */
  name: string;
  /** 年齡 */
  age: number;
  /** 性別 */
  gender: 'M' | 'F';
  /** 受測者身分類型；一般受測者不需要病床或臨床備註 */
  subjectType?: 'participant' | 'patient';
  /** 病床號碼 */
  bedNumber?: string;
  /** 臨床備註 */
  note?: string;
  /** 建立時間 (ISO 8601 格式字串) */
  createdAt: string;
}

/**
 * 腸音採集紀錄介面
 */
export interface BowelRecord {
  note?: string;
  /** 紀錄識別碼 (例如: R-2001) */
  id: string;
  /** 關聯的病患 ID */
  patientId: string;
  /** 錄音時長 (秒) */
  duration: number;
  /** 錄音前是否攝取咖啡因/茶 */
  hasCaffeine?: boolean;
  /** 當前腸胃症狀 */
  symptoms?: string[];
  /** 飯後時間 */
  mealTime?: string;
  /** 採集時環境音量 (分貝) */
  decibelLevel?: number;
  /** 採集時間 (ISO 8601 格式字串) */
  createdAt: string;
  /** Validated backend result; never generated on device. */
  aiResult?: AnalysisResult;
}

/**
 * 系統設定介面
 */
export interface AppSettings {
  primaryPatientId?: string;
  onboardingCompleted?: boolean;
  /** API 伺服器網址 */
  apiUrl: string;
  /** 預設錄音時長 (秒) */
  defaultDuration: number;
  /** 使用者選擇的介面主題 */
  themeMode: 'light' | 'dark';
}

/**
 * AppContext 提供的 API 與狀態型別定義
 */
export interface AppContextType {
  ready: boolean;
  connectionVersion: number;
  isCurrentConnection: (version: number) => boolean;
  reloadData: () => void;
  storageError: string | null;
  updateRecord: (id: string, changes: Pick<BowelRecord, 'symptoms' | 'mealTime' | 'hasCaffeine'>) => Promise<void>;
  deleteRecord: (id: string) => Promise<{ audioDeleted: boolean }>;
  /** 病患列表 */
  patients: Patient[];
  /** 腸音紀錄列表 */
  records: BowelRecord[];
  /** 系統設定 */
  settings: AppSettings;
  /** 新增病患 */
  addPatient: (patient: Omit<Patient, 'id' | 'createdAt'>) => Promise<Patient>;
  /** 修改病患，成功後同步前端列表 */
  updatePatient: (id: string, changes: Pick<Patient, 'name' | 'age' | 'gender'>) => Promise<Patient>;
  /** 刪除沒有歷史紀錄的病患 */
  deletePatient: (id: string) => Promise<void>;
  /** 新增腸音紀錄，並回傳新增的紀錄物件 */
  addRecord: (result: MeasurementResult, input: MeasurementInput) => BowelRecord;
  /** 更新系統設定 (支援局部更新) */
  updateSettings: (settings: Partial<AppSettings>) => void;
}


/** FastAPI 回傳的欄位名稱與前端不同，在此統一轉換。 */
type BackendPatient = {
  patient_id: string;
  name: string;
  age: number;
  gender: 'M' | 'F';
  bedNumber: string | null;
  note: string | null;
  created_at: string;
};

const fromBackendPatient = (item: BackendPatient): Patient => {
  if (!item || typeof item.patient_id !== 'string' || !item.patient_id || typeof item.name !== 'string' || !Number.isFinite(item.age) || !['M', 'F'].includes(item.gender)) throw new ApiError('人員資料格式不正確，請重新載入確認。');
  return ({
  id: item.patient_id,
  name: item.name,
  age: item.age,
  gender: item.gender,
  subjectType: 'participant',
  bedNumber: item.bedNumber ?? undefined,
  note: item.note ?? undefined,
  createdAt: item.created_at,
}); };

/** 後端歷史紀錄資料，尚未分析時不會有 aiResult。 */
type BackendRecord = {
  record_id: string;
  patient_id: string;
  duration: number;
  has_caffeine: boolean | null;
  symptoms: string[] | null;
  meal_time: string | null;
  decibel_level: number | null;
  audio_file_path: string | null;
  created_at: string;
};

const fromBackendRecord = (r: BackendRecord): BowelRecord => {
  if (!r || typeof r.record_id !== 'string' || !r.record_id || typeof r.patient_id !== 'string' || !Number.isFinite(r.duration) || (r.has_caffeine != null && typeof r.has_caffeine !== 'boolean') || (r.symptoms != null && (!Array.isArray(r.symptoms) || !r.symptoms.every(s => typeof s === 'string')))) throw new ApiError('量測紀錄格式不正確，請重新載入確認。');
  return ({
  id: r.record_id,
  patientId: r.patient_id,
  duration: r.duration,
  hasCaffeine: typeof r.has_caffeine === 'boolean' ? r.has_caffeine : undefined,
  symptoms: r.symptoms ?? [],
  mealTime: r.meal_time ?? undefined,
  decibelLevel: r.decibel_level ?? undefined,
  createdAt: r.created_at,
  // 尚未取得 AI 分析結果，不虛構分類。
}); };

// 建立 React Context
const AppContext = createContext<AppContextType | undefined>(undefined);

/**
 * AppProvider 元件：包覆在應用程式最外層，提供全域狀態
 */
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [connectionVersion, setConnectionVersion] = useState(0);
  const connection = useRef(0);
  const loadedConnection = useRef(-1);
  const isCurrentConnection = React.useCallback((version: number) => connection.current === version, []);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [records, setRecords] = useState<BowelRecord[]>([]);

  // 系統設定預設狀態
  const [settings, setSettings] = useState<AppSettings>({
    apiUrl: '',
    defaultDuration: 20,
    themeMode: 'light',
  });

  const hasHydratedRef = useRef(false);

  // 在 App 啟動時載入病患、紀錄、設定與個人資料
  useEffect(() => {
    const hydrate = async () => {
      try {
        const [storedPatients, , storedSettings] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.patients),
          AsyncStorage.getItem(STORAGE_KEYS.records),
          AsyncStorage.getItem(STORAGE_KEYS.settings),
        ]);

        if (storedPatients) {
          const parsedPatients: Patient[] = JSON.parse(storedPatients);
          if (Array.isArray(parsedPatients)) {
            // Preserve the original list before hiding untouched starter profiles.
            const kept = keepUserPatients(parsedPatients);
            if (kept.length !== parsedPatients.length && !(await AsyncStorage.getItem('@bowelsound_patients_before_live_v1'))) {
              await AsyncStorage.setItem('@bowelsound_patients_before_live_v1', storedPatients);
            }
            // 舊病患資料保留於 AsyncStorage 作備份，不自動上傳以免產生重複紀錄。
            void kept;
          }
        }
        // 舊本機量測紀錄保留在 AsyncStorage 作備份；正式列表以 MySQL 為準。
        if (storedSettings) {
          const parsedSettings: Partial<AppSettings> & { hardwareConnected?: boolean } = JSON.parse(storedSettings);
          delete parsedSettings.hardwareConnected;
          setSettings(current => ({ ...current, ...parsedSettings, defaultDuration: 20 }));
        }
        hasHydratedRef.current = true;
      } catch (e) {
        setStorageError('無法讀取本機資料。請重新開啟 APP，避免覆蓋尚未載入的紀錄。');
        console.error('載入本機資料失敗', e);
      } finally {
        setReady(hasHydratedRef.current);
      }
    };
    hydrate();
  }, []);

  useEffect(() => {
    if (!ready) return;
    const controller = new AbortController();
    const current = () => !controller.signal.aborted && isCurrentConnection(connectionVersion);
    const load = async () => {
      const results = await Promise.allSettled([
        apiJson<BackendPatient[]>(settings.apiUrl, '/api/patients', { signal: controller.signal }).then(data => { if (!Array.isArray(data)) throw new ApiError('人員資料格式不正確。'); return data.map(fromBackendPatient); }),
        apiJson<BackendRecord[]>(settings.apiUrl, '/api/records', { signal: controller.signal }).then(data => { if (!Array.isArray(data)) throw new ApiError('量測紀錄格式不正確。'); return data.map(fromBackendRecord); }),
      ]);
      if (!current()) return;
      loadedConnection.current = connectionVersion;
      const errors: string[] = [];
      const [people, history] = results;
      if (people.status === 'fulfilled' && Array.isArray(people.value)) setPatients(people.value);
      else errors.push('人員資料：' + (people.status === 'rejected' ? errorMessage(people.reason) : '資料格式不正確。'));
      if (history.status === 'fulfilled' && Array.isArray(history.value)) setRecords(history.value);
      else errors.push('量測紀錄：' + (history.status === 'rejected' ? errorMessage(history.reason) : '資料格式不正確。'));
      setLoadError(errors.join('\n') || null);
    };
    void load();
    return () => controller.abort();
  }, [ready, settings.apiUrl, connectionVersion, isCurrentConnection]);

  // A response from a previous connection must never update the new server's data.
  const remote = async <T,>(path: string, init: RequestInit): Promise<T> => {
    const version = connectionVersion;
    if (!isCurrentConnection(version)) throw new Error('連線設定已變更，請重新載入後再試。');
    if (loadedConnection.current !== version) throw new ApiError('資料正在重新載入，請稍候再試。');
    const result = await apiJson<T>(settings.apiUrl, path, init);
    if (!isCurrentConnection(version)) throw new Error('連線設定已變更，請至原連線確認剛才操作的結果。');
    return result;
  };

  useEffect(() => {
    if (!hasHydratedRef.current) return;
    AsyncStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings)).catch(error =>
      { setStorageError('設定尚未成功寫入裝置，請勿關閉 APP。請確認裝置儲存空間。'); console.error('儲存設定失敗', error); }
    );
  }, [settings, ready]);

  /** 由 FastAPI 新增病患，確認 MySQL 寫入成功後才更新畫面。 */
  const addPatient = async (patient: Omit<Patient, 'id' | 'createdAt'>): Promise<Patient> => {
    const data = await remote<BackendPatient>(`/api/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
        bedNumber: patient.bedNumber || null,
        note: patient.note || null,
      }),
    });
    const created = fromBackendPatient(data);
    setPatients(prev => [...prev.filter(item => item.id !== created.id), created]);
    return created;
  };

  /** 病患 PATCH 成功後才更新列表。 */
  const updatePatient = async (id: string, changes: Pick<Patient, 'name' | 'age' | 'gender'>): Promise<Patient> => {
    const data = await remote<BackendPatient>(`/api/patients/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: changes.name.trim(), age: changes.age, gender: changes.gender }),
    });
    if (data.patient_id !== id) throw new Error('伺服器回傳的病患編號不一致');
    const updated = fromBackendPatient(data);
    setPatients(prev => prev.map(p => p.id === id ? updated : p));
    return updated;
  };

  /** 後端拒絕刪除有量測紀錄的病患（409）。 */
  const deletePatient = async (id: string): Promise<void> => {
    const data = await remote<{ patient_id: string }>(`/api/patients/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (data.patient_id !== id) throw new Error('伺服器回傳的病患編號不一致');
    setPatients(prev => prev.filter(p => p.id !== id));
    if (settings.primaryPatientId === id) updateSettings({ primaryPatientId: undefined });
  };

  /** Save only a completed, validated backend result; retries update the same ID. */
  const addRecord = (result: MeasurementResult, input: MeasurementInput): BowelRecord => {
    if (!isCurrentConnection(connectionVersion)) throw new ApiError('連線設定已變更，請至原連線確認量測結果。');
    const record: BowelRecord = { ...input, ...result };
    setRecords(prev => [...prev.filter(item => item.id !== record.id), record]);
    return record;
  };

  /**
   * 更新系統設定 (支援局部更新)
   */
  const reloadData = () => {
    loadedConnection.current = -1;
    connection.current += 1;
    setConnectionVersion(connection.current);
    setPatients([]);
    setRecords([]);
    setLoadError(null);
  };
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    if (Object.prototype.hasOwnProperty.call(newSettings, 'apiUrl')) reloadData();
    setSettings(prev => ({
      ...prev,
      ...newSettings,
    }));
  };

  /** 只有 FastAPI 確認更新成功，才同步更新前端列表。 */
  const updateRecord = async (id: string, changes: Pick<BowelRecord, 'symptoms' | 'mealTime' | 'hasCaffeine'>): Promise<void> => {
    const updated = await remote<BackendRecord>(`/api/records/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symptoms: changes.symptoms ?? [],
        meal_time: changes.mealTime ?? null,
        has_caffeine: changes.hasCaffeine ?? null,
      }),
    });
    if (typeof updated.has_caffeine === 'boolean' && changes.hasCaffeine === undefined) throw new ApiError('服務尚未保留「未填寫」狀態，請聯絡管理人員確認，這次修改尚未確認完成。');
    if (updated.record_id !== id) throw new Error('伺服器回傳的紀錄編號不一致');
    setRecords(previous => previous.map(item => item.id === id
      ? { ...item, ...fromBackendRecord(updated), aiResult: item.aiResult, note: item.note }
      : item));
  };

  /** DELETE 成功後才移除前端紀錄，回報實體音檔是否清理成功。 */
  const deleteRecord = async (id: string): Promise<{ audioDeleted: boolean }> => {
    const result = await remote<{ record_id: string; audio_deleted: boolean }>(`/api/records/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (result.record_id !== id) throw new Error('伺服器回傳的紀錄編號不一致，請重新整理確認');
    setRecords(previous => previous.filter(item => item.id !== id));
    return { audioDeleted: result.audio_deleted === true };
  };

  return (
    <AppContext.Provider value={{ patients, records, settings, ready, storageError: storageError || loadError, connectionVersion, isCurrentConnection, reloadData, addPatient, updatePatient, deletePatient, addRecord, updateSettings,
      updateRecord,
      deleteRecord,
    }}>
      {children}
    </AppContext.Provider>
  );
};

/**
 * 自訂 Hook useApp：方便子元件存取 AppContext
 */
export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
