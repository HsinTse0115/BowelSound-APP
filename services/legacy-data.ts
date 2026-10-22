import type { Patient } from '../context/AppContext';

// Only exact, untouched starter profiles are hidden. User edits are retained.
const starters: Patient[] = [
  { id: 'P-1001', name: '王小明', age: 28, gender: 'M', bedNumber: '302-1', note: '例行性健康檢查，無特殊腸胃症狀。', createdAt: '2026-05-30T10:00:00Z' },
  { id: 'P-1002', name: '李美玲', age: 45, gender: 'F', bedNumber: '302-2', note: '主訴近日腹脹與消化不良。', createdAt: '2026-05-30T11:30:00Z' },
  { id: 'P-1003', name: '張家豪', age: 62, gender: 'M', bedNumber: '305-1', note: '手術後腸道功能恢復監測。', createdAt: '2026-05-30T14:15:00Z' },
];
export function keepUserPatients(patients: Patient[]): Patient[] {
  return patients.filter(patient => !starters.some(seed =>
    Object.keys(patient).length === Object.keys(seed).length
    && (Object.keys(seed) as (keyof Patient)[]).every(key => patient[key] === seed[key])));
}
