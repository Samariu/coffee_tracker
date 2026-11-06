<script lang="ts">
  import BrewCard from '../components/BrewCard.svelte';
  import RatingInput from '../components/RatingInput.svelte';
  import { appState, refreshBrews } from '../stores.svelte';
  import { deleteBrew, updateBrew } from '../db';
  import { draftFromValues, saveDraft } from '../draft';
  import { BREW_METHODS, BREW_METHOD_ICONS, brewsToCSV, brewToValues, downloadCSV, findInventoryBean, formatDate, ROAST_LEVELS, formatGrindSetting } from '../utils';
  import type { Brew, BrewMethod, RoastLevel } from '../types';

  let search = $state('');
  let filterMethod = $state<BrewMethod | ''>('');
  let filterRating = $state(0);

  // --- edit modal ---
  let editingBrew = $state<Brew | null>(null);
  let eBrand = $state('');
  let eName = $state('');
  let eOrigin = $state('');
  let eRoast = $state<RoastLevel>('medium');
  let eAmount = $state(15);
  let eGrind = $state(60);
  let eGrindNotes = $state('');
  let eMethod = $state<BrewMethod>('v60');
  let eWaterMl = $state(250);
  let eWaterTemp = $state(93);
  let eBloom = $state(0);
  let eDuration = $state(0);
  let eRating = $state(0);
  let eNotes = $state('');

  function openEdit(id: string) {
    const brew = appState.brews.find((b) => b.id === id);
    if (!brew) return;
    editingBrew = brew;
    eBrand = brew.beans.brand;
    eName = brew.beans.name;
    eOrigin = brew.beans.origin;
    eRoast = brew.beans.roastLevel as RoastLevel;
    eAmount = brew.beans.amountGrams;
    eGrind = brew.grinder.setting;
    eGrindNotes = brew.grinder.notes;
    eMethod = brew.method;
    eWaterMl = brew.water.amountMl;
    eWaterTemp = brew.water.tempCelsius;
    eBloom = brew.bloomDurationSeconds;
    eDuration = brew.durationSeconds;
    eRating = brew.rating;
    eNotes = brew.notes;
  }

  async function saveEdit() {
    if (!editingBrew || !eBrand) return;
    await updateBrew({
      ...editingBrew,
      beans: { brand: eBrand, name: eName, origin: eOrigin, roastLevel: eRoast, amountGrams: eAmount },
      grinder: { setting: eGrind, notes: eGrindNotes },
      method: eMethod,
      water: { amountMl: eWaterMl, tempCelsius: eWaterTemp },
      bloomDurationSeconds: eBloom,
      durationSeconds: eDuration,
      rating: eRating,
      notes: eNotes,
      synced: false,
    });
    await refreshBrews();
    editingBrew = null;
  }

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

  const methods = Object.entries(BREW_METHODS) as [BrewMethod, string][];
  /** Send this brew back to the Log page prefilled — one tap to brew it again. */
  function repeatBrew(brew: Brew) {
    const bean = findInventoryBean(appState.beans, brew.beans.brand, brew.beans.name);
    saveDraft(draftFromValues(brewToValues(brew), { beanId: bean?.id ?? '' }));
    appState.page = 'log';
  }

</script>

