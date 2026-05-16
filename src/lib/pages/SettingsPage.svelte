<script lang="ts">
  import { appState, saveEnabledMethods, ALL_METHODS, swState, checkForUpdates, refreshAll } from '../stores.svelte';
  import { getAllBrews, getAllBeans, getAllRecipes, clearAllData, putAllBrews, putAllBeans, putAllRecipes } from '../db';
  import { BREW_METHODS, BREW_METHOD_ICONS } from '../utils';
  import type { Brew, Bean, Recipe, BrewMethod } from '../types';

  interface BackupFile {
    version: number;
    exportedAt: string;
    brews: Brew[];
    beans: Bean[];
    recipes: Recipe[];
    settings: { enabledMethods: BrewMethod[] };
  }

  function toggle(method: BrewMethod) {
    const current = appState.enabledMethods;
    const next = current.includes(method)
      ? current.filter((m) => m !== method)
      : [...current, method];
    if (next.length === 0) return;
    appState.enabledMethods = next;
    saveEnabledMethods(next);
  }

  function enableAll() {
    appState.enabledMethods = [...ALL_METHODS];
    saveEnabledMethods([...ALL_METHODS]);
  }

  // --- backup ---

  let exporting = $state(false);
  let importing = $state(false);
  let importStatus = $state<'idle' | 'done' | 'error'>('idle');
  let importMessage = $state('');

  async function exportBackup() {
    exporting = true;
    try {
      const [brews, beans, recipes] = await Promise.all([
        getAllBrews(),
        getAllBeans(),
        getAllRecipes(),
      ]);
      const backup: BackupFile = {
        version: 1,
        exportedAt: new Date().toISOString(),
        brews,
        beans,
        recipes,
        settings: { enabledMethods: appState.enabledMethods },
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `coffee-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      exporting = false;
    }
  }

  async function importBackup(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    importing = true;
    importStatus = 'idle';
    importMessage = '';

    try {
      const data = JSON.parse(await file.text()) as BackupFile;

      if (
        data.version !== 1 ||
        !Array.isArray(data.brews) ||
        !Array.isArray(data.beans) ||
        !Array.isArray(data.recipes)
      ) {
        importStatus = 'error';
        importMessage = 'Invalid backup file.';
        return;
      }

      const confirmed = confirm(
        `Replace all data with backup from ${new Date(data.exportedAt).toLocaleDateString()}?\n\n` +
        `${data.brews.length} brews · ${data.beans.length} beans · ${data.recipes.length} recipes\n\n` +
        `This cannot be undone.`
      );
      if (!confirmed) return;

      await clearAllData();
      await Promise.all([
        putAllBrews(data.brews),
        putAllBeans(data.beans),
        putAllRecipes(data.recipes),
      ]);

      if (Array.isArray(data.settings?.enabledMethods)) {
        appState.enabledMethods = data.settings.enabledMethods;
        saveEnabledMethods(data.settings.enabledMethods);
      }

      await refreshAll();
      importStatus = 'done';
      importMessage = `Restored ${data.brews.length} brews, ${data.beans.length} beans, ${data.recipes.length} recipes.`;
    } catch {
      importStatus = 'error';
      importMessage = 'Could not read file — make sure it is a valid backup.';
    } finally {
      importing = false;
      (e.target as HTMLInputElement).value = '';
    }
  }
</script>

<div class="page">
  <section class="section">
    <span class="label">App</span>
    <div class="update-row">
      {#if swState.updateAvailable}
        <span class="update-status ready">Update ready</span>
        <button class="btn btn-primary btn-sm" onclick={() => swState.applyUpdate?.(true)}>Reload</button>
      {:else if swState.checking}
        <span class="update-status muted">Checking…</span>
      {:else if swState.upToDate}
        <span class="update-status muted">Up to date</span>
        <button class="btn btn-ghost btn-sm" onclick={checkForUpdates}>Check again</button>
      {:else}
        <span class="update-status muted">Tap to check for a new version</span>
        <button class="btn btn-ghost btn-sm" onclick={checkForUpdates}>Check for updates</button>
      {/if}
    </div>
  </section>

  <!-- Backup / Restore -->
  <section class="section">
    <span class="label">Backup &amp; Restore</span>
    <p class="hint">Export all brews, beans, recipes, and settings to a JSON file. Import it on another device to transfer everything over.</p>

    <button class="btn btn-primary" onclick={exportBackup} disabled={exporting}>
      {exporting ? 'Exporting…' : '⬇ Export backup'}
    </button>

    <div class="import-area">
      <label class="import-label" class:busy={importing}>
        {importing ? 'Importing…' : '⬆ Import backup'}
        <input
          type="file"
          accept=".json,application/json"
          class="file-input"
          onchange={importBackup}
          disabled={importing}
        />
      </label>
    </div>

    {#if importStatus === 'done'}
      <p class="status-msg ok">{importMessage}</p>
    {:else if importStatus === 'error'}
      <p class="status-msg err">{importMessage}</p>
    {/if}
  </section>

  <section class="section">
    <div class="section-header">
      <span class="label">Brew Methods</span>
      <button class="btn btn-ghost btn-sm" onclick={enableAll}>Enable all</button>
    </div>
    <p class="hint">Disabled methods are hidden in the Log form. The picker sorts by most recently used.</p>

    <div class="method-list">
      {#each ALL_METHODS as method}
        {@const enabled = appState.enabledMethods.includes(method)}
        <label class="method-row" class:disabled={!enabled}>
          <span class="method-icon">{BREW_METHOD_ICONS[method]}</span>
          <span class="method-name">{BREW_METHODS[method]}</span>
          <input
            type="checkbox"
            class="toggle"
            checked={enabled}
            onchange={() => toggle(method)}
          />
        </label>
      {/each}
    </div>
  </section>
</div>

<style>
  .update-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }
  .update-status {
    font-size: 0.85rem;
    flex: 1;
  }
  .update-status.ready { color: var(--primary-light); font-weight: 600; }
  .update-status.muted { color: var(--text-muted); }
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .hint {
    font-size: 0.78rem;
    color: var(--text-muted);
    margin: 0;
    line-height: 1.5;
  }
  .import-area {
    display: flex;
  }
  .import-label {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 0.65rem 1rem;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 10px;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text);
    cursor: pointer;
    transition: background 0.15s;
  }
  .import-label:hover { background: var(--surface-3); }
  .import-label.busy { opacity: 0.6; pointer-events: none; }
  .file-input {
    position: absolute;
    width: 0;
    height: 0;
    opacity: 0;
    pointer-events: none;
  }
  .status-msg {
    font-size: 0.82rem;
    margin: 0;
    padding: 0.5rem 0.75rem;
    border-radius: 8px;
  }
  .status-msg.ok { background: color-mix(in srgb, var(--primary) 20%, transparent); color: var(--primary-light); }
  .status-msg.err { background: color-mix(in srgb, #e05 15%, transparent); color: #ff6688; }
  .method-list {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .method-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.7rem 0.75rem;
    background: var(--surface-2);
    border-radius: 10px;
    cursor: pointer;
    transition: opacity 0.15s;
  }
  .method-row.disabled { opacity: 0.45; }
  .method-icon { font-size: 1.2rem; }
  .method-name { flex: 1; font-size: 0.9rem; color: var(--text); }
  .toggle {
    width: 1.1rem;
    height: 1.1rem;
    accent-color: var(--primary);
    cursor: pointer;
  }
</style>
