<script lang="ts">
  import { onDestroy } from 'svelte';
  import Timer from '../components/Timer.svelte';
  import RatingInput from '../components/RatingInput.svelte';
  import GrinderSlider from '../components/GrinderSlider.svelte';
  import MethodPicker from '../components/MethodPicker.svelte';
  import Stepper from '../components/Stepper.svelte';
  import SetupStrip from '../components/SetupStrip.svelte';
  import BeanPicker from '../components/BeanPicker.svelte';
  import { appState, refreshBrews, refreshBeans } from '../stores.svelte';
  import { addBrew, deleteBrew, updateBean } from '../db';
  import { blankDraft, loadDraft, nowLocal, saveDraft } from '../draft';
  import {
    generateId,
    brewRatio,
    beanKey,
    beanOptions,
    defaultsFor,
    findInventoryBean,
    recentSetups,
    recipeSetups,
    BLOOM_METHODS,
    ROAST_LEVELS,
  } from '../utils';
  import type { BeanOption, Brew, BrewMethod, LogDraft, Setup } from '../types';

  /**
   * The form never starts empty. A saved draft wins; otherwise seed from the most
   * recent brew, so the common case ("same as yesterday") is rate → Save.
   */
  function initialForm(): LogDraft {
    const draft = loadDraft();
    if (draft) {
      return {
        ...blankDraft(),
        ...draft,
        brewDate: draft.dateTouched ? draft.brewDate : nowLocal(),
      };
    }
    const [last] = recentSetups(appState.brews, 1);
    if (!last) return blankDraft();
    const bean = findInventoryBean(appState.beans, last.values.brand, last.values.name);
    return { ...blankDraft(), ...last.values, beanId: bean?.id ?? '', sourceKey: last.key };
  }

  let form = $state<LogDraft>(initialForm());
  let newBean = $state(false);
  let saving = $state(false);
  let lastSaved = $state<{ brew: Brew; beanId: string; grams: number } | null>(null);
  let undoTimer: ReturnType<typeof setTimeout> | null = null;

  // --- derived ---
  let ratio = $derived(brewRatio(form.amountGrams, form.waterMl));
  let showBloom = $derived(BLOOM_METHODS.includes(form.method));
  let totalSeconds = $derived(form.bloomSeconds + form.brewSeconds);
  let beanOpts = $derived(beanOptions(appState.beans, appState.brews, 6));
  let selectedBeanKey = $derived(beanKey(form.brand, form.name));

  let setups = $derived.by(() => {
    const hist = recentSetups(appState.brews, 4);
    const keys = new Set(hist.map((s) => s.key));
    return [...hist, ...recipeSetups(appState.recipes, keys)].slice(0, 6);
  });

  // --- draft persistence ---
  let saveHandle: ReturnType<typeof setTimeout> | null = null;
  $effect(() => {
    // Deep read, so every field is tracked. Debounced — a slider drag would
    // otherwise write to localStorage on every frame.
    const snap = $state.snapshot(form) as LogDraft;
    if (saveHandle) clearTimeout(saveHandle);
    saveHandle = setTimeout(() => saveDraft(snap), 300);
    return () => {
      if (saveHandle) clearTimeout(saveHandle);
    };
  });

  // The effect teardown cancels a pending write, so flush on the way out.
  onDestroy(() => {
    if (saveHandle) clearTimeout(saveHandle);
    saveDraft($state.snapshot(form) as LogDraft);
    if (undoTimer) clearTimeout(undoTimer);
  });

  // --- prefill ---
  function applySetup(s: Setup) {
    const bean = findInventoryBean(appState.beans, s.values.brand, s.values.name);
    Object.assign(form, s.values, {
      beanId: bean?.id ?? '',
      recipeId: s.recipeId,
      sourceKey: s.key,
    });
    newBean = false;
  }

  function pickBean(o: BeanOption) {
    Object.assign(form, {
      beanId: o.beanId,
      brand: o.brand,
      name: o.name,
      origin: o.origin,
      roastLevel: o.roastLevel,
      ...defaultsFor(
        appState.brews,
        { brand: o.brand, name: o.name, method: form.method },
        form.grinderSetting,
      ),
    });
    form.sourceKey = '';
    form.recipeId = undefined;
    newBean = false;
  }

  function startNewBean() {
    Object.assign(form, { beanId: '', brand: '', name: '', origin: '', roastLevel: 'medium' });
    form.sourceKey = '';
    form.recipeId = undefined;
    newBean = true;
  }

  /**
   * Always re-derives the numbers: v60 → espresso has to move 250 ml to 36 ml, and
   * keeping a hand-typed 250 there would be worse. A setup prefill sets `method`
   * directly rather than coming through here, so it never clobbers itself.
   */
  function changeMethod(m: BrewMethod) {
    form.method = m;
    Object.assign(
      form,
      defaultsFor(
        appState.brews,
        { brand: form.brand, name: form.name, method: m },
        form.grinderSetting,
      ),
    );
  }

  // --- save ---
  const num = (v: number, fallback: number) => (Number.isFinite(v) ? v : fallback);

  async function save() {
    saving = true;

    // A number input that was cleared and never blurred binds `undefined`.
    const amountGrams = num(form.amountGrams, 0);
    const waterMl = num(form.waterMl, 0);

    const brew: Brew = {
      id: generateId(),
      timestamp: new Date(form.brewDate).getTime() || Date.now(),
      beans: {
        brand: form.brand,
        name: form.name,
        origin: form.origin,
        roastLevel: form.roastLevel,
        amountGrams,
      },
      grinder: { setting: num(form.grinderSetting, 60), notes: form.grinderNotes },
      method: form.method,
      water: { amountMl: waterMl, tempCelsius: num(form.waterTemp, 93) },
      bloomDurationSeconds: form.bloomSeconds,
      durationSeconds: totalSeconds,
      rating: form.rating,
      notes: form.notes,
      ...(form.recipeId ? { recipeId: form.recipeId } : {}),
      synced: false,
    };

    await addBrew(brew);

    // Deduct from inventory whenever the bean is a linked inventory entry — no
    // longer gated behind a checkbox, so a repeat-card prefill deducts too.
    const bean = form.beanId ? appState.beans.find((b) => b.id === form.beanId) : undefined;
    let deducted = 0;
    if (bean) {
      deducted = Math.min(bean.remainingGrams, amountGrams);
      await updateBean({ ...bean, remainingGrams: bean.remainingGrams - deducted });
      await refreshBeans();
    }

    await refreshBrews();
    saving = false;

    lastSaved = { brew, beanId: bean?.id ?? '', grams: deducted };
    if (undoTimer) clearTimeout(undoTimer);
    undoTimer = setTimeout(() => (lastSaved = null), 5000);

    resetForNext();
  }

  /** Keep the setup — you'll probably brew it again tomorrow. Clear only what is
   *  specific to the brew that was just logged. */
  function resetForNext() {
    Object.assign(form, {
      rating: 0,
      notes: '',
      bloomSeconds: 0,
      brewSeconds: 0,
      brewDate: nowLocal(),
      dateTouched: false,
    });
  }

  async function undo() {
    if (!lastSaved) return;
    const { brew, beanId, grams } = lastSaved;
    lastSaved = null;
    if (undoTimer) clearTimeout(undoTimer);

    await deleteBrew(brew.id);
    if (beanId && grams > 0) {
      const bean = appState.beans.find((b) => b.id === beanId);
      if (bean) {
        await updateBean({ ...bean, remainingGrams: bean.remainingGrams + grams });
        await refreshBeans();
      }
    }
    await refreshBrews();

    // Put the brew back in the form so it isn't simply lost.
    Object.assign(form, {
      rating: brew.rating,
      notes: brew.notes,
      bloomSeconds: brew.bloomDurationSeconds,
      brewSeconds: Math.max(0, brew.durationSeconds - brew.bloomDurationSeconds),
    });
  }
