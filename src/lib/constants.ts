import type { BrewMethod, RoastLevel } from './types';

/** Kingrinder K2: 40 clicks per rotation, 3 rotations, 18 µm per click. */
export const K2 = {
  clicksPerRotation: 40,
  maxClicks: 120,
  micronsPerClick: 18,
} as const;

interface MethodInfo {
  label: string;
  /** Has a bloom phase worth timing separately. */
  bloom: boolean;
  /** Fallback numbers when there is no previous brew to copy — see `defaultsFor`. */
  defaults: { beans: number; water: number; temp: number };
}

export const METHODS: Record<BrewMethod, MethodInfo> = {
  v60:          { label: 'V60',          bloom: true,  defaults: { beans: 15, water: 250, temp: 93 } },
  french_press: { label: 'French Press', bloom: false, defaults: { beans: 15, water: 250, temp: 93 } },
  aeropress:    { label: 'AeroPress',    bloom: true,  defaults: { beans: 15, water: 220, temp: 88 } },
  moka_pot:     { label: 'Moka Pot',     bloom: false, defaults: { beans: 15, water: 150, temp: 93 } },
  chemex:       { label: 'Chemex',       bloom: true,  defaults: { beans: 30, water: 500, temp: 93 } },
  cold_brew:    { label: 'Cold Brew',    bloom: false, defaults: { beans: 80, water: 640, temp: 20 } },
  espresso:     { label: 'Espresso',     bloom: false, defaults: { beans: 18, water: 36,  temp: 93 } },
  other:        { label: 'Other',        bloom: false, defaults: { beans: 15, water: 250, temp: 93 } },
};

export const ALL_METHODS = Object.keys(METHODS) as BrewMethod[];

export const ROAST_LEVELS: { value: RoastLevel; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'medium-light', label: 'Med-light' },
  { value: 'medium', label: 'Medium' },
  { value: 'medium-dark', label: 'Med-dark' },
  { value: 'dark', label: 'Dark' },
];

export function roastLabel(r: RoastLevel): string {
  return ROAST_LEVELS.find((x) => x.value === r)?.label ?? r;
}

/** One word per rating, shown next to the number so a 6 and an 8 read differently. */
export const RATING_WORDS = [
  '', 'Undrinkable', 'Bad', 'Poor', 'Meh', 'Okay', 'Decent', 'Good', 'Great', 'Excellent', 'Perfect',
];
