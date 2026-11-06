import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Brew, Bean, Recipe } from './types';

const DB_NAME = 'coffee-tracker';
const DB_VERSION = 1;

interface CoffeeDB extends DBSchema {
  brews: { key: string; value: Brew; indexes: { timestamp: number; synced: number } };
  beans: { key: string; value: Bean };
  recipes: { key: string; value: Recipe };
}

type Store = 'brews' | 'beans' | 'recipes';
const STORES: Store[] = ['brews', 'beans', 'recipes'];

let db: IDBPDatabase<CoffeeDB> | null = null;

export async function initDB(): Promise<void> {
  db = await openDB<CoffeeDB>(DB_NAME, DB_VERSION, {
    upgrade(database) {
      const brewStore = database.createObjectStore('brews', { keyPath: 'id' });
      brewStore.createIndex('timestamp', 'timestamp');
      brewStore.createIndex('synced', 'synced');

      database.createObjectStore('beans', { keyPath: 'id' });
      database.createObjectStore('recipes', { keyPath: 'id' });
    },
  });
}

function getDB(): IDBPDatabase<CoffeeDB> {
  if (!db) throw new Error('DB not initialized — call initDB() first');
  return db;
}

export function newId(): string {
  return crypto.randomUUID();
}

// --- Brews ---

export async function addBrew(brew: Brew): Promise<void> {
  await getDB().add('brews', brew);
}

/** Insert or replace. Also how a deleted brew is restored by Undo. */
export async function putBrew(brew: Brew): Promise<void> {
  await getDB().put('brews', brew);
}

export async function deleteBrew(id: string): Promise<void> {
  await getDB().delete('brews', id);
}

/** Newest first. */
export async function getAllBrews(): Promise<Brew[]> {
  const all = await getDB().getAllFromIndex('brews', 'timestamp');
  return all.reverse();
}

/** Always [] for now — see "Planned: Raspberry Pi backend" in CLAUDE.md. */
export async function getUnsyncedBrews(): Promise<Brew[]> {
  return getDB().getAllFromIndex('brews', 'synced', IDBKeyRange.only(0));
}

// --- Beans ---

export async function putBean(bean: Bean): Promise<void> {
  await getDB().put('beans', bean);
}

export async function deleteBean(id: string): Promise<void> {
  await getDB().delete('beans', id);
}

export async function getAllBeans(): Promise<Bean[]> {
  return getDB().getAll('beans');
}

// --- Recipes ---

export async function putRecipe(recipe: Recipe): Promise<void> {
  await getDB().put('recipes', recipe);
}

export async function deleteRecipe(id: string): Promise<void> {
  await getDB().delete('recipes', id);
}

export async function getAllRecipes(): Promise<Recipe[]> {
  return getDB().getAll('recipes');
}

// --- Backup / Restore ---

/**
 * Wipe everything and load `data`, in one transaction — a malformed record aborts
 * the whole restore instead of leaving the database half-cleared.
 */
export async function replaceAllData(data: { brews: Brew[]; beans: Bean[]; recipes: Recipe[] }): Promise<void> {
  const tx = getDB().transaction(STORES, 'readwrite');
  await Promise.all([
    ...STORES.map((s) => tx.objectStore(s).clear()),
    ...data.brews.map((b) => tx.objectStore('brews').put(b)),
    ...data.beans.map((b) => tx.objectStore('beans').put(b)),
    ...data.recipes.map((r) => tx.objectStore('recipes').put(r)),
    tx.done,
  ]);
}
