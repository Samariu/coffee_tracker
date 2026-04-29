<script lang="ts">
  import { appState, refreshRecipes, refreshBrews } from '../stores.svelte';
  import { addRecipe, deleteRecipe, addBrew } from '../db';
  import { generateId, BREW_METHODS, BREW_METHOD_ICONS, ROAST_LEVELS, formatGrindSetting, brewRatio } from '../utils';
  import type { Recipe, BrewMethod, RoastLevel } from '../types';

  let showForm = $state(false);

  let rName = $state('');
  let rBeanBrand = $state('');
  let rBeanName = $state('');
  let rAmount = $state(15);
  let rGrind = $state(60);
  let rMethod = $state<BrewMethod>('v60');
  let rWaterMl = $state(250);
  let rWaterTemp = $state(93);
  let rBloom = $state(0);
  let rNotes = $state('');

  function openAdd() {
    rName = ''; rBeanBrand = ''; rBeanName = '';
    rAmount = 15; rGrind = 60; rMethod = 'v60';
    rWaterMl = 250; rWaterTemp = 93; rBloom = 0; rNotes = '';
    showForm = true;
  }

  async function save() {
    if (!rName || !rBeanBrand) return;
    await addRecipe({
      id: generateId(),
      name: rName,
      beanBrand: rBeanBrand,
      beanName: rBeanName,
      amountGrams: rAmount,
      grinderSetting: rGrind,
      method: rMethod,
      waterAmountMl: rWaterMl,
      waterTempCelsius: rWaterTemp,
      bloomSeconds: rBloom,
      notes: rNotes,
      createdAt: Date.now(),
    });
    await refreshRecipes();
    showForm = false;
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this recipe?')) return;
    await deleteRecipe(id);
    await refreshRecipes();
  }

  async function brewFromRecipe(r: Recipe) {
    await addBrew({
      id: generateId(),
      timestamp: Date.now(),
      beans: {
        brand: r.beanBrand,
        name: r.beanName,
        origin: '',
        roastLevel: 'medium',
        amountGrams: r.amountGrams,
      },
      grinder: { setting: r.grinderSetting, notes: '' },
      method: r.method,
      water: { amountMl: r.waterAmountMl, tempCelsius: r.waterTempCelsius },
      bloomDurationSeconds: r.bloomSeconds,
      durationSeconds: 0,
      rating: 0,
      notes: `From recipe: ${r.name}`,
      recipeId: r.id,
      synced: false,
    });
    await refreshBrews();
    appState.page = 'history';
  }
</script>

