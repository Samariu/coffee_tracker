import { getAllBrews, getAllBeans, getAllRecipes } from './db';
import { ALL_METHODS } from './constants';
import type { Brew, Bean, Recipe, BrewMethod } from './types';

export type Page = 'log' | 'history' | 'stats' | 'beans' | 'recipes' | 'settings';

const METHODS_KEY = 'enabled_methods';

function loadEnabledMethods(): BrewMethod[] {
  try {
    const saved = JSON.parse(localStorage.getItem(METHODS_KEY) ?? 'null');
    if (Array.isArray(saved)) {
      const valid = saved.filter((m): m is BrewMethod => ALL_METHODS.includes(m));
      if (valid.length) return valid;
    }
  } catch {}
  return [...ALL_METHODS];
}

export function setEnabledMethods(methods: BrewMethod[]) {
  appState.enabledMethods = methods;
  try {
    localStorage.setItem(METHODS_KEY, JSON.stringify(methods));
  } catch {}
}

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

export function go(page: Page) {
  appState.page = page;
}

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
