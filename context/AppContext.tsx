import React, { createContext, useContext, useState, useRef, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  /** AI 診斷結果 (模擬數據) */
  aiResult: {
    /** 腸鳴音頻率 (次/分鐘) */
    frequency: number;
    /** 腸音分類狀態 (normal: 正常 / hyper: 亢進 / hypo: 減弱) */
    status: 'normal' | 'hyper' | 'hypo';
    /** AI 信心度 (0 ~ 1) */
    confidence: number;
    /** 臨床提示與分析摘要 */
    notes: string;
    /** 模擬音訊波形序列 (時域, 共 50 個點, 數值在 -1.0 至 1.0 之間) */
    waveformMockData: number[];
    /** 模擬頻譜圖矩陣 (頻域, 10x10 二維陣列, 數值在 0 至 255 之間) */
    spectrogramMockData: number[][];
  };
}

/**
 * 系統設定介面
 */
export interface AppSettings {
  /** API 伺服器網址 */
  apiUrl: string;
  /** 預設錄音時長 (秒) */
  defaultDuration: number;
  /** 藍牙/感測硬體連線模擬狀態 */
  hardwareConnected: boolean;
}

/**
 * 受試者個人資料介面
 */
export interface UserProfile {
  /** 受試者代號 / 暱稱 */
  name: string;
  /** 年齡 */
  age: string;
  /** 性別 */
  gender: 'M' | 'F' | '';
  /** 身高 (cm) */
  height: string;
  /** 體重 (kg) */
  weight: string;
  /** 病史與用藥 */
  selectedMeds: string[];
}

/**
 * AppContext 提供的 API 與狀態型別定義
 */
export interface AppContextType {
  /** 病患列表 */
  patients: Patient[];
  /** 腸音紀錄列表 */
  records: BowelRecord[];
  /** 系統設定 */
  settings: AppSettings;
  /** 受試者個人資料 */
  userProfile: UserProfile | null;
  /** 新增病患 */
  addPatient: (patient: Omit<Patient, 'id' | 'createdAt'>) => void;
  /** 新增腸音紀錄，並回傳新增的紀錄物件 */
  addRecord: (patientId: string, duration: number, hasCaffeine: boolean, symptoms: string[], mealTime: string, decibelLevel: number) => BowelRecord;
  /** 更新系統設定 (支援局部更新) */
  updateSettings: (settings: Partial<AppSettings>) => void;
  /** 儲存/更新受試者個人資料 */
  saveUserProfile: (profile: UserProfile) => Promise<void>;
}

/**
 * 產生指定長度的模擬時域波形數據 (數值介於 [-1.0, 1.0])
 * @param points 數據點數量，預設為 50
 */
export function generateWaveformMockData(points: number = 50): number[] {
  const data: number[] = [];
  for (let i = 0; i < points; i++) {
    // 使用正弦波與隨機雜訊模擬腸音起伏
    const val = Math.sin(i * 0.4) * 0.6 + (Math.random() * 2 - 1) * 0.35;
    data.push(Math.max(-1.0, Math.min(1.0, val)));
  }
  return data;
}

/**
 * 產生指定大小的二維模擬頻譜圖數據 (數值介於 [0, 255])
 * @param rows 矩陣列數，預設為 10
 * @param cols 矩陣欄數，預設為 10
 */
export function generateSpectrogramMockData(rows: number = 10, cols: number = 10): number[][] {
  const data: number[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: number[] = [];
    for (let c = 0; c < cols; c++) {
      // 使用三角函數模擬頻譜能量分佈，並加上些許隨機雜訊
      const baseVal = (Math.sin(r * 0.3) * Math.cos(c * 0.3) + 1) * 110;
      const noise = Math.random() * 35;
      const val = Math.floor(baseVal + noise);
      row.push(Math.max(0, Math.min(255, val)));
    }
    data.push(row);
  }
  return data;
}

// 建立 React Context
const AppContext = createContext<AppContextType | undefined>(undefined);

