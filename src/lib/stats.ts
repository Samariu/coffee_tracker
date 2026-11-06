/** Derived numbers for the Insights page. Pure — the page wraps these in $derived. */
import { METHODS } from './constants';
import { beanTitle, startOfDay } from './format';
import { beanKey } from './setups';
import type { Brew, BrewMethod } from './types';

const DAY = 86_400_000;

const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;

export interface Overview {
  total: number;
  thisWeek: number;
  avgRating: number | null;
  avgRatio: number | null;
  /** Consecutive days with at least one brew, ending today or yesterday. */
  streak: number;
}

export function overview(brews: Brew[], now = Date.now()): Overview {
  const rated = brews.filter((b) => b.rating > 0).map((b) => b.rating);
  const ratios = brews
    .filter((b) => b.beans.amountGrams > 0 && b.water.amountMl > 0)
    .map((b) => b.water.amountMl / b.beans.amountGrams);

  return {
    total: brews.length,
    thisWeek: brews.filter((b) => b.timestamp >= startOfDay(now) - 6 * DAY).length,
    avgRating: rated.length ? mean(rated) : null,
    avgRatio: ratios.length ? mean(ratios) : null,
    streak: streak(brews, now),
  };
}

function streak(brews: Brew[], now: number): number {
  const days = new Set(brews.map((b) => startOfDay(b.timestamp)));
  let day = startOfDay(now);
  // A streak isn't broken until today is over.
  if (!days.has(day)) day -= DAY;
  let n = 0;
  while (days.has(day)) {
    n++;
    day -= DAY;
  }
  return n;
}

/** Last `n` rated brews, oldest first, for the trend chart. */
export function ratingTrend(brews: Brew[], n = 24): Brew[] {
  return brews.filter((b) => b.rating > 0).slice(0, n).reverse();
}

export interface BeanStat {
  title: string;
  avg: number;
  count: number;
  /** Mean grind of the brews rated 8+, or null if none were. */
  sweetSpot: number | null;
}

export function beanStats(brews: Brew[]): BeanStat[] {
  const groups = new Map<string, Brew[]>();
  for (const b of brews) {
    if (b.rating === 0) continue;
    const key = beanKey(b.beans.brand, b.beans.name);
    groups.set(key, [...(groups.get(key) ?? []), b]);
  }
  return [...groups.values()]
    .map((group) => {
      const best = group.filter((b) => b.rating >= 8);
      return {
        title: beanTitle(group[0].beans.brand, group[0].beans.name),
        avg: mean(group.map((b) => b.rating)),
        count: group.length,
        sweetSpot: best.length ? Math.round(mean(best.map((b) => b.grinder.setting))) : null,
      };
    })
    .sort((a, b) => b.avg - a.avg || b.count - a.count);
}

export function methodCounts(brews: Brew[]): { method: BrewMethod; label: string; count: number }[] {
  const counts = new Map<BrewMethod, number>();
  for (const b of brews) counts.set(b.method, (counts.get(b.method) ?? 0) + 1);
  return [...counts.entries()]
    .map(([method, count]) => ({ method, label: METHODS[method].label, count }))
    .sort((a, b) => b.count - a.count);
}