<div class="page">
  <div class="filters">
    <input class="input" placeholder="Search beans, notes…" bind:value={search} />
    <div class="filter-row">
      <select class="select" bind:value={filterMethod}>
        <option value="">All methods</option>
        {#each methods as [key, label]}
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

  <div class="summary-bar">
    <span>{filtered.length} brew{filtered.length !== 1 ? 's' : ''}</span>
    {#if filtered.length > 0}
      <button class="btn btn-ghost btn-sm" onclick={exportCSV}>Export CSV</button>
    {/if}
  </div>

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
        <BrewCard {brew} onDelete={handleDelete} onEdit={openEdit} onRepeat={repeatBrew} />
      {/each}
    </div>
  {/if}

  <!-- Edit modal -->
  {#if editingBrew}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="modal-overlay" onclick={() => (editingBrew = null)} onkeydown={() => {}}>
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div class="modal" role="dialog" aria-modal="true" onclick={(e) => e.stopPropagation()} onkeydown={() => {}}>
        <h2 class="modal-title">Edit Brew</h2>

        <div class="row2">
          <input class="input" placeholder="Brand *" bind:value={eBrand} />
          <input class="input" placeholder="Name / blend" bind:value={eName} />
        </div>
        <div class="row2">
          <input class="input" placeholder="Origin" bind:value={eOrigin} />
          <select class="select" bind:value={eRoast}>
            {#each ROAST_LEVELS as r}
              <option value={r.value}>{r.label}</option>
            {/each}
          </select>
        </div>

        <div class="method-row">
          {#each methods as [key, label]}
            <button
              class="method-btn"
              class:selected={eMethod === key}
              onclick={() => (eMethod = key)}
            >{BREW_METHOD_ICONS[key]} {label}</button>
          {/each}
        </div>

        <div class="row3">
          <div class="field">
            <label class="field-label" for="e-amount">Beans (g)</label>
            <input id="e-amount" class="input" type="number" min="1" bind:value={eAmount} />
          </div>
          <div class="field">
            <label class="field-label" for="e-water">Water (ml)</label>
            <input id="e-water" class="input" type="number" min="1" bind:value={eWaterMl} />
          </div>
          <div class="field">
            <label class="field-label" for="e-temp">Temp (°C)</label>
            <input id="e-temp" class="input" type="number" min="20" max="100" bind:value={eWaterTemp} />
          </div>
        </div>

        <div class="row3">
          <div class="field">
            <label class="field-label" for="e-grind">Grind clicks</label>
            <input id="e-grind" class="input" type="number" min="0" max="120" bind:value={eGrind} />
          </div>
          <div class="field">
            <label class="field-label" for="e-bloom">Bloom (s)</label>
            <input id="e-bloom" class="input" type="number" min="0" bind:value={eBloom} />
          </div>
          <div class="field">
            <label class="field-label" for="e-duration">Duration (s)</label>
            <input id="e-duration" class="input" type="number" min="0" bind:value={eDuration} />
          </div>
        </div>

        <div class="field">
          <span class="field-label">Rating</span>
          <RatingInput bind:value={eRating} />
        </div>

        <textarea class="textarea" rows="2" placeholder="Notes" bind:value={eNotes}></textarea>

        <div class="modal-footer">
          <button class="btn btn-ghost" onclick={() => (editingBrew = null)}>Cancel</button>
          <button class="btn btn-primary" onclick={saveEdit} disabled={!eBrand}>Save</button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .filters { display: flex; flex-direction: column; gap: 0.5rem; }
  .filter-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
  .summary-bar {
    display: flex; justify-content: space-between; align-items: center;
    font-size: 0.8rem; color: var(--text-muted);
  }
  .brew-list { display: flex; flex-direction: column; gap: 0.5rem; }
  .empty { text-align: center; padding: 3rem 1rem; color: var(--text-muted); }
  .empty p { margin: 0.25rem 0; }
  .muted { font-size: 0.85rem; }

  .modal-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.6);
    display: flex; align-items: flex-end;
    z-index: 200;
  }
  .modal {
    width: 100%;
    background: var(--surface);
    border-radius: 20px 20px 0 0;
    padding: 1.5rem 1rem 0;
    display: flex; flex-direction: column; gap: 0.65rem;
    max-height: 92dvh; overflow-y: auto;
  }
  .modal-title { font-size: 1.1rem; font-weight: 700; color: var(--text); margin: 0 0 0.25rem; }
  .modal-footer {
    position: sticky;
    bottom: 0;
    background: var(--surface);
    display: flex; justify-content: flex-end; gap: 0.75rem;
    padding: 0.75rem 0 calc(1rem + var(--safe-bottom));
    margin-top: 0.25rem;
  }
  .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
  .row3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem; }
  .field { display: flex; flex-direction: column; gap: 0.3rem; }
  .field-label { font-size: 0.75rem; color: var(--text-muted); }
  .method-row { display: flex; flex-wrap: wrap; gap: 0.35rem; }
  .method-btn {
    padding: 0.3rem 0.55rem; font-size: 0.72rem;
    background: var(--surface-2); border: 1px solid var(--border);
    border-radius: 8px; color: var(--text-muted); cursor: pointer;
  }
  .method-btn.selected {
    background: var(--surface-3); border-color: var(--primary); color: var(--primary-light);
  }
</style>