/**
 * AppProvider 元件：包覆在應用程式最外層，提供全域狀態
 */
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 預載 3 位病患的模擬資料 (ID: P-1001, P-1002, P-1003)
  const [patients, setPatients] = useState<Patient[]>([
    {
      id: 'P-1001',
      name: '王小明',
      age: 28,
      gender: 'M',
      bedNumber: '302-1',
      note: '例行性健康檢查，無特殊腸胃症狀。',
      createdAt: '2026-05-30T10:00:00Z',
    },
    {
      id: 'P-1002',
      name: '李美玲',
      age: 45,
      gender: 'F',
      bedNumber: '302-2',
      note: '主訴近日腹脹與消化不良。',
      createdAt: '2026-05-30T11:30:00Z',
    },
    {
      id: 'P-1003',
      name: '張家豪',
      age: 62,
      gender: 'M',
      bedNumber: '305-1',
      note: '手術後腸道功能恢復監測。',
      createdAt: '2026-05-30T14:15:00Z',
    },
  ]);

  // 預載 4 筆腸音採集紀錄，分布於不同病患中
  const [records, setRecords] = useState<BowelRecord[]>([
    {
      id: 'R-2001',
      patientId: 'P-1001',
      duration: 10,
      hasCaffeine: false,
      symptoms: ['無症狀'],
      mealTime: '空腹',
      decibelLevel: 35,
      createdAt: '2026-05-30T10:05:00Z',
      aiResult: {
        frequency: 6,
        status: 'normal',
        confidence: 0.95,
        notes: '腸鳴音頻率正常 (約 6 次/分)，波形起伏規律。',
        waveformMockData: generateWaveformMockData(50),
        spectrogramMockData: generateSpectrogramMockData(10, 10),
      },
    },
    {
      id: 'R-2002',
      patientId: 'P-1002',
      duration: 30,
      hasCaffeine: true,
      symptoms: ['脹氣'],
      mealTime: '飯後 1 小時內',
      decibelLevel: 42,
      createdAt: '2026-05-30T11:40:00Z',
      aiResult: {
        frequency: 15,
        status: 'hyper',
        confidence: 0.88,
        notes: '腸鳴音慢速亢進 (約 15 次/分)，可能與消化不良或輕微腸胃發炎相關。',
        waveformMockData: generateWaveformMockData(50),
        spectrogramMockData: generateSpectrogramMockData(10, 10),
      },
    },
    {
      id: 'R-2003',
      patientId: 'P-1003',
      duration: 60,
      createdAt: '2026-05-30T14:30:00Z',
      aiResult: {
        frequency: 2,
        status: 'hypo',
        confidence: 0.91,
        notes: '腸鳴音減弱 (約 2 次/分)，術後正常蠕動恢復中，建議持續追蹤。',
        waveformMockData: generateWaveformMockData(50),
        spectrogramMockData: generateSpectrogramMockData(10, 10),
      },
    },
    {
      id: 'R-2004',
      patientId: 'P-1001',
      duration: 10,
      createdAt: '2026-05-31T02:00:00Z',
      aiResult: {
        frequency: 5,
        status: 'normal',
        confidence: 0.96,
        notes: '複查腸鳴音正常 (約 5 次/分)，狀態穩定。',
        waveformMockData: generateWaveformMockData(50),
        spectrogramMockData: generateSpectrogramMockData(10, 10),
      },
    },
  ]);

  // 系統設定預設狀態
  const [settings, setSettings] = useState<AppSettings>({
    apiUrl: 'http://localhost:8000',
    defaultDuration: 10,
    hardwareConnected: false,
  });

  // 受試者個人資料狀態
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // 在 App 啟動時自 AsyncStorage 載入個人資料
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const stored = await AsyncStorage.getItem('@bowelsound_user_profile');
        if (stored) {
          setUserProfile(JSON.parse(stored));
        }
      } catch (e) {
        console.error('載入個人資料失敗', e);
      }
    };
    loadProfile();
  }, []);

  // 儲存/更新受試者資料至 AsyncStorage 的函數
  const saveUserProfile = async (profile: UserProfile) => {
    try {
      await AsyncStorage.setItem('@bowelsound_user_profile', JSON.stringify(profile));
      setUserProfile(profile);
    } catch (e) {
      console.error('儲存個人資料失敗', e);
      throw e;
    }
  };

  // 用 useRef 來紀錄下一個可用的 ID 序號，避免連續呼叫時 state 未同步導致 ID 重複
  const nextPatientIdRef = useRef<number>(1004);
  const nextRecordIdRef = useRef<number>(2005);

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
  };

  /**
   * 新增腸音紀錄，自動隨機/遞增生成 ID，並模擬 AI 診斷結果
   */
  const addRecord = (patientId: string, duration: number, hasCaffeine: boolean, symptoms: string[], mealTime: string, decibelLevel: number): BowelRecord => {
    const newId = `R-${nextRecordIdRef.current}`;
    nextRecordIdRef.current += 1;

    // 隨機決定 AI 腸音診斷狀態 ('normal' | 'hyper' | 'hypo')
    const statuses: ('normal' | 'hyper' | 'hypo')[] = ['normal', 'hyper', 'hypo'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    let frequency = 6;
    let notes = '';
    if (status === 'normal') {
      frequency = Math.floor(4 + Math.random() * 6); // 4-9 次/分鐘
      notes = `腸鳴音頻率正常 (約 ${frequency} 次/分)，腸胃活動良好。`;
    } else if (status === 'hyper') {
      frequency = Math.floor(10 + Math.random() * 9); // 10-18 次/分鐘
      notes = `腸鳴音慢速亢進 (約 ${frequency} 次/分)，可能與消化不良或輕微腸胃發炎相關。`;
    } else {
      frequency = Math.floor(1 + Math.random() * 3); // 1-3 次/分鐘
      notes = `腸鳴音慢速減弱 (約 ${frequency} 次/分)，需注意腸蠕動較慢情形。`;
    }

    // AI 信心度 (0.8 至 0.98 之間)
    const confidence = parseFloat((0.8 + Math.random() * 0.18).toFixed(4));

    const newRecord: BowelRecord = {
      id: newId,
      patientId,
      duration,
      hasCaffeine,
      symptoms,
      mealTime,
      decibelLevel,
      createdAt: new Date().toISOString(),
      aiResult: {
        frequency,
        status,
        confidence,
        notes,
        waveformMockData: generateWaveformMockData(50),
        spectrogramMockData: generateSpectrogramMockData(10, 10),
      },
    };

    setRecords(prev => [...prev, newRecord]);
    return newRecord;
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
    <AppContext.Provider value={{ patients, records, settings, userProfile, addPatient, addRecord, updateSettings, saveUserProfile }}>
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