</script>

<div class="page log-page">
  {#if lastSaved}
    <div class="toast">
      <span>Brew saved</span>
      <button class="undo" onclick={undo}>Undo</button>
    </div>
  {/if}

  <SetupStrip setups={setups} activeKey={form.sourceKey} onpick={applySetup} />

  <section class="section compact">
    <span class="label">Bean</span>
    <BeanPicker
      options={beanOpts}
      selectedKey={newBean ? '' : selectedBeanKey}
      onpick={pickBean}
      onnew={startNewBean}
    />
    {#if newBean || (!form.brand && !form.name)}
      <div class="row2">
        <input class="input" placeholder="Brand" bind:value={form.brand} />
        <input class="input" placeholder="Name / blend" bind:value={form.name} />
      </div>
    {/if}

    <span class="label">Method</span>
    <MethodPicker bind:value={form.method} onchange={changeMethod} />
  </section>

  <section class="section compact">
    <div class="row-dose">
      <Stepper label="Dose" bind:value={form.amountGrams} step={0.5} coarse={2} min={1} max={100} unit="g" decimals={1} />
      <Stepper label="Water" bind:value={form.waterMl} step={5} coarse={25} min={10} max={2000} unit="ml" />
      <div class="ratio-badge">
        <span class="ratio-label">Ratio</span>
        <span class="ratio-value">{ratio}</span>
      </div>
    </div>

    <span class="label">Grinder (Kingrinder K2)</span>
    <GrinderSlider bind:value={form.grinderSetting} />
  </section>

  <section class="section compact">
    <span class="label">Rating</span>
    <RatingInput bind:value={form.rating} compact />
  </section>

  <button class="disclosure" onclick={() => (form.showMore = !form.showMore)}>
    <span>More details</span>
    <span class="chevron" class:open={form.showMore}>›</span>
  </button>

  {#if form.showMore}
    <section class="section compact">
      <div class="row2">
        <input class="input" placeholder="Origin" bind:value={form.origin} />
        <select class="select" bind:value={form.roastLevel}>
          {#each ROAST_LEVELS as r}
            <option value={r.value}>{r.label}</option>
          {/each}
        </select>
      </div>
      <Stepper label="Water temp" bind:value={form.waterTemp} step={1} coarse={5} min={20} max={100} unit="°C" />
      <input class="input" placeholder="Grinder notes" bind:value={form.grinderNotes} />

      <span class="label">Timing</span>
      {#if showBloom}
        <Timer label="Bloom" bind:value={form.bloomSeconds} />
      {/if}
      <Timer label="Brew" bind:value={form.brewSeconds} />
      {#if showBloom && totalSeconds > 0}
        <div class="total-badge">
          Total: {Math.floor(totalSeconds / 60)}:{String(totalSeconds % 60).padStart(2, '0')}
        </div>
      {/if}

      <span class="label">Notes</span>
      <textarea class="textarea" rows="3" placeholder="Tasting notes, observations..." bind:value={form.notes}></textarea>

      <label class="field-label" for="brew-date">Date &amp; Time</label>
      <input
        id="brew-date"
        class="input"
        type="datetime-local"
        bind:value={form.brewDate}
        oninput={() => (form.dateTouched = true)}
      />
    </section>
  {/if}

  <div class="save-bar">
    <div class="save-readout">
      <span class="readout-main">{form.amountGrams}g · {form.waterMl}ml</span>
      <span class="readout-sub">{ratio}</span>
    </div>
    <button class="btn btn-primary save-btn" onclick={save} disabled={saving}>
      {saving ? 'Saving…' : 'Save Brew'}
    </button>
  </div>
</div>

<style>
  .log-page {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .row2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }
  .row-dose {
    display: grid;
    grid-template-columns: 1fr 1fr auto;
    gap: 0.5rem;
    align-items: end;
  }
  .ratio-badge {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: var(--surface-2);
    border-radius: 10px;
    padding: 0.35rem 0.5rem;
    min-height: 2.75rem;
  }
  .ratio-label {
    font-size: 0.6rem;
    color: var(--text-muted);
    text-transform: uppercase;
  }
  .ratio-value {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--primary-light);
    font-variant-numeric: tabular-nums;
  }
  .total-badge {
    font-size: 0.8rem;
    color: var(--primary-light);
    font-weight: 600;
    text-align: center;
    padding: 0.3rem;
    background: var(--surface-2);
    border-radius: 8px;
  }
  .field-label {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .disclosure {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 0.6rem 1rem;
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 0.8rem;
    font-weight: 600;
    font-family: inherit;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    cursor: pointer;
  }
  .chevron {
    font-size: 1.2rem;
    transition: transform 0.2s;
  }
  .chevron.open { transform: rotate(90deg); }

  /* .app-main is the scroll container, so this pins directly above the bottom nav.
     Solid background rather than a blur — iOS flickers sticky compositing layers. */
  .save-bar {
    position: sticky;
    bottom: 0;
    z-index: 5;
    margin: 0.25rem -0.75rem -0.75rem;
    padding: 0.6rem 0.75rem;
    background: var(--bg);
    box-shadow: 0 -10px 14px -8px rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .save-readout {
    display: flex;
    flex-direction: column;
    line-height: 1.2;
  }
  .readout-main {
    font-size: 0.85rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
  .readout-sub {
    font-size: 0.7rem;
    color: var(--text-muted);
    font-variant-numeric: tabular-nums;
  }
  .save-btn {
    flex: 1;
    padding: 0.85rem;
    font-size: 1rem;
    border-radius: 12px;
  }

  .toast {
    position: fixed;
    top: 1rem;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: var(--primary);
    color: #1a1008;
    font-weight: 700;
    padding: 0.5rem 0.75rem 0.5rem 1.25rem;
    border-radius: 999px;
    z-index: 100;
  }
  .undo {
    background: rgba(0, 0, 0, 0.18);
    border: none;
    border-radius: 999px;
    padding: 0.3rem 0.8rem;
    font-size: 0.8rem;
    font-weight: 700;
    font-family: inherit;
    color: #1a1008;
    cursor: pointer;
  }
</style>
