<script lang="ts">
  import BrewCard from '../components/BrewCard.svelte';
  import { appState, refreshBrews } from '../stores.svelte';
  import { deleteBrew } from '../db';
  import { BREW_METHODS, brewsToCSV, downloadCSV, formatDate } from '../utils';
  import type { BrewMethod } from '../types';

  let search = $state('');
  let filterMethod = $state<BrewMethod | ''>('');
  let filterRating = $state(0);

  let filtered = $derived(
    appState.brews.filter((b) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        b.beans.brand.toLowerCase().includes(q) ||
        b.beans.name.toLowerCase().includes(q) ||
        b.beans.origin.toLowerCase().includes(q) ||
        b.notes.toLowerCase().includes(q);
      const matchMethod = !filterMethod || b.method === filterMethod;
      const matchRating = !filterRating || b.rating >= filterRating;
      return matchSearch && matchMethod && matchRating;
    })
  );

  async function handleDelete(id: string) {
    if (!confirm('Delete this brew?')) return;
    await deleteBrew(id);
    await refreshBrews();
  }

  function exportCSV() {
    const csv = brewsToCSV(filtered);
    downloadCSV(csv, `coffee-brews-${formatDate(Date.now())}.csv`);
  }
</script>

<div class="page">
  <!-- Filters -->
  <div class="filters">
    <input class="input" placeholder="Search beans, notes…" bind:value={search} />
    <div class="filter-row">
      <select class="select" bind:value={filterMethod}>
        <option value="">All methods</option>
        {#each Object.entries(BREW_METHODS) as [key, label]}
          <option value={key}>{label}</option>
        {/each}
      </select>
      <select class="select" bind:value={filterRating}>
        <option value={0}>Any rating</option>
        {#each [6, 7, 8, 9] as r}
          <option value={r}>{r}+ ★</option>
        {/each}
      </select>
    </div>
  </div>

  <!-- Summary bar -->
  <div class="summary-bar">
    <span>{filtered.length} brew{filtered.length !== 1 ? 's' : ''}</span>
    {#if filtered.length > 0}
      <button class="btn btn-ghost btn-sm" onclick={exportCSV}>Export CSV</button>
    {/if}
  </div>

  <!-- List -->
  {#if filtered.length === 0}
    <div class="empty">
      {#if appState.brews.length === 0}
        <p>No brews logged yet.</p>
        <p class="muted">Use the Log tab to record your first brew.</p>
      {:else}
        <p>No brews match your filter.</p>
      {/if}
    </div>
  {:else}
    <div class="brew-list">
      {#each filtered as brew (brew.id)}
        <BrewCard {brew} onDelete={handleDelete} />
      {/each}
    </div>
  {/if}
</div>

<style>
  .filters {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .filter-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }
  .summary-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.8rem;
    color: var(--text-muted);
  }
  .brew-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .empty {
    text-align: center;
    padding: 3rem 1rem;
    color: var(--text-muted);
  }
  .empty p { margin: 0.25rem 0; }
  .muted { font-size: 0.85rem; }
</style>
