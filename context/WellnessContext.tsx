import React, { createContext, PropsWithChildren, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DailyChanges, DailyEntry, parseEntries, upsertDay } from '@/services/wellness';

const LEGACY_KEY = '@bowelsound_wellness_v1';
const SETTINGS_KEY = '@bowelsound_settings';

interface WellnessState {
  entries: DailyEntry[];
  ready: boolean;
  busy: boolean;
  error: string;
  save: (patientId: string, date: string, changes: DailyChanges) => Promise<void>;
}

const Context = createContext<WellnessState | null>(null);

async function getApiBase(): Promise<string> {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  let configured = '';
  if (raw) {
    const settings = JSON.parse(raw) as { apiUrl?: string };
    configured = typeof settings.apiUrl === 'string' ? settings.apiUrl.trim() : '';
  }
  // 電腦瀏覽器測試用；手機 Expo Go 請在 APP 設定填寫電腦區網 IP。
  return (configured || 'http://127.0.0.1:8000').replace(/\/+$/, '');
}

function isDailyEntry(value: unknown): value is DailyEntry {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.patientId === 'string' && typeof v.date === 'string' &&
    typeof v.bowel === 'string' && typeof v.feeling === 'string' &&
    typeof v.note === 'string' && Array.isArray(v.habits) &&
    v.habits.every(h => typeof h === 'string') && typeof v.updatedAt === 'string';
}

async function apiError(response: Response): Promise<Error> {
  let detail = `HTTP ${response.status}`;
  try {
    const body: unknown = await response.json();
    if (body && typeof body === 'object' && 'detail' in body) {
      const message = (body as { detail: unknown }).detail;
      if (typeof message === 'string') detail = message;
    }
  } catch { /* 保留 HTTP 狀態碼 */ }
  return new Error(detail);
}

export function WellnessProvider({ children }: PropsWithChildren) {
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const current = useRef<DailyEntry[]>([]);
  const writing = useRef(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        // 舊版資料只讀取並驗證，不刪除、不覆寫，也不自動上傳以免重複。
        const legacyRaw = await AsyncStorage.getItem(LEGACY_KEY);
        parseEntries(legacyRaw);
        const base = await getApiBase();
        const response = await fetch(`${base}/api/daily`);
        if (!response.ok) throw await apiError(response);
        const data: unknown = await response.json();
        if (!Array.isArray(data) || !data.every(isDailyEntry)) {
          throw new Error('健康日誌 API 回傳格式不正確');
        }
        if (mounted) {
          current.current = data;
          setEntries(data);
          setError('');
          setReady(true);
        }
      } catch (cause) {
        if (mounted) {
          setError(`無法從 FastAPI 讀取健康日誌，原本的本機資料仍保留。${cause instanceof Error ? `（${cause.message}）` : ''}`);
          setReady(false); // 避免連線失敗時以空白資料進行編輯。
        }
      }
    };
    void load();
    return () => { mounted = false; };
  }, []);

  const save = async (patientId: string, date: string, changes: DailyChanges): Promise<void> => {
    if (!ready || writing.current) throw new Error('資料尚未載入或正在儲存，請稍後再試。');
    writing.current = true;
    setBusy(true);
    try {
      // 沿用原本的日期、選項、備註長度和習慣驗證。
      const next = upsertDay(current.current, patientId, date, changes);
      const updated = next.find(e => e.patientId === patientId && e.date === date);
      if (!updated) throw new Error('找不到待儲存的健康日誌');
      const base = await getApiBase();
      const response = await fetch(`${base}/api/daily/${encodeURIComponent(patientId)}/${encodeURIComponent(date)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bowel: updated.bowel,
          feeling: updated.feeling,
          note: updated.note,
          habits: updated.habits,
        }),
      });
      if (!response.ok) throw await apiError(response);
      const saved: unknown = await response.json();
      if (!isDailyEntry(saved) || saved.patientId !== patientId || saved.date !== date) {
        throw new Error('伺服器回傳的健康日誌格式或識別資訊不正確，請重新整理確認');
      }
      const merged = [...current.current.filter(e => e.patientId !== patientId || e.date !== date), saved];
      current.current = merged;
      setEntries(merged);
      setError('');
    } catch (cause) {
      setError('健康日誌未確認儲存成功，請檢查 FastAPI 與 MySQL。');
      throw cause;
    } finally {
      writing.current = false;
      setBusy(false);
    }
  };

  return <Context.Provider value={{ entries, ready, busy, error, save }}>{children}</Context.Provider>;
}

export function useWellness() {
  const value = useContext(Context);
  if (!value) throw new Error('WellnessProvider is missing');
  return value;
}
