<script lang="ts">
  import Timer from '../components/Timer.svelte';
  import RatingInput from '../components/RatingInput.svelte';
  import GrinderSlider from '../components/GrinderSlider.svelte';
  import MethodPicker from '../components/MethodPicker.svelte';
  import { appState, refreshBrews, refreshBeans } from '../stores.svelte';
  import { addBrew, updateBean } from '../db';
  import { generateId, brewRatio, BLOOM_METHODS, ROAST_LEVELS } from '../utils';
  import type { Brew, BrewMethod, RoastLevel } from '../types';

  // --- form state ---
  let useInventoryBean = $state(false);
  let selectedBeanId = $state('');

  let beanBrand = $state('');
  let beanName = $state('');
  let beanOrigin = $state('');
  let beanRoast = $state<RoastLevel>('medium');
  let beanAmount = $state(15);

  let grinderSetting = $state(60);
  let grinderNotes = $state('');

  let method = $state<BrewMethod>('v60');

  let waterMl = $state(250);
  let waterTemp = $state(93);

  let bloomSeconds = $state(0);
  let brewSeconds = $state(0);

  let rating = $state(7);
  let notes = $state('');

  let saving = $state(false);
  let saved = $state(false);

  // --- derived ---
  let ratio = $derived(brewRatio(beanAmount, waterMl));
  let showBloom = $derived(BLOOM_METHODS.includes(method));
  let selectedBean = $derived(appState.beans.find((b) => b.id === selectedBeanId));

  $effect(() => {
    if (selectedBean) {
      beanBrand = selectedBean.brand;
      beanName = selectedBean.name;
      beanOrigin = selectedBean.origin;
      beanRoast = selectedBean.roastLevel as RoastLevel;
    }
  });

  async function save() {
    if (!beanBrand || !beanName) return;
    saving = true;

    const brew: Brew = {
      id: generateId(),
      timestamp: Date.now(),
      beans: {
        brand: beanBrand,
        name: beanName,
        origin: beanOrigin,
        roastLevel: beanRoast,
        amountGrams: beanAmount,
      },
      grinder: { setting: grinderSetting, notes: grinderNotes },
      method,
      water: { amountMl: waterMl, tempCelsius: waterTemp },
      bloomDurationSeconds: bloomSeconds,
      durationSeconds: brewSeconds,
      rating,
      notes,
      synced: false,
    };

    await addBrew(brew);

    // Deduct from inventory if bean was selected
    if (useInventoryBean && selectedBean) {
      const remaining = Math.max(0, selectedBean.remainingGrams - beanAmount);
      await updateBean({ ...selectedBean, remainingGrams: remaining });
      await refreshBeans();
    }

    await refreshBrews();
    saving = false;
    saved = true;
    reset();
    setTimeout(() => (saved = false), 2500);
  }

  function reset() {
    beanBrand = ''; beanName = ''; beanOrigin = ''; beanRoast = 'medium';
    beanAmount = 15; grinderNotes = ''; waterMl = 250; waterTemp = 93;
    bloomSeconds = 0; brewSeconds = 0; rating = 7; notes = '';
    selectedBeanId = '';
  }

  function applyRecipe(id: string) {
    const recipe = appState.recipes.find((r) => r.id === id);
    if (!recipe) return;
    beanBrand = recipe.beanBrand;
    beanName = recipe.beanName;
    beanAmount = recipe.amountGrams;
    grinderSetting = recipe.grinderSetting;
    method = recipe.method;
    waterMl = recipe.waterAmountMl;
    waterTemp = recipe.waterTempCelsius;
    bloomSeconds = recipe.bloomSeconds;
    notes = recipe.notes;
  }
</script>

