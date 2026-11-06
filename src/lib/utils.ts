import type {
  Bean,
  BeanOption,
  Brew,
  BrewMethod,
  Recipe,
  Setup,
  SetupValues,
} from './types';

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

/* ────────────────────────────────────────────────────────────────────────────
   Fast-log helpers — derive one-tap starting points from what's already logged.
   Pure functions; callers wrap them in $derived.by.
   ──────────────────────────────────────────────────────────────────────────── */

const norm = (s: string): string => s.trim().toLowerCase();

/** Identity of a bean+method combination. Deliberately excludes dose — that's the
 *  thing you nudge day to day, and including it would fill the strip with
 *  near-identical cards of the same coffee. */
export function setupKey(brand: string, name: string, method: BrewMethod): string {
  return `${norm(brand)}|${norm(name)}|${method}`;
}

export function beanKey(brand: string, name: string): string {
  return `${norm(brand)}|${norm(name)}`;
}

export function beanTitle(brand: string, name: string): string {
  return [brand, name].filter(Boolean).join(' — ') || 'Unnamed';
}

export function brewToValues(b: Brew): SetupValues {
  return {
    brand: b.beans.brand,
    name: b.beans.name,
    origin: b.beans.origin,
    roastLevel: b.beans.roastLevel,
    amountGrams: b.beans.amountGrams,
    grinderSetting: b.grinder.setting,
    method: b.method,
    waterMl: b.water.amountMl,
    waterTemp: b.water.tempCelsius,
    bloomSeconds: b.bloomDurationSeconds,
  };
}

export function recipeToValues(r: Recipe): SetupValues {
  return {
    brand: r.beanBrand,
    name: r.beanName,
    origin: '',
    roastLevel: 'medium',
    amountGrams: r.amountGrams,
    grinderSetting: r.grinderSetting,
    method: r.method,
    waterMl: r.waterAmountMl,
    waterTemp: r.waterTempCelsius,
    bloomSeconds: r.bloomSeconds,
  };
}

/**
 * Your top bean+method setups, most-used first.
 *
 * Ranked by how often each appears in the last `window` brews rather than by pure
 * recency, so a handful of one-off experiments can't evict the daily driver.
 * `brews` arrives newest-first from `getAllBrews()`, so the first hit for a key is
 * also the most recent — its values are the ones the card offers.
 */
export function recentSetups(brews: Brew[], limit = 4, window = 20): Setup[] {
  const map = new Map<string, Setup>();

  for (const b of brews.slice(0, window)) {
    const key = setupKey(b.beans.brand, b.beans.name, b.method);
    const hit = map.get(key);
    if (hit) {
      hit.count++;
      continue;
    }
    map.set(key, {
      key,
      source: 'history',
      title: beanTitle(b.beans.brand, b.beans.name),
      method: b.method,
      values: brewToValues(b),
      count: 1,
      lastUsed: b.timestamp,
      lastRating: b.rating,
    });
  }

  return [...map.values()]
    .sort((a, b) => b.count - a.count || b.lastUsed - a.lastUsed)
    .slice(0, limit);
}

/** Saved recipes as setups, skipping any whose bean+method is already on the strip. */
export function recipeSetups(recipes: Recipe[], exclude: Set<string>): Setup[] {
  return recipes
    .map((r): Setup => ({
      key: `recipe:${r.id}`,
      source: 'recipe',
      title: r.name,
      method: r.method,
      values: recipeToValues(r),
      count: 0,
      lastUsed: r.createdAt,
      lastRating: 0,
      recipeId: r.id,
    }))
    .filter((s) => !exclude.has(setupKey(s.values.brand, s.values.name, s.method)))
    .sort((a, b) => b.lastUsed - a.lastUsed);
}

/** Beans to offer as chips: inventory first (they carry the id needed to deduct
 *  grams), then beans only ever seen in history. */
export function beanOptions(beans: Bean[], brews: Brew[], limit = 8): BeanOption[] {
  const lastUsed = new Map<string, number>();
  for (const b of brews) {
    const key = beanKey(b.beans.brand, b.beans.name);
    if (!lastUsed.has(key)) lastUsed.set(key, b.timestamp);
  }

  const out = new Map<string, BeanOption>();

  for (const bean of beans) {
    const key = beanKey(bean.brand, bean.name);
    out.set(key, {
      key,
      beanId: bean.id,
      brand: bean.brand,
      name: bean.name,
      origin: bean.origin,
      roastLevel: bean.roastLevel,
      remainingGrams: bean.remainingGrams,
      lastUsed: lastUsed.get(key) ?? bean.purchaseDate,
    });
  }

  for (const b of brews) {
    const key = beanKey(b.beans.brand, b.beans.name);
    if (out.has(key) || (!b.beans.brand && !b.beans.name)) continue;
    out.set(key, {
      key,
      beanId: '',
      brand: b.beans.brand,
      name: b.beans.name,
      origin: b.beans.origin,
      roastLevel: b.beans.roastLevel,
      remainingGrams: null,
      lastUsed: b.timestamp,
    });
  }

  return [...out.values()]
    .sort((a, b) => {
      const stocked = (o: BeanOption) => (o.remainingGrams !== null && o.remainingGrams > 0 ? 1 : 0);
      return stocked(b) - stocked(a) || b.lastUsed - a.lastUsed;
    })
    .slice(0, limit);
}

/** Newest brew matching any subset of {brand, name, method}. */
export function lastBrewFor(
  brews: Brew[],
  q: { brand?: string; name?: string; method?: BrewMethod },
): Brew | undefined {
  return brews.find(
    (b) =>
      (q.brand === undefined || norm(b.beans.brand) === norm(q.brand)) &&
      (q.name === undefined || norm(b.beans.name) === norm(q.name)) &&
      (q.method === undefined || b.method === q.method),
  );
}

export type BrewParams = Pick<
  SetupValues,
  'amountGrams' | 'waterMl' | 'waterTemp' | 'grinderSetting' | 'bloomSeconds'
>;

/**
 * The numbers to prefill for a bean+method: how you last brewed it, falling back to
 * METHOD_DEFAULTS. The single home of that rule — both the bean picker and the method
 * picker go through here.
 */
export function defaultsFor(
  brews: Brew[],
  q: { brand?: string; name?: string; method: BrewMethod },
  currentGrind: number,
): BrewParams {
  const exact = q.brand !== undefined || q.name !== undefined
    ? lastBrewFor(brews, q)
    : undefined;
  const match = exact ?? lastBrewFor(brews, { method: q.method });

  if (match) {
    return {
      amountGrams: match.beans.amountGrams,
      waterMl: match.water.amountMl,
      waterTemp: match.water.tempCelsius,
      grinderSetting: match.grinder.setting,
      bloomSeconds: match.bloomDurationSeconds,
    };
  }

  const d = METHOD_DEFAULTS[q.method];
  // Grind has no per-method default — keep what's set rather than snapping to 60.
  return {
    amountGrams: d.beans,
    waterMl: d.water,
    waterTemp: d.temp,
    grinderSetting: currentGrind,
    bloomSeconds: 0,
  };
}

export function findInventoryBean(beans: Bean[], brand: string, name: string): Bean | undefined {
  const key = beanKey(brand, name);
  return beans.find((b) => beanKey(b.brand, b.name) === key);
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
