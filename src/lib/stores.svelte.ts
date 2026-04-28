import { getAllBrews, getAllBeans, getAllRecipes } from './db';
import type { Brew, Bean, Recipe } from './types';

export type Page = 'log' | 'history' | 'stats' | 'beans' | 'recipes';

export const appState = $state({
  page: 'log' as Page,
  brews: [] as Brew[],
  beans: [] as Bean[],
  recipes: [] as Recipe[],
  dbReady: false,
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