<div class="page">
  <div class="page-header">
    <span class="page-title">Recipes</span>
    <button class="btn btn-primary btn-sm" onclick={openAdd}>+ New</button>
  </div>

  {#if appState.recipes.length === 0}
    <div class="empty">
      <p>No recipes saved yet.</p>
      <p class="muted">Save a winning brew combo as a recipe to reuse it.</p>
    </div>
  {:else}
    <div class="recipe-list">
      {#each appState.recipes as r (r.id)}
        <div class="recipe-card">
          <div class="recipe-header">
            <span class="recipe-name">{r.name}</span>
            <div class="recipe-actions">
              <button class="btn btn-ghost btn-sm" onclick={() => brewFromRecipe(r)}>Brew</button>
              <button class="btn btn-danger btn-sm" onclick={() => handleDelete(r.id)}>×</button>
            </div>
          </div>
          <div class="recipe-meta">
            <span>{BREW_METHOD_ICONS[r.method]} {BREW_METHODS[r.method]}</span>
            <span>{r.beanBrand} — {r.beanName}</span>
          </div>
          <div class="recipe-pills">
            <span class="pill">{r.amountGrams}g</span>
            <span class="pill">{r.waterAmountMl}ml</span>
            <span class="pill">{brewRatio(r.amountGrams, r.waterAmountMl)}</span>
            <span class="pill">{r.waterTempCelsius}°C</span>
            <span class="pill">{formatGrindSetting(r.grinderSetting)}</span>
            {#if r.bloomSeconds > 0}
              <span class="pill">{r.bloomSeconds}s bloom</span>
            {/if}
          </div>
          {#if r.notes}
            <p class="recipe-notes">{r.notes}</p>
          {/if}
        </div>
      {/each}
    </div>
  {/if}

  {#if showForm}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="modal-overlay" onclick={() => (showForm = false)} onkeydown={() => {}}>
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div class="modal" role="dialog" aria-modal="true" onclick={(e) => e.stopPropagation()} onkeydown={() => {}}>
        <h2 class="modal-title">New Recipe</h2>

        <input class="input" placeholder="Recipe name *" bind:value={rName} />

        <div class="row2">
          <input class="input" placeholder="Brand *" bind:value={rBeanBrand} />
          <input class="input" placeholder="Bean name" bind:value={rBeanName} />
        </div>

        <div class="method-row">
          {#each Object.entries(BREW_METHODS) as [key, label]}
            <button
              class="method-btn"
              class:selected={rMethod === key}
              onclick={() => (rMethod = key as BrewMethod)}
            >{label}</button>
          {/each}
        </div>

        <div class="row3">
          <div class="input-unit">
            <input class="input" type="number" min="1" max="100" step="0.5" bind:value={rAmount} />
            <span class="unit">g</span>
          </div>
          <div class="input-unit">
            <input class="input" type="number" min="10" max="2000" step="5" bind:value={rWaterMl} />
            <span class="unit">ml</span>
          </div>
          <div class="input-unit">
            <input class="input" type="number" min="20" max="100" bind:value={rWaterTemp} />
            <span class="unit">°C</span>
          </div>
        </div>

        <div class="row2">
          <div class="field">
            <label class="field-label" for="recipe-grind">Grind clicks</label>
            <input id="recipe-grind" class="input" type="number" min="0" max="120" bind:value={rGrind} />
          </div>
          <div class="field">
            <label class="field-label" for="recipe-bloom">Bloom (s)</label>
            <input id="recipe-bloom" class="input" type="number" min="0" bind:value={rBloom} />
          </div>
        </div>

        <textarea class="textarea" rows="2" placeholder="Notes" bind:value={rNotes}></textarea>

        <div class="modal-footer">
          <button class="btn btn-ghost" onclick={() => (showForm = false)}>Cancel</button>
          <button class="btn btn-primary" onclick={save} disabled={!rName}>Save</button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .page-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text);
  }
  .recipe-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .recipe-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 0.9rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .recipe-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .recipe-name { font-weight: 700; font-size: 1rem; color: var(--text); }
  .recipe-actions { display: flex; gap: 0.4rem; }
  .recipe-meta {
    display: flex;
    gap: 0.75rem;
    font-size: 0.8rem;
    color: var(--text-muted);
  }
  .recipe-pills { display: flex; gap: 0.35rem; flex-wrap: wrap; }
  .pill {
    font-size: 0.72rem;
    padding: 0.15rem 0.5rem;
    background: var(--surface-2);
    border-radius: 20px;
    color: var(--text-muted);
  }
  .recipe-notes {
    font-size: 0.82rem;
    color: var(--text-muted);
    margin: 0;
  }
  .modal-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.6);
    display: flex; align-items: flex-end;
    z-index: 50;
  }
  .modal {
    width: 100%;
    background: var(--surface);
    border-radius: 20px 20px 0 0;
    padding: 1.5rem 1rem calc(1.5rem + var(--safe-bottom));
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    max-height: 90vh;
    overflow-y: auto;
  }
  .modal-title { font-size: 1.1rem; font-weight: 700; color: var(--text); margin: 0 0 0.25rem; }
  .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.5rem; }
  .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
  .row3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem; }
  .field { display: flex; flex-direction: column; gap: 0.3rem; }
  .field-label { font-size: 0.75rem; color: var(--text-muted); }
  .input-unit { position: relative; display: flex; align-items: center; }
  .input-unit .input { padding-right: 2rem; }
  .input-unit .unit {
    position: absolute; right: 0.5rem;
    font-size: 0.72rem; color: var(--text-muted); pointer-events: none;
  }
  .method-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }
  .method-btn {
    padding: 0.3rem 0.6rem;
    font-size: 0.75rem;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text-muted);
    cursor: pointer;
  }
  .method-btn.selected {
    background: var(--surface-3);
    border-color: var(--primary);
    color: var(--primary-light);
  }
  .empty { text-align: center; padding: 3rem 1rem; color: var(--text-muted); }
  .empty p { margin: 0.25rem 0; }
  .muted { font-size: 0.85rem; }
</style>
