import { getAllBrews, getAllBeans, getAllRecipes } from './db';
import type { Brew, Bean, Recipe, BrewMethod } from './types';

export type Page = 'log' | 'history' | 'stats' | 'beans' | 'recipes' | 'settings';

const ALL_METHODS: BrewMethod[] = [
  'v60', 'french_press', 'aeropress', 'moka_pot', 'chemex', 'cold_brew', 'espresso', 'other',
];

function loadEnabledMethods(): BrewMethod[] {
  try {
    const saved = localStorage.getItem('enabled_methods');
    if (saved) return JSON.parse(saved) as BrewMethod[];
  } catch {}
  return [...ALL_METHODS];
}

export function saveEnabledMethods(methods: BrewMethod[]) {
  localStorage.setItem('enabled_methods', JSON.stringify(methods));
}

export { ALL_METHODS };

export const swState = $state({
  updateAvailable: false,
  checking: false,
  upToDate: false,
  applyUpdate: null as ((reloadPage?: boolean) => Promise<void>) | null,
  registration: null as ServiceWorkerRegistration | null,
});

export async function checkForUpdates() {
  if (!swState.registration) return;
  swState.checking = true;
  swState.upToDate = false;
  try {
    await swState.registration.update();
  } finally {
    swState.checking = false;
    if (!swState.updateAvailable) swState.upToDate = true;
  }
}

export const appState = $state({
  page: 'log' as Page,
  brews: [] as Brew[],
  beans: [] as Bean[],
  recipes: [] as Recipe[],
  dbReady: false,
  enabledMethods: loadEnabledMethods(),
});

export async function refreshBrews() {
  appState.brews = await getAllBrews();
}

export async function refreshBeans() {
  appState.beans = await getAllBeans();
}

export async function refreshRecipes() {
  appState.recipes = await getAllRecipes();
}

export async function refreshAll() {
  await Promise.all([refreshBrews(), refreshBeans(), refreshRecipes()]);
}
