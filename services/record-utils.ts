import type { BowelRecord } from '../context/AppContext';

export type RecordChanges = Pick<BowelRecord, 'note' | 'symptoms' | 'mealTime' | 'hasCaffeine'>;

export function editRecord(records: BowelRecord[], id: string, changes: RecordChanges): BowelRecord[] {
  return records.map(record => record.id === id ? { ...record, ...changes } : record);
}

export function removeRecord(records: BowelRecord[], id: string): BowelRecord[] {
  return records.filter(record => record.id !== id);
}

export function isValidDateInput(value: string): boolean {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00');
  return !Number.isNaN(date.getTime()) && date.getFullYear() === Number(value.slice(0, 4))
    && date.getMonth() + 1 === Number(value.slice(5, 7)) && date.getDate() === Number(value.slice(8, 10));
}
export function filterRecords(records: BowelRecord[], filter: { patientId: string; period: string; start: string; end: string }, now = new Date()) {
  let start = -Infinity;
  let end = Infinity;
  if (filter.period === '近7天' || filter.period === '近30天') {
    const from = new Date(now);
    from.setHours(0, 0, 0, 0);
    from.setDate(from.getDate() - (filter.period === '近7天' ? 6 : 29));
    start = from.getTime();
    end = now.getTime();
  } else if (filter.period === '自訂') {
    if (filter.start) start = new Date(filter.start + 'T00:00:00').getTime();
    if (filter.end) end = new Date(filter.end + 'T23:59:59.999').getTime();
  }
  return records.filter(r => (!filter.patientId || r.patientId === filter.patientId)
    && new Date(r.createdAt).getTime() >= start && new Date(r.createdAt).getTime() <= end)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
