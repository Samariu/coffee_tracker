/**
 * Fast-log helpers — derive one-tap starting points from what's already logged.
 * Pure functions; components wrap them in $derived.by.
 */
import { METHODS } from './constants';
import { beanTitle } from './format';
import type { Bean, BeanOption, Brew, BrewMethod, Recipe, Setup, SetupValues } from './types';

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

  const stocked = (o: BeanOption) => (o.remainingGrams !== null && o.remainingGrams > 0 ? 1 : 0);
  return [...out.values()]
    .sort((a, b) => stocked(b) - stocked(a) || b.lastUsed - a.lastUsed)
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
 * the method's defaults. The single home of that rule — both the bean picker and the
 * method picker go through here.
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

  const d = METHODS[q.method].defaults;
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
