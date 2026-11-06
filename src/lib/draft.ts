import type { LogDraft, SetupValues } from './types';

const KEY = 'log_draft';

/** Older than this and the draft is stale — you've moved on, don't ambush the user
 *  with last week's half-filled form. */
const MAX_AGE_MS = 6 * 60 * 60 * 1000;

/**
 * localStorage rather than in-memory app state: this is a PWA that iOS evicts
 * aggressively, so a draft that only survives in-app navigation solves half the
 * problem for the same effort. One mechanism, not two.
 */
export function loadDraft(): LogDraft | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as LogDraft | null;
    if (!d || typeof d !== 'object') return null;
    if (Date.now() - (d.savedAt ?? 0) > MAX_AGE_MS) {
      localStorage.removeItem(KEY);
      return null;
    }
    return d;
  } catch {
    return null;
  }
}

export function saveDraft(draft: LogDraft): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...draft, savedAt: Date.now() }));
  } catch {}
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}

/** datetime-local input value for right now. */
export function nowLocal(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function blankDraft(): LogDraft {
  return {
    brand: '', name: '', origin: '', roastLevel: 'medium',
    amountGrams: 15, grinderSetting: 60, method: 'v60',
    waterMl: 250, waterTemp: 93, bloomSeconds: 0,
    beanId: '', grinderNotes: '', brewSeconds: 0,
    rating: 0, notes: '', brewDate: nowLocal(), dateTouched: false,
    sourceKey: '', showMore: false, savedAt: 0,
  };
}

/** Build a draft from a set of values — the hand-off other pages use to send a brew
 *  to the Log page prefilled. */
export function draftFromValues(values: SetupValues, extra: Partial<LogDraft> = {}): LogDraft {
  return { ...blankDraft(), ...values, ...extra };
}
