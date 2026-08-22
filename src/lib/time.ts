export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function formatDateLabel(key: string): string {
  const date = parseDateKey(key);
  const today = toDateKey(new Date());
  const tomorrow = toDateKey(addDays(new Date(), 1));
  if (key === today) return 'Today';
  if (key === tomorrow) return 'Tomorrow';
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function timezoneOffsetMs(timeZone: string, utcMs: number): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(utcMs));
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  const asIfUtc = Date.UTC(
    value('year'),
    value('month') - 1,
    value('day'),
    value('hour'),
    value('minute'),
    value('second'),
  );
  return asIfUtc - utcMs;
}

/**
 * AviationStack sends airport-local clock times with a fake +00:00 offset.
 * Interpret the clock time in `timeZone` (or UTC if missing) and return a real instant.
 */
export function parseAirportDateTime(raw: string, timeZone?: string | null): Date {
  const naive = raw.trim().replace(/([+-]\d{2}:?\d{2}|Z)$/i, '').replace(' ', 'T');
  const match = naive.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return new Date(raw);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6] || 0);
  let utcMs = Date.UTC(year, month - 1, day, hour, minute, second);
  if (!timeZone) return new Date(utcMs);
  try {
    for (let i = 0; i < 3; i += 1) {
      utcMs = Date.UTC(year, month - 1, day, hour, minute, second) - timezoneOffsetMs(timeZone, utcMs);
    }
    return new Date(utcMs);
  } catch {
    return new Date(utcMs);
  }
}

export function toIsoUtc(raw?: string | null, timeZone?: string | null): string | undefined {
  if (!raw) return undefined;
  const date = parseAirportDateTime(raw, timeZone);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

export function formatTime(iso?: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

export function formatDuration(seconds?: number | null): string {
  if (seconds == null || Number.isNaN(seconds)) return '—';
  const totalMinutes = Math.max(1, Math.round(seconds / 60));
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

export function formatCountdown(targetIso?: string | null, now = Date.now()): string {
  if (!targetIso) return '—';
  const diff = new Date(targetIso).getTime() - now;
  if (diff <= 0) return 'Now';
  const totalMinutes = Math.round(diff / 60_000);
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remainHours = hours % 24;
    return remainHours === 0 ? `${days}d` : `${days}d ${remainHours}h`;
  }
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

export function combineLocalDateAndTime(dateKey: string, timeValue: Date): string {
  const date = parseDateKey(dateKey);
  date.setHours(timeValue.getHours(), timeValue.getMinutes(), 0, 0);
  return date.toISOString();
}

export function nearbyDateKeys(dateKey: string): string[] {
  const date = parseDateKey(dateKey);
  return [toDateKey(addDays(date, -1)), dateKey, toDateKey(addDays(date, 1))];
}
