import React, { createContext, PropsWithChildren, useContext, useEffect, useRef, useState } from 'react';
import { useApp } from './AppContext';
import { apiJson, errorMessage } from '@/services/api';
import { DailyChanges, DailyEntry, parseEntries, upsertDay } from '@/services/wellness';


interface WellnessState {
  entries: DailyEntry[];
  ready: boolean;
  busy: boolean;
  error: string;
  save: (patientId: string, date: string, changes: DailyChanges) => Promise<void>;
}

const Context = createContext<WellnessState | null>(null);

function isDailyEntry(value: unknown): value is DailyEntry {
  try { parseEntries(JSON.stringify({ version: 1, entries: [value] })); return true; }
  catch { return false; }
}

export function WellnessProvider({ children }: PropsWithChildren) {
  const { ready: appReady, settings, connectionVersion, isCurrentConnection } = useApp();
  const [loadedVersion, setLoadedVersion] = useState(-1);
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const current = useRef<DailyEntry[]>([]);
  const writing = useRef(false);

  useEffect(() => {
    if (!appReady) return;
    const controller = new AbortController();
    const currentConnection = () => !controller.signal.aborted && isCurrentConnection(connectionVersion);
    const load = async () => {
      try {
        const data = await apiJson<unknown>(settings.apiUrl, '/api/daily', { signal: controller.signal });
        if (!Array.isArray(data) || !data.every(isDailyEntry)) {
          throw new Error('每日紀錄資料格式不正確，請聯絡管理人員。');
        }
        if (currentConnection()) {
          setLoadedVersion(connectionVersion);
          current.current = data;
          setEntries(data);
          setError('');
          setReady(true);
        }
      } catch (cause) {
        if (currentConnection()) {
          setLoadedVersion(connectionVersion);
          current.current = [];
          setEntries([]);
          setError('每日紀錄：' + errorMessage(cause));
          setReady(false); // 避免連線失敗時以空白資料進行編輯。
        }
      }
    };
    void load();
    return () => controller.abort();
  }, [appReady, settings.apiUrl, connectionVersion, isCurrentConnection]);

  const save = async (patientId: string, date: string, changes: DailyChanges): Promise<void> => {
    if (!ready || loadedVersion !== connectionVersion || !isCurrentConnection(connectionVersion) || writing.current) throw new Error('資料尚未載入或正在儲存，請稍後再試。');
    writing.current = true;
    setBusy(true);
    try {
      // 沿用原本的日期、選項、備註長度和習慣驗證。
      const next = upsertDay(current.current, patientId, date, changes);
      const updated = next.find(e => e.patientId === patientId && e.date === date);
      if (!updated) throw new Error('找不到待儲存的健康日誌');
      const saved = await apiJson<unknown>(settings.apiUrl, `/api/daily/${encodeURIComponent(patientId)}/${encodeURIComponent(date)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bowel: updated.bowel,
          feeling: updated.feeling,
          note: updated.note,
          habits: updated.habits,
        }),
      });
      if (!isCurrentConnection(connectionVersion)) throw new Error('連線設定已變更，請至原連線確認儲存結果。');
      if (!isDailyEntry(saved) || saved.patientId !== patientId || saved.date !== date) {
        throw new Error('伺服器回傳的健康日誌格式或識別資訊不正確，請重新整理確認');
      }
      const merged = [...current.current.filter(e => e.patientId !== patientId || e.date !== date), saved];
      current.current = merged;
      setEntries(merged);
      setError('');
    } catch (cause) {
      if (isCurrentConnection(connectionVersion)) setError(errorMessage(cause));
      throw cause;
    } finally {
      writing.current = false;
      setBusy(false);
    }
  };

  return <Context.Provider value={{ entries: loadedVersion === connectionVersion ? entries : [], ready: ready && loadedVersion === connectionVersion, busy, error: loadedVersion === connectionVersion ? error : '', save }}>{children}</Context.Provider>;
}

export function useWellness() {
  const value = useContext(Context);
  if (!value) throw new Error('WellnessProvider is missing');
  return value;
}
