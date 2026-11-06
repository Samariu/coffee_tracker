<script lang="ts">
  import Sheet from '../components/Sheet.svelte';
  import Icon from '../components/Icon.svelte';
  import PageHeader from '../components/PageHeader.svelte';
  import Stepper from '../components/Stepper.svelte';
  import GrinderSlider from '../components/GrinderSlider.svelte';
  import MethodPicker from '../components/MethodPicker.svelte';
  import { appState, go, refreshRecipes } from '../stores.svelte';
  import { deleteRecipe, newId, putRecipe } from '../db';
  import { draftFromValues, saveDraft } from '../draft';
  import { toastUndo } from '../toast.svelte';
  import { ALL_METHODS, METHODS } from '../constants';
  import { beanTitle, brewRatio, formatGrindSetting } from '../format';
  import { recipeToValues } from '../setups';
  import type { Recipe } from '../types';

  let sheetOpen = $state(false);
  let form = $state<Recipe>(blankRecipe());
  let isNew = $state(true);

  function blankRecipe(): Recipe {
    return {
      id: '', name: '', beanBrand: '', beanName: '',
      amountGrams: 15, grinderSetting: 60, method: 'v60',
      waterAmountMl: 250, waterTempCelsius: 93, bloomSeconds: 0,
      notes: '', createdAt: 0,
    };
  }

  let recipes = $derived(appState.recipes.slice().sort((a, b) => b.createdAt - a.createdAt));

  function openAdd() {
    form = blankRecipe();
    isNew = true;
    sheetOpen = true;
  }

  function openEdit(r: Recipe) {
    form = { ...r };
    isNew = false;
    sheetOpen = true;
  }

  async function save() {
    const recipe = $state.snapshot(form) as Recipe;
    await putRecipe(isNew ? { ...recipe, id: newId(), createdAt: Date.now() } : recipe);
    await refreshRecipes();
    sheetOpen = false;
  }

  async function remove() {
    const found = appState.recipes.find((r) => r.id === form.id);
    if (!found) return;
    // A plain copy: IndexedDB can't clone the $state proxy when Undo puts it back.
    const recipe = $state.snapshot(found) as Recipe;
    sheetOpen = false;
    await deleteRecipe(recipe.id);
    await refreshRecipes();
    toastUndo('Recipe deleted', async () => {
      await putRecipe(recipe);
      await refreshRecipes();
    });
  }

  /** Hand the recipe to the Log page as a draft rather than blind-saving a brew.
   *  You still get to rate it, your notes survive, and inventory gets deducted. */
  function brew(r: Recipe) {
    saveDraft(
      draftFromValues(recipeToValues(r), {
        recipeId: r.id,
        sourceKey: `recipe:${r.id}`,
        notes: r.notes,
      }),
    );
    go('log');
  }
</script>

<div class="page">
  <PageHeader title="Recipes" subtitle={recipes.length ? `${recipes.length} saved` : ''}>
    {#snippet actions()}
      <button class="btn btn-sm btn-primary" onclick={openAdd}><Icon name="plus" size={16} />New</button>
    {/snippet}
  </PageHeader>

  {#if recipes.length === 0}
    <div class="empty">
      <Icon name="recipe" size={32} stroke={1.4} />
      <h3>No recipes yet</h3>
      <p>Save a combination that worked and it shows up as a one-tap card on the Brew tab.</p>
      <button class="btn btn-primary" onclick={openAdd}>New recipe</button>
    </div>
  {:else}
    {#each recipes as r (r.id)}
      <article class="recipe">
        <button class="body" onclick={() => openEdit(r)}>
          <div class="top">
            <span class="badge"><Icon method={r.method} size={20} /></span>
            <div class="titles">
              <span class="name">{r.name || 'Untitled recipe'}</span>
              <span class="sub">
                {METHODS[r.method].label}{#if r.beanBrand || r.beanName} · {beanTitle(r.beanBrand, r.beanName)}{/if}
              </span>
            </div>
          </div>
          <div class="stat-cells">
            <div class="stat-cell"><span class="label">Dose</span><span class="value num">{r.amountGrams}g</span></div>
            <div class="stat-cell"><span class="label">Water</span><span class="value num">{r.waterAmountMl}ml</span></div>
            <div class="stat-cell"><span class="label">Ratio</span><span class="value num">{brewRatio(r.amountGrams, r.waterAmountMl)}</span></div>
          </div>
          <div class="pills">
            <span class="pill"><b>{r.grinderSetting}</b> clicks · {formatGrindSetting(r.grinderSetting)}</span>
            <span class="pill"><b>{r.waterTempCelsius}</b>°C</span>
            {#if r.bloomSeconds > 0}<span class="pill"><b>{r.bloomSeconds}s</b> bloom</span>{/if}
          </div>
          {#if r.notes}<p class="notes">{r.notes}</p>{/if}
        </button>
        <button class="btn btn-secondary brew-btn" onclick={() => brew(r)}>
          <Icon name="brew" size={16} />Brew this
        </button>
      </article>
    {/each}
  {/if}
</div>

<Sheet bind:open={sheetOpen} title={isNew ? 'New recipe' : 'Edit recipe'}>
  <input class="input" placeholder="Name — e.g. Weekend V60" bind:value={form.name} />
  <div class="grid-2">
    <input class="input" placeholder="Roaster" bind:value={form.beanBrand} />
    <input class="input" placeholder="Bean / blend" bind:value={form.beanName} />
  </div>
  <MethodPicker bind:value={form.method} methods={ALL_METHODS} />
  <Stepper label="Dose" bind:value={form.amountGrams} step={0.5} min={1} max={100} unit="g" decimals={1} />
  <Stepper label="Water" bind:value={form.waterAmountMl} step={5} coarse={25} min={10} max={2000} unit="ml" />
  <Stepper label="Temp" bind:value={form.waterTempCelsius} step={1} min={1} max={100} unit="°C" />
  <Stepper label="Bloom" bind:value={form.bloomSeconds} step={5} min={0} max={300} unit="s" />
  <GrinderSlider bind:value={form.grinderSetting} />
  <textarea class="textarea" rows="2" placeholder="Notes — pour schedule, agitation…" bind:value={form.notes}></textarea>

  {#snippet footer()}
    {#if !isNew}
      <button class="icon-btn danger" onclick={remove} aria-label="Delete recipe"><Icon name="trash" size={18} /></button>
    {/if}
    <button class="btn btn-ghost" onclick={() => (sheetOpen = false)}>Cancel</button>
    <button class="btn btn-primary" onclick={save} disabled={!form.name.trim()}>Save</button>
  {/snippet}
</Sheet>

<style>
  .recipe {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: var(--radius);
  }
  .body {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 0;
    background: none;
    border: 0;
    text-align: left;
    cursor: pointer;
  }
  .top { display: flex; align-items: center; gap: 12px; }
  .badge {
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    border-radius: 13px;
    background: var(--accent-soft);
    color: var(--accent-2);
    flex-shrink: 0;
  }
  .titles { display: flex; flex-direction: column; min-width: 0; }
  .name {
    font-family: var(--font-display);
    font-size: 1.25rem;
    font-weight: 500;
    letter-spacing: -0.01em;
  }
  .sub { font-size: 0.8rem; color: var(--text-3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .notes { margin: 0; font-size: 0.85rem; color: var(--text-2); line-height: 1.5; }
  .brew-btn { width: 100%; }
  .icon-btn.danger { width: 44px; height: 44px; background: var(--danger-soft); color: var(--danger); }
</style>
