import { addDays, startOfDay, format } from 'date-fns';

export type Role = 'ADMIN' | 'USTADZ';

export function allowedDateWindow(role: Role, todayIso: string): { min: string; max: string } {
  const today = startOfDay(new Date(todayIso));
  if (role === 'ADMIN') {
    return {
      min: format(addDays(today, -30), 'yyyy-MM-dd'),
      max: format(today, 'yyyy-MM-dd'),
    };
  }
  return {
    min: format(addDays(today, -1), 'yyyy-MM-dd'),
    max: format(today, 'yyyy-MM-dd'),
  };
}

export function isDateAllowed(role: Role, dateIso: string, todayIso: string): boolean {
  const date = startOfDay(new Date(dateIso));
  const { min, max } = allowedDateWindow(role, todayIso);
  const minDate = startOfDay(new Date(min));
  const maxDate = startOfDay(new Date(max));
  return date >= minDate && date <= maxDate;
}

export function canChangeAttendance(newStatus: string, activeRecordCount: number): boolean {
  if (['IZIN', 'SAKIT', 'ALPHA'].includes(newStatus)) {
    return activeRecordCount === 0;
  }
  return true;
}

export function resolveLineCount(params: { role: Role; computed: number; requested?: number | null; notes?: string | null }): number {
  if (params.role === 'USTADZ') return params.computed;
  
  if (params.requested !== undefined && params.requested !== null && params.requested !== params.computed) {
    if (!params.notes || params.notes.trim().length < 5) {
      throw new Error('TH002');
    }
    if (params.requested < 1 || params.requested > 300) {
      throw new Error('TH002');
    }
    return params.requested;
  }
  return params.computed;
}

export function validateVoidReason(reason: string | null | undefined): boolean {
  if (!reason) return false;
  const trimmed = reason.trim();
  return trimmed.length >= 3 && trimmed.length <= 200;
}
