import type { Brew, BrewMethod } from './types';

export function generateId(): string {
  return crypto.randomUUID();
}

export function formatDuration(seconds: number): string {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}s`;
}

export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function brewRatio(grams: number, ml: number): string {
  if (!grams || !ml) return '—';
  return `1:${(ml / grams).toFixed(1)}`;
}

/** Convert K2 click count (0–120) to rotation display string. */
export function formatGrindSetting(clicks: number): string {
  const rotations = Math.floor(clicks / 40);
  const remainder = clicks % 40;
  if (rotations === 0) return `${remainder} clicks`;
  if (remainder === 0) return `${rotations} rotation${rotations > 1 ? 's' : ''}`;
  return `${rotations}R + ${remainder}`;
}

export const BREW_METHODS: Record<BrewMethod, string> = {
  v60: 'V60',
  french_press: 'French Press',
  aeropress: 'AeroPress',
  moka_pot: 'Moka Pot',
  chemex: 'Chemex',
  cold_brew: 'Cold Brew',
  espresso: 'Espresso',
  other: 'Other',
};

export const BREW_METHOD_ICONS: Record<BrewMethod, string> = {
  v60: '☕',
  french_press: '🫖',
  aeropress: '🧪',
  moka_pot: '🫕',
  chemex: '⚗️',
  cold_brew: '🧊',
  espresso: '☕',
  other: '✨',
};

/** Methods that have a bloom phase. */
export const BLOOM_METHODS: BrewMethod[] = ['v60', 'chemex', 'aeropress'];

/** Default water/bean settings when switching brew method. */
export const METHOD_DEFAULTS: Record<BrewMethod, { beans: number; water: number; temp: number }> = {
  v60:          { beans: 15, water: 250, temp: 93 },
  french_press: { beans: 15, water: 250, temp: 93 },
  aeropress:    { beans: 15, water: 220, temp: 88 },
  moka_pot:     { beans: 15, water: 150, temp: 93 },
  chemex:       { beans: 30, water: 500, temp: 93 },
  cold_brew:    { beans: 80, water: 640, temp: 20 },
  espresso:     { beans: 18, water: 36,  temp: 93 },
  other:        { beans: 15, water: 250, temp: 93 },
};

export const ROAST_LEVELS = [
  { value: 'light', label: 'Light' },
  { value: 'medium-light', label: 'Med. Light' },
  { value: 'medium', label: 'Medium' },
  { value: 'medium-dark', label: 'Med. Dark' },
  { value: 'dark', label: 'Dark' },
] as const;

export function brewsToCSV(brews: Brew[]): string {
  const headers = [
    'Date',
    'Bean Brand',
    'Bean Name',
    'Origin',
    'Roast',
    'Beans (g)',
    'Grinder Clicks',
    'Grinder Setting',
    'Method',
    'Water (ml)',
    'Water Temp (°C)',
    'Ratio',
    'Bloom (s)',
    'Duration (s)',
    'Rating',
    'Notes',
  ].join(',');

  const rows = brews.map((b) => [
    new Date(b.timestamp).toISOString(),
    `"${b.beans.brand}"`,
    `"${b.beans.name}"`,
    `"${b.beans.origin}"`,
    b.beans.roastLevel,
    b.beans.amountGrams,
    b.grinder.setting,
    `"${formatGrindSetting(b.grinder.setting)}"`,
    b.method,
    b.water.amountMl,
    b.water.tempCelsius,
    brewRatio(b.beans.amountGrams, b.water.amountMl),
    b.bloomDurationSeconds,
    b.durationSeconds,
    b.rating,
    `"${b.notes.replace(/"/g, '""')}"`,
  ].join(','));

  return [headers, ...rows].join('\n');
}

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
