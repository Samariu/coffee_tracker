/** Everything that turns data into a file the user keeps: CSV export and JSON backup. */
import { brewRatio, formatGrindSetting } from './format';
import type { Bean, Brew, BrewMethod, Recipe } from './types';

export function downloadFile(content: string, filename: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Today as YYYY-MM-DD, for filenames that sort. */
export function fileDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Quote every text cell — a bean called `Ethiopia, "Natural"` must not split a row. */
const cell = (v: string | number): string =>
  typeof v === 'number' ? String(v) : `"${v.replace(/"/g, '""')}"`;

export function brewsToCSV(brews: Brew[]): string {
  const headers = [
    'Date', 'Bean Brand', 'Bean Name', 'Origin', 'Roast', 'Beans (g)',
    'Grinder Clicks', 'Grinder Setting', 'Method', 'Water (ml)', 'Water Temp (°C)',
    'Ratio', 'Bloom (s)', 'Duration (s)', 'Rating', 'Notes',
  ];

  const rows = brews.map((b) => [
    new Date(b.timestamp).toISOString(),
    b.beans.brand,
    b.beans.name,
    b.beans.origin,
    b.beans.roastLevel,
    b.beans.amountGrams,
    b.grinder.setting,
    formatGrindSetting(b.grinder.setting),
    b.method,
    b.water.amountMl,
    b.water.tempCelsius,
    brewRatio(b.beans.amountGrams, b.water.amountMl),
    b.bloomDurationSeconds,
    b.durationSeconds,
    b.rating,
    b.notes,
  ].map(cell).join(','));

  return [headers.map(cell).join(','), ...rows].join('\n');
}

export interface Backup {
  version: 1;
  exportedAt: string;
  brews: Brew[];
  beans: Bean[];
  recipes: Recipe[];
  settings: { enabledMethods: BrewMethod[] };
}

export function makeBackup(
  data: Pick<Backup, 'brews' | 'beans' | 'recipes'>,
  enabledMethods: BrewMethod[],
): string {
  const backup: Backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    ...data,
    settings: { enabledMethods },
  };
  return JSON.stringify(backup, null, 2);
}

/** Parse and shape-check a backup file. Throws with a user-facing message. */
export function parseBackup(text: string): Backup {
  let data: Partial<Backup>;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON.');
  }
  if (
    data?.version !== 1 ||
    !Array.isArray(data.brews) ||
    !Array.isArray(data.beans) ||
    !Array.isArray(data.recipes)
  ) {
    throw new Error('That file is not a Coffee Tracker backup.');
  }
  return data as Backup;
}