<div class="page log-page">
  {#if saved}
    <div class="toast">Brew saved!</div>
  {/if}

  <!-- Recipe quick-apply -->
  {#if appState.recipes.length > 0}
    <section class="section">
      <label class="label" for="recipe-select">Quick Recipe</label>
      <select id="recipe-select" class="select" onchange={(e) => applyRecipe((e.target as HTMLSelectElement).value)}>
        <option value="">— select a recipe —</option>
        {#each appState.recipes as r}
          <option value={r.id}>{r.name}</option>
        {/each}
      </select>
    </section>
  {/if}

  <!-- Beans -->
  <section class="section">
    <div class="section-header">
      <span class="label">Beans</span>
      {#if appState.beans.length > 0}
        <label class="toggle-label">
          <input type="checkbox" bind:checked={useInventoryBean} />
          From inventory
        </label>
      {/if}
    </div>

    {#if useInventoryBean && appState.beans.length > 0}
      <select class="select" bind:value={selectedBeanId}>
        <option value="">— pick a bean —</option>
        {#each appState.beans as b}
          <option value={b.id}>{b.brand} — {b.name} ({b.remainingGrams}g left)</option>
        {/each}
      </select>
    {/if}

    <div class="row2">
      <input class="input" placeholder="Brand" bind:value={beanBrand} />
      <input class="input" placeholder="Name / blend" bind:value={beanName} />
    </div>
    <div class="row2">
      <input class="input" placeholder="Origin (optional)" bind:value={beanOrigin} />
      <select class="select" bind:value={beanRoast}>
        {#each ROAST_LEVELS as r}
          <option value={r.value}>{r.label}</option>
        {/each}
      </select>
    </div>
    <div class="row-labeled">
      <label class="input-label" for="bean-amount">Amount</label>
      <div class="input-unit">
        <input id="bean-amount" class="input" type="number" min="1" max="100" step="0.5" bind:value={beanAmount} />
        <span class="unit">g</span>
      </div>
    </div>
  </section>

  <!-- Grinder -->
  <section class="section">
    <span class="label">Grinder (Kingrinder K2)</span>
    <GrinderSlider bind:value={grinderSetting} />
    <input class="input" placeholder="Grinder notes (optional)" bind:value={grinderNotes} />
  </section>

  <!-- Method -->
  <section class="section">
    <span class="label">Brew Method</span>
    <MethodPicker bind:value={method} />
  </section>

  <!-- Water -->
  <section class="section">
    <span class="label">Water</span>
    <div class="row3">
      <div class="input-unit">
        <input class="input" type="number" min="10" max="2000" step="5" bind:value={waterMl} />
        <span class="unit">ml</span>
      </div>
      <div class="input-unit">
        <input class="input" type="number" min="20" max="100" bind:value={waterTemp} />
        <span class="unit">°C</span>
      </div>
      <div class="ratio-badge">
        <span class="ratio-label">Ratio</span>
        <span class="ratio-value">{ratio}</span>
      </div>
    </div>
  </section>

  <!-- Timers -->
  <section class="section">
    <span class="label">Timing</span>
    {#if showBloom}
      <Timer label="Bloom" onDone={(s) => (bloomSeconds = s)} />
    {/if}
    <Timer label="Brew" onDone={(s) => (brewSeconds = s)} />
    <div class="row2">
      {#if showBloom}
        <div class="input-unit">
          <input class="input" type="number" min="0" bind:value={bloomSeconds} />
          <span class="unit">s bloom</span>
        </div>
      {/if}
      <div class="input-unit">
        <input class="input" type="number" min="0" bind:value={brewSeconds} />
        <span class="unit">s total</span>
      </div>
    </div>
  </section>

  <!-- Rating -->
  <section class="section">
    <span class="label">Rating</span>
    <RatingInput bind:value={rating} />
  </section>

  <!-- Notes -->
  <section class="section">
    <span class="label">Notes</span>
    <textarea class="textarea" rows="3" placeholder="Tasting notes, observations..." bind:value={notes}></textarea>
  </section>

  <button class="btn btn-primary btn-lg" onclick={save} disabled={saving || !beanBrand || !beanName}>
    {saving ? 'Saving…' : 'Save Brew'}
  </button>
</div>

<style>
  .log-page {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding-bottom: 2rem;
  }
  .section {
    background: var(--surface);
    border-radius: 14px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .row2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }
  .row3 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 0.5rem;
    align-items: stretch;
  }
  .row-labeled {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .input-label {
    font-size: 0.8rem;
    color: var(--text-muted);
    min-width: 4rem;
  }
  .input-unit {
    position: relative;
    display: flex;
    align-items: center;
  }
  .input-unit .input {
    padding-right: 2.5rem;
  }
  .input-unit .unit {
    position: absolute;
    right: 0.6rem;
    font-size: 0.75rem;
    color: var(--text-muted);
    pointer-events: none;
  }
  .ratio-badge {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: var(--surface-2);
    border-radius: 10px;
    padding: 0.4rem;
  }
  .ratio-label {
    font-size: 0.65rem;
    color: var(--text-muted);
    text-transform: uppercase;
  }
  .ratio-value {
    font-size: 1rem;
    font-weight: 700;
    color: var(--primary-light);
  }
  .toggle-label {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.8rem;
    color: var(--text-muted);
    cursor: pointer;
  }
  .toast {
    position: fixed;
    top: 1rem;
    left: 50%;
    transform: translateX(-50%);
    background: var(--primary);
    color: #1a1008;
    font-weight: 700;
    padding: 0.6rem 1.5rem;
    border-radius: 999px;
    z-index: 100;
    animation: fadeUp 2.5s forwards;
  }
  @keyframes fadeUp {
    0% { opacity: 0; transform: translateX(-50%) translateY(10px); }
    15% { opacity: 1; transform: translateX(-50%) translateY(0); }
    80% { opacity: 1; }
    100% { opacity: 0; }
  }
</style>
