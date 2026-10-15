export const HABITS = [
  { id: 'meal', title: '吃飯', detail: '今天有留時間坐下來吃頓飯。', icon: 'restaurant-outline' },
  { id: 'move', title: '活動身體', detail: '今天有散步、伸展，或做其他活動。', icon: 'walk-outline' },
  { id: 'rest', title: '休息', detail: '今天有安排時間休息一下。', icon: 'moon-outline' },
] as const;
export const BOWEL_OPTIONS = ['未填寫', '今天沒有', '1 次', '2 次以上'] as const;
export const FEELING_OPTIONS = ['未填寫', '舒適', '普通', '不舒服'] as const;
export interface DailyEntry {
  patientId: string;
  date: string;
  bowel: typeof BOWEL_OPTIONS[number];
  feeling: typeof FEELING_OPTIONS[number];
  note: string;
  habits: string[];
  updatedAt: string;
}
export type DailyChanges = Partial<Pick<DailyEntry, 'bowel' | 'feeling' | 'note' | 'habits'>>;
// Three explicitly recorded days, ending today or yesterday if today is still unfilled.
// Missing days and other people's entries never count as no bowel movement.
export function bowelReminderEnd(entries: DailyEntry[], patientId: string, today: string): string | null {
  if (!patientId || !validDay(today)) return null;
  const mine = new Map(entries.filter(e => e.patientId === patientId).map(e => [e.date, e]));
  const cursor = new Date(today + 'T12:00:00');
  const current = mine.get(today)?.bowel;
  if (!current || current === '未填寫') cursor.setDate(cursor.getDate() - 1);
  const end = dateKey(cursor);
  for (let i = 0; i < 3; i++) {
    if (mine.get(dateKey(cursor))?.bowel !== '今天沒有') return null;
    cursor.setDate(cursor.getDate() - 1);
  }
  return end;
}
export function dateKey(date = new Date()): string {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}
export function validDay(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && dateKey(new Date(value + 'T12:00:00')) === value;
}
export function calendarDays(month: Date): (string | null)[] {
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const days: (string | null)[] = Array(start.getDay()).fill(null);
  for (let day = 1; day <= count; day++) days.push(dateKey(new Date(month.getFullYear(), month.getMonth(), day)));
  while (days.length % 7) days.push(null);
  return days;
}
export function upsertDay(entries: DailyEntry[], patientId: string, date: string, changes: DailyChanges): DailyEntry[] {
  if (!patientId || !validDay(date) || date > dateKey()) throw new Error('請選擇有效的對象與日期，不能記錄未來日期。');
  const previous = entries.find(e => e.patientId === patientId && e.date === date);
  const entry: DailyEntry = { patientId, date, bowel: '未填寫', feeling: '未填寫', note: '', habits: [], ...previous, ...changes, updatedAt: new Date().toISOString() };
  entry.note = entry.note.trim().slice(0, 500);
  entry.habits = [...new Set(entry.habits.filter(id => HABITS.some(habit => habit.id === id)))];
  if (!BOWEL_OPTIONS.includes(entry.bowel) || !FEELING_OPTIONS.includes(entry.feeling)) throw new Error('紀錄選項無效。');
  return [...entries.filter(e => e.patientId !== patientId || e.date !== date), entry];
}
export function parseEntries(raw: string | null): DailyEntry[] {
  if (!raw) return [];
  const value = JSON.parse(raw);
  if (value.version !== 1 || !Array.isArray(value.entries) || !value.entries.every((e: DailyEntry) =>
    e && typeof e.patientId === 'string' && validDay(e.date) && BOWEL_OPTIONS.includes(e.bowel)
    && FEELING_OPTIONS.includes(e.feeling) && typeof e.note === 'string' && Array.isArray(e.habits)
    && e.habits.every(id => HABITS.some(h => h.id === id)) && typeof e.updatedAt === 'string')) throw new Error('日常紀錄格式不符，已保留原資料。');
  return value.entries;
}
