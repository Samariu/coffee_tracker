<script lang="ts">
  import { onDestroy } from 'svelte';
  import Timer from '../components/Timer.svelte';
  import RatingInput from '../components/RatingInput.svelte';
  import GrinderSlider from '../components/GrinderSlider.svelte';
  import MethodPicker from '../components/MethodPicker.svelte';
  import Stepper from '../components/Stepper.svelte';
  import SetupStrip from '../components/SetupStrip.svelte';
  import BeanPicker from '../components/BeanPicker.svelte';
  import PageHeader from '../components/PageHeader.svelte';
  import Icon from '../components/Icon.svelte';
  import { appState, refreshBrews, refreshBeans } from '../stores.svelte';
  import { addBrew, deleteBrew, newId, putBean } from '../db';
  import { blankDraft, draftFromValues, loadDraft, nowLocal, saveDraft } from '../draft';
  import { toastUndo } from '../toast.svelte';
  import { METHODS, ROAST_LEVELS } from '../constants';
  import { brewRatio, formatClock } from '../format';
  import {
    beanKey,
    beanOptions,
    brewToValues,
    defaultsFor,
    findInventoryBean,
    recentSetups,
    recipeSetups,
  } from '../setups';
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
  // Typing a bean in starts from an empty one, so this can't be derived from the
  // fields — the first keystroke would hide the inputs being typed into.
  let newBean = $state(!form.brand && !form.name);
  let saving = $state(false);
  let mounted = true;

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  // --- derived ---
  let ratio = $derived(brewRatio(form.amountGrams, form.waterMl));
  let showBloom = $derived(METHODS[form.method].bloom);
  let totalSeconds = $derived((showBloom ? form.bloomSeconds : 0) + form.brewSeconds);
  let beanOpts = $derived(beanOptions(appState.beans, appState.brews, 8));
  let selectedBeanKey = $derived(beanKey(form.brand, form.name));
  let inventoryBean = $derived(form.beanId ? appState.beans.find((b) => b.id === form.beanId) : undefined);

  let setups = $derived.by(() => {
    const hist = recentSetups(appState.brews, 4);
    const keys = new Set(hist.map((s) => s.key));
    return [...hist, ...recipeSetups(appState.recipes, keys)].slice(0, 6);
  });

  /** What's hiding behind "More details", so it isn't out of sight, out of mind. */
  let moreSummary = $derived(
    [
      `${form.waterTemp}°C`,
      totalSeconds > 0 ? formatClock(totalSeconds) : '',
      form.notes ? 'notes' : '',
      form.dateTouched ? 'custom date' : '',
    ].filter(Boolean).join(' · '),
  );

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
    mounted = false;
    if (saveHandle) clearTimeout(saveHandle);
    saveDraft($state.snapshot(form) as LogDraft);
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
      sourceKey: '',
      recipeId: undefined,
    });
    newBean = false;
  }

  function startNewBean() {
    Object.assign(form, {
      beanId: '', brand: '', name: '', origin: '', roastLevel: 'medium',
      sourceKey: '', recipeId: undefined,
    });
    newBean = true;
  }

  /**
   * Always re-derives the numbers: v60 → espresso has to move 250 ml to 36 ml, and
   * keeping a hand-typed 250 there would be worse. A setup prefill sets `method`
   * directly rather than coming through here, so it never clobbers itself.
   */
  function changeMethod(m: BrewMethod) {
    Object.assign(
      form,
      defaultsFor(
        appState.brews,
        { brand: form.brand, name: form.name, method: m },
        form.grinderSetting,
      ),
      { sourceKey: '' },
    );
  }

  // --- save ---
  const num = (v: number, fallback: number) => (Number.isFinite(v) ? v : fallback);
  /** 0.5 g doses mustn't leave 126.49999 g in the bag. */
  const round1 = (v: number) => Math.round(v * 10) / 10;

  async function save() {
    saving = true;

    // A number input that was cleared and never blurred binds `undefined`.
    const amountGrams = num(form.amountGrams, 0);
    const waterMl = num(form.waterMl, 0);

    const brew: Brew = {
      id: newId(),
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
      bloomDurationSeconds: showBloom ? form.bloomSeconds : 0,
      durationSeconds: totalSeconds,
      rating: form.rating,
      notes: form.notes,
      ...(form.recipeId ? { recipeId: form.recipeId } : {}),
      synced: false,
    };

    await addBrew(brew);

    // Deduct from inventory whenever the bean is a linked inventory entry, so a
    // repeat-card prefill deducts too.
    const bean = inventoryBean;
    let deducted = 0;
    if (bean) {
      deducted = Math.min(bean.remainingGrams, amountGrams);
      await putBean({ ...bean, remainingGrams: round1(bean.remainingGrams - deducted) });
      await refreshBeans();
    }

    await refreshBrews();
    saving = false;

    toastUndo('Brew saved', () => undo(brew, bean?.id ?? '', deducted));
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

  async function undo(brew: Brew, beanId: string, grams: number) {
    await deleteBrew(brew.id);
    if (beanId && grams > 0) {
      const bean = appState.beans.find((b) => b.id === beanId);
      if (bean) {
        await putBean({ ...bean, remainingGrams: round1(bean.remainingGrams + grams) });
        await refreshBeans();
      }
    }
    await refreshBrews();

    // Put the brew back in the form so it isn't simply lost — via the draft if
    // the user has already left the page.
    const restored = {
      rating: brew.rating,
      notes: brew.notes,
      bloomSeconds: brew.bloomDurationSeconds,
      brewSeconds: Math.max(0, brew.durationSeconds - brew.bloomDurationSeconds),
    };
    if (mounted) Object.assign(form, restored);
    else saveDraft(draftFromValues(brewToValues(brew), { ...restored, beanId }));
  }
</script>

<div class="page log-page">
  <PageHeader title="New brew" subtitle={today} />

  <SetupStrip {setups} activeKey={form.sourceKey} onpick={applySetup} />

  <section class="section compact">
    <span class="label">Bean</span>
    <BeanPicker
      options={beanOpts}
      selectedKey={newBean ? '' : selectedBeanKey}
      adding={newBean}
      onpick={pickBean}
      onnew={startNewBean}
    />
    {#if newBean}
      <div class="grid-2">
        <input class="input" placeholder="Roaster" bind:value={form.brand} />
        <input class="input" placeholder="Bean / blend" bind:value={form.name} />
      </div>
    {/if}

    <span class="label">Method</span>
    <MethodPicker bind:value={form.method} onchange={changeMethod} />
  </section>

  <section class="section compact">
    <div class="section-head">
      <span class="label">Recipe</span>
      <span class="ratio num"><small>ratio</small> {ratio}</span>
    </div>
    <Stepper label="Dose" bind:value={form.amountGrams} step={0.5} coarse={2} min={1} max={100} unit="g" decimals={1} />
    <Stepper label="Water" bind:value={form.waterMl} step={5} coarse={25} min={10} max={2000} unit="ml" />
    {#if inventoryBean}
      <p class="hint stock num">
        {inventoryBean.remainingGrams}g left in the bag{inventoryBean.remainingGrams >= form.amountGrams
          ? ` → ${round1(inventoryBean.remainingGrams - form.amountGrams)}g after this brew`
          : ' — not enough for this dose'}
      </p>
    {/if}
  </section>

  <section class="section compact">
    <span class="label">Grind · Kingrinder K2</span>
    <GrinderSlider bind:value={form.grinderSetting} />
  </section>

  <section class="section compact">
    <RatingInput bind:value={form.rating} />
  </section>

  <section class="section compact more" class:open={form.showMore}>
    <button class="disclosure" onclick={() => (form.showMore = !form.showMore)} aria-expanded={form.showMore}>
      <span class="label">More details</span>
      <span class="more-summary num">{form.showMore ? '' : moreSummary}</span>
      <span class="chev"><Icon name="chevronDown" size={18} /></span>
    </button>

    {#if form.showMore}
      <Stepper label="Water temp" bind:value={form.waterTemp} step={1} coarse={5} min={1} max={100} unit="°C" />

      {#if showBloom}
        <Timer label="Bloom" bind:value={form.bloomSeconds} />
      {/if}
      <Timer label="Brew" bind:value={form.brewSeconds} />
      {#if showBloom && totalSeconds > 0}
        <p class="hint total num">Total {formatClock(totalSeconds)}</p>
      {/if}

      <textarea class="textarea" rows="3" placeholder="Tasting notes — sweet, bright, bitter finish…" bind:value={form.notes}></textarea>

      <div class="grid-2">
        <input class="input" placeholder="Origin" bind:value={form.origin} />
        <select class="select" bind:value={form.roastLevel} aria-label="Roast level">
          {#each ROAST_LEVELS as r (r.value)}
            <option value={r.value}>{r.label} roast</option>
          {/each}
        </select>
      </div>
      <input class="input" placeholder="Grinder notes" bind:value={form.grinderNotes} />

      <div class="field">
        <label class="label" for="brew-date">Brewed at</label>
        <input
          id="brew-date"
          class="input"
          type="datetime-local"
          bind:value={form.brewDate}
          oninput={() => (form.dateTouched = true)}
        />
      </div>
    {/if}
  </section>

  <div class="save-bar">
    <div class="save-readout num">
      <span class="readout-main">{form.amountGrams}g → {form.waterMl}ml</span>
      <span class="readout-sub">{ratio} · {form.grinderSetting} clicks{form.rating ? ` · ${form.rating}/10` : ''}</span>
    </div>
    <button class="btn btn-primary save-btn" onclick={save} disabled={saving}>
      {saving ? 'Saving…' : 'Save brew'}
    </button>
  </div>
</div>

<style>
  .log-page { padding-bottom: 0; }

  .ratio {
    font-family: var(--font-display);
    font-size: 1.3rem;
    font-weight: 500;
    color: var(--accent-2);
  }
  .ratio small {
    font-family: var(--font);
    font-size: 0.72rem;
    color: var(--text-3);
    margin-right: 4px;
  }
  .stock { padding-top: 2px; }
  .total { text-align: right; color: var(--text-2); }

  .more { gap: 12px; }
  .disclosure {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    margin: -4px 0;
    padding: 4px 0;
    background: none;
    border: none;
    text-align: left;
    cursor: pointer;
  }
  .more-summary {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: right;
    font-size: 0.8rem;
    color: var(--text-3);
  }
  .chev { color: var(--text-3); transition: transform 0.2s; }
  .more.open .chev { transform: rotate(180deg); }
  .more.open .more-summary { visibility: hidden; }

  /* .app-main is the scroll container, so this pins directly above the bottom nav.
     Solid background rather than a blur — iOS flickers sticky compositing layers. */
  .save-bar {
    position: sticky;
    bottom: 0;
    z-index: 5;
    margin: 4px calc(-1 * var(--gutter)) 0;
    padding: 12px var(--gutter);
    background: var(--bg);
    border-top: 1px solid var(--line);
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .save-readout {
    display: flex;
    flex-direction: column;
    min-width: 0;
    line-height: 1.25;
  }
  .readout-main { font-size: 0.95rem; font-weight: 600; white-space: nowrap; }
  .readout-sub { font-size: 0.75rem; color: var(--text-3); white-space: nowrap; }
  .save-btn { flex: 1; min-height: 52px; font-size: 1rem; }
</style>
