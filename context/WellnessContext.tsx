import React, { createContext, PropsWithChildren, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DailyChanges, DailyEntry, parseEntries, upsertDay } from '@/services/wellness';

const KEY = '@bowelsound_wellness_v1';
interface WellnessState {
  entries: DailyEntry[];
  ready: boolean;
  busy: boolean;
  error: string;
  save: (patientId: string, date: string, changes: DailyChanges) => Promise<void>;
}
const Context = createContext<WellnessState | null>(null);
export function WellnessProvider({ children }: PropsWithChildren) {
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const current = useRef<DailyEntry[]>([]);
  const writing = useRef(false);
  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(KEY).then(raw => {
      const loaded = parseEntries(raw);
      if (mounted) { current.current = loaded; setEntries(loaded); setReady(true); }
    }).catch(() => { if (mounted) setError('無法讀取日常紀錄，請重新開啟 APP 重試。原資料未被覆蓋。'); });
    return () => { mounted = false; };
  }, []);
  const save = async (patientId: string, date: string, changes: DailyChanges) => {
    if (!ready || writing.current) throw new Error('資料處理中，請稍後再試。');
    writing.current = true; setBusy(true);
    try {
      const next = upsertDay(current.current, patientId, date, changes);
      await AsyncStorage.setItem(KEY, JSON.stringify({ version: 1, entries: next }));
      current.current = next; setEntries(next); setError('');
    } catch (cause) {
      setError('日常紀錄尚未儲存，請確認裝置儲存空間後重試。');
      throw cause;
    } finally { writing.current = false; setBusy(false); }
  };
  return <Context.Provider value={{ entries, ready, busy, error, save }}>{children}</Context.Provider>;
}
export function useWellness() {
  const value = useContext(Context);
  if (!value) throw new Error('WellnessProvider is missing');
  return value;
}
