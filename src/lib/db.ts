import { openDB, type IDBPDatabase } from 'idb';
import type { Brew, Bean, Recipe } from './types';

const DB_NAME = 'coffee-tracker';
const DB_VERSION = 1;

let db: IDBPDatabase | null = null;

export async function initDB(): Promise<void> {
  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(database) {
      const brewStore = database.createObjectStore('brews', { keyPath: 'id' });
      brewStore.createIndex('timestamp', 'timestamp');
      brewStore.createIndex('synced', 'synced');

      database.createObjectStore('beans', { keyPath: 'id' });
      database.createObjectStore('recipes', { keyPath: 'id' });
    },
  });
}

function getDB(): IDBPDatabase {
  if (!db) throw new Error('DB not initialized — call initDB() first');
  return db;
}

// --- Brews ---

export async function addBrew(brew: Brew): Promise<void> {
  await getDB().add('brews', brew);
}

export async function updateBrew(brew: Brew): Promise<void> {
  await getDB().put('brews', brew);
}

export async function deleteBrew(id: string): Promise<void> {
  await getDB().delete('brews', id);
}

export async function getAllBrews(): Promise<Brew[]> {
  const all = await getDB().getAllFromIndex('brews', 'timestamp');
  return all.reverse();
}

export async function getUnsyncedBrews(): Promise<Brew[]> {
  return getDB().getAllFromIndex('brews', 'synced', IDBKeyRange.only(0));
}

// --- Beans ---

export async function addBean(bean: Bean): Promise<void> {
  await getDB().add('beans', bean);
}

export async function updateBean(bean: Bean): Promise<void> {
  await getDB().put('beans', bean);
}

export async function deleteBean(id: string): Promise<void> {
  await getDB().delete('beans', id);
}

export async function getAllBeans(): Promise<Bean[]> {
  return getDB().getAll('beans');
}

// --- Recipes ---

export async function addRecipe(recipe: Recipe): Promise<void> {
  await getDB().add('recipes', recipe);
}

export async function updateRecipe(recipe: Recipe): Promise<void> {
  await getDB().put('recipes', recipe);
}

export async function deleteRecipe(id: string): Promise<void> {
  await getDB().delete('recipes', id);
}

export async function getAllRecipes(): Promise<Recipe[]> {
  return getDB().getAll('recipes');
}
