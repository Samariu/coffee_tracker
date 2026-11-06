<script lang="ts">
  import Icon from '../components/Icon.svelte';
  import PageHeader from '../components/PageHeader.svelte';
  import { appState, setEnabledMethods, swState, checkForUpdates, refreshAll } from '../stores.svelte';
  import { getAllBrews, getAllBeans, getAllRecipes, replaceAllData } from '../db';
  import { ALL_METHODS, METHODS } from '../constants';
  import { downloadFile, fileDate, makeBackup, parseBackup } from '../files';
  import { formatDate, plural } from '../format';
  import { toast } from '../toast.svelte';
  import type { BrewMethod } from '../types';

  function toggle(method: BrewMethod) {
    const current = appState.enabledMethods;
    const next = current.includes(method)
      ? current.filter((m) => m !== method)
      : ALL_METHODS.filter((m) => m === method || current.includes(m));
    if (next.length > 0) setEnabledMethods(next);
  }

  // --- backup ---

  let busy = $state(false);
  let error = $state('');

  async function exportBackup() {
    busy = true;
    try {
      const [brews, beans, recipes] = await Promise.all([getAllBrews(), getAllBeans(), getAllRecipes()]);
      downloadFile(
        makeBackup({ brews, beans, recipes }, appState.enabledMethods),
        `coffee-backup-${fileDate()}.json`,
        'application/json',
      );
    } finally {
      busy = false;
    }
  }

  async function importBackup(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    error = '';

    try {
      const data = parseBackup(await file.text());
      const ok = confirm(
        `Replace all data with the backup from ${formatDate(Date.parse(data.exportedAt))}?\n\n` +
        `${plural(data.brews.length, 'brew')} · ${plural(data.beans.length, 'bean')} · ${plural(data.recipes.length, 'recipe')}\n\n` +
        `Your current data will be lost.`,
      );
      if (!ok) return;

      busy = true;
      await replaceAllData(data);
      if (Array.isArray(data.settings?.enabledMethods)) setEnabledMethods(data.settings.enabledMethods);
      await refreshAll();
      toast(`Restored ${plural(data.brews.length, 'brew')}`);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Could not restore that file.';
    } finally {
      busy = false;
    }
  }
</script>

<div class="page">
  <PageHeader title="Settings" />

  <span class="group-label">App</span>
  <div class="list">
    <div class="list-row">
      <Icon name="refresh" size={18} />
      <span class="grow">
        {#if swState.updateAvailable}New version ready
        {:else if swState.checking}Checking…
        {:else if swState.upToDate}Up to date
        {:else}Updates{/if}
      </span>
      {#if swState.updateAvailable}
        <button class="btn btn-sm btn-primary" onclick={() => swState.applyUpdate?.(true)}>Reload</button>
      {:else}
        <button class="btn btn-sm btn-ghost" onclick={checkForUpdates} disabled={swState.checking}>Check</button>
      {/if}
    </div>
  </div>

  <span class="group-label">Backup</span>
  <div class="list">
    <button class="list-row" onclick={exportBackup} disabled={busy}>
      <Icon name="download" size={18} />
      <span class="grow">Export backup</span>
      <span class="meta">.json</span>
    </button>
    <label class="list-row" class:busy>
      <Icon name="upload" size={18} />
      <span class="grow">Restore from backup</span>
      <Icon name="chevronRight" size={16} />
      <input type="file" accept=".json,application/json" class="file-input" onchange={importBackup} disabled={busy} />
    </label>
  </div>
  {#if error}<p class="error">{error}</p>{/if}
  <p class="hint pad">Everything lives on this device only. Export a backup now and then — and before moving to a new phone.</p>

  <span class="group-label">Brew methods</span>
  <div class="list">
    {#each ALL_METHODS as method (method)}
      <label class="list-row">
        <Icon method={method} size={20} />
        <span class="grow">{METHODS[method].label}</span>
        <input
          type="checkbox"
          class="switch"
          checked={appState.enabledMethods.includes(method)}
          onchange={() => toggle(method)}
        />
      </label>
    {/each}
  </div>
  <p class="hint pad">Hidden methods don't appear on the Brew tab. At least one stays on.</p>
</div>

<style>
  .group-label {
    margin: 12px 4px -4px;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-2);
  }
  .list-row :global(svg) { color: var(--text-2); }
  .list-row.busy { opacity: 0.5; pointer-events: none; }
  .file-input { position: absolute; width: 0; height: 0; opacity: 0; pointer-events: none; }
  .pad { padding: 0 4px; }
  .error {
    margin: 0;
    padding: 10px 14px;
    border-radius: var(--radius-sm);
    background: var(--danger-soft);
    color: var(--danger);
    font-size: 0.85rem;
  }
</style>
