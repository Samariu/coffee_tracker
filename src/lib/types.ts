export type BrewMethod =
  | 'v60'
  | 'french_press'
  | 'aeropress'
  | 'moka_pot'
  | 'chemex'
  | 'cold_brew'
  | 'espresso'
  | 'other';

export type RoastLevel = 'light' | 'medium-light' | 'medium' | 'medium-dark' | 'dark';

export interface Brew {
  id: string;
  timestamp: number;
  beans: {
    brand: string;
    name: string;
    origin: string;
    roastLevel: RoastLevel;
    amountGrams: number;
  };
  grinder: {
    setting: number; // 0–120 clicks (K2: 40 clicks/rotation × 3 rotations, 18 µm/click)
    notes: string;
  };
  method: BrewMethod;
  water: {
    amountMl: number;
    tempCelsius: number;
  };
  bloomDurationSeconds: number;
  durationSeconds: number;
  rating: number; // 1–10
  notes: string;
  recipeId?: string;
  synced: boolean;
}

export interface Bean {
  id: string;
  brand: string;
  name: string;
  origin: string;
  roastLevel: RoastLevel;
  purchaseDate: number;
  initialAmountGrams: number;
  remainingGrams: number;
  notes: string;
}

export interface Recipe {
  id: string;
  name: string;
  beanBrand: string;
  beanName: string;
  amountGrams: number;
  grinderSetting: number;
  method: BrewMethod;
  waterAmountMl: number;
  waterTempCelsius: number;
  bloomSeconds: number;
  notes: string;
  createdAt: number;
}

/** The prefillable core of a brew — everything a "repeat this setup" action fills in. */
export interface SetupValues {
  brand: string;
  name: string;
  origin: string;
  roastLevel: RoastLevel;
  amountGrams: number;
  grinderSetting: number;
  method: BrewMethod;
  waterMl: number;
  waterTemp: number;
  bloomSeconds: number;
}

/** A one-tap starting point on the Log page: a past bean+method combo, or a saved recipe. */
export interface Setup {
  key: string;
  source: 'history' | 'recipe';
  title: string;
  method: BrewMethod;
  values: SetupValues;
  count: number;
  lastUsed: number;
  lastRating: number;
  recipeId?: string;
}

/** A bean offered as a chip — from inventory, or seen in brew history. */
export interface BeanOption {
  key: string;
  /** Inventory id, or '' for a history-only bean (no inventory to deduct from). */
  beanId: string;
  brand: string;
  name: string;
  origin: string;
  roastLevel: RoastLevel;
  remainingGrams: number | null;
  lastUsed: number;
}

/** The whole Log form, persisted so it survives navigation and the OS killing the PWA. */
export interface LogDraft extends SetupValues {
  beanId: string;
  grinderNotes: string;
  brewSeconds: number;
  rating: number;
  notes: string;
  /** datetime-local value */
  brewDate: string;
  dateTouched: boolean;
  recipeId?: string;
  /** Key of the highlighted setup card, '' if none. */
  sourceKey: string;
  showMore: boolean;
  savedAt: number;
}
