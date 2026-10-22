import React, { createContext, useContext, useState, useRef, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { editRecord, removeRecord } from '../services/record-utils';
import { keepUserPatients } from '../services/legacy-data';
import { validateResult } from '../services/measurement';
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
  aiResult: AnalysisResult;
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
  storageError: string | null;
  updateRecord: (id: string, changes: Pick<BowelRecord, 'note' | 'symptoms' | 'mealTime' | 'hasCaffeine'>) => void;
  deleteRecord: (id: string) => void;
  /** 病患列表 */
  patients: Patient[];
  /** 腸音紀錄列表 */
  records: BowelRecord[];
  /** 系統設定 */
  settings: AppSettings;
  /** 新增病患 */
  addPatient: (patient: Omit<Patient, 'id' | 'createdAt'>) => Patient;
  /** 新增腸音紀錄，並回傳新增的紀錄物件 */
  addRecord: (result: MeasurementResult, input: MeasurementInput) => BowelRecord;
  /** 更新系統設定 (支援局部更新) */
  updateSettings: (settings: Partial<AppSettings>) => void;
}

// 建立 React Context
const AppContext = createContext<AppContextType | undefined>(undefined);

/**
 * AppProvider 元件：包覆在應用程式最外層，提供全域狀態
 */
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [records, setRecords] = useState<BowelRecord[]>([]);

  // 系統設定預設狀態
  const [settings, setSettings] = useState<AppSettings>({
    apiUrl: '',
    defaultDuration: 20,
    themeMode: 'light',
  });

  // 紀錄下一個可用的 ID 序號，避免連續新增時產生重複 ID
  const nextPatientIdRef = useRef<number>(1004);
  const hasHydratedRef = useRef(false);

  // 在 App 啟動時載入病患、紀錄、設定與個人資料
  useEffect(() => {
    const hydrate = async () => {
      try {
        const [storedPatients, storedRecords, storedSettings] = await Promise.all([
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
            setPatients(kept);
            const maxId = Math.max(1003, ...parsedPatients.map(item => Number(item.id.replace('P-', '')) || 0));
            nextPatientIdRef.current = maxId + 1;
          }
        }
        if (storedRecords) {
          const parsedRecords: BowelRecord[] = JSON.parse(storedRecords);
          if (Array.isArray(parsedRecords)) {
            parsedRecords.forEach(record => validateResult(record,
              { patientId: record.patientId, symptoms: [], mealTime: '未填寫' },
              { uri: 'stored', mimeType: 'stored', duration: record.duration }));
            setRecords(parsedRecords);
          }
        }
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
    if (!hasHydratedRef.current) return;
    AsyncStorage.setItem(STORAGE_KEYS.patients, JSON.stringify(patients)).catch(error =>
      { setStorageError('資料尚未成功寫入裝置，請勿關閉 APP。請確認裝置儲存空間。'); console.error('儲存個人資料失敗', error); }
    );
  }, [patients, ready]);

  useEffect(() => {
    if (!hasHydratedRef.current) return;
    AsyncStorage.setItem(STORAGE_KEYS.records, JSON.stringify(records)).catch(error =>
      { setStorageError('紀錄尚未成功寫入裝置，請勿關閉 APP。請確認裝置儲存空間。'); console.error('儲存紀錄失敗', error); }
    );
  }, [records, ready]);

  useEffect(() => {
    if (!hasHydratedRef.current) return;
    AsyncStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings)).catch(error =>
      { setStorageError('設定尚未成功寫入裝置，請勿關閉 APP。請確認裝置儲存空間。'); console.error('儲存設定失敗', error); }
    );
  }, [settings, ready]);

  /**
   * 新增病患資訊，自動生成遞增 ID (如 P-1004) 與目前 ISO 時間
   */
  const addPatient = (patient: Omit<Patient, 'id' | 'createdAt'>) => {
    const newId = `P-${nextPatientIdRef.current}`;
    nextPatientIdRef.current += 1;

    const newPatient: Patient = {
      ...patient,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    
    setPatients(prev => [...prev, newPatient]);
    return newPatient;
  };

  /** Save only a completed, validated backend result; retries update the same ID. */
  const addRecord = (result: MeasurementResult, input: MeasurementInput): BowelRecord => {
    const record: BowelRecord = { ...input, ...result };
    setRecords(prev => [...prev.filter(item => item.id !== record.id), record]);
    return record;
  };

  /**
   * 更新系統設定 (支援局部更新)
   */
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings,
    }));
  };

  return (
    <AppContext.Provider value={{ patients, records, settings, ready, storageError, addPatient, addRecord, updateSettings,
      updateRecord: (id, changes) => setRecords(prev => editRecord(prev, id, changes)),
      deleteRecord: id => setRecords(prev => removeRecord(prev, id)),
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
