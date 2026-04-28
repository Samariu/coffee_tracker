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
