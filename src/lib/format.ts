import { K2 } from './constants';

const LOCALE = 'de-DE';

export function formatDuration(seconds: number): string {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}s`;
}

/** Always m:ss — for running clocks, where the width must not jump at 60 s. */
export function formatClock(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTime(timestamp: number): string {
  return `${formatDate(timestamp)}, ${formatTime(timestamp)}`;
}

/** "Today", "Yesterday", "Mon 3 Nov", or with the year once it isn't this year. */
export function dayLabel(timestamp: number, now = Date.now()): string {
  const day = startOfDay(timestamp);
  const today = startOfDay(now);
  const diff = Math.round((today - day) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  const d = new Date(timestamp);
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...(d.getFullYear() !== new Date(now).getFullYear() ? { year: 'numeric' } : {}),
  });
}

export function startOfDay(timestamp: number): number {
  const d = new Date(timestamp);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Compact relative age for setup cards: "2h", "3d", "5w". */
export function relativeAge(timestamp: number): string {
  const mins = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

export function brewRatio(grams: number, ml: number): string {
  if (!grams || !ml) return '—';
  return `1:${(ml / grams).toFixed(1)}`;
}

/** K2 click count as dial position: "1R + 12". */
export function formatGrindSetting(clicks: number): string {
  const rotations = Math.floor(clicks / K2.clicksPerRotation);
  const remainder = clicks % K2.clicksPerRotation;
  if (rotations === 0) return `${remainder} clicks`;
  if (remainder === 0) return `${rotations} rotation${rotations > 1 ? 's' : ''}`;
  return `${rotations}R + ${remainder}`;
}

export function beanTitle(brand: string, name: string): string {
  return [brand, name].filter(Boolean).join(' · ') || 'Unnamed bean';
}

export function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}
