<script lang="ts">
  import BrewRow from '../components/BrewRow.svelte';
  import Sheet from '../components/Sheet.svelte';
  import Icon from '../components/Icon.svelte';
  import PageHeader from '../components/PageHeader.svelte';
  import Stepper from '../components/Stepper.svelte';
  import GrinderSlider from '../components/GrinderSlider.svelte';
  import MethodPicker from '../components/MethodPicker.svelte';
  import RatingInput from '../components/RatingInput.svelte';
  import { appState, go, refreshBrews } from '../stores.svelte';
  import { deleteBrew, putBrew } from '../db';
  import { draftFromValues, saveDraft } from '../draft';
  import { toastUndo } from '../toast.svelte';
  import { ALL_METHODS, METHODS, RATING_WORDS, ROAST_LEVELS, roastLabel } from '../constants';
  import { beanTitle, brewRatio, dayLabel, formatDateTime, formatDuration, formatGrindSetting, plural, startOfDay } from '../format';
  import { brewsToCSV, downloadFile, fileDate } from '../files';
  import { brewToValues, findInventoryBean } from '../setups';
  import type { Brew, BrewMethod } from '../types';

  // --- filters ---
  let search = $state('');
  let filterMethod = $state<BrewMethod | ''>('');
  let onlyGood = $state(false);

  /** Only offer filters for methods that actually appear in the journal. */
  let usedMethods = $derived(ALL_METHODS.filter((m) => appState.brews.some((b) => b.method === m)));

  let filtered = $derived.by(() => {
    const q = search.trim().toLowerCase();
    return appState.brews.filter((b) =>
      (!q || [b.beans.brand, b.beans.name, b.beans.origin, b.notes].some((s) => s.toLowerCase().includes(q))) &&
      (!filterMethod || b.method === filterMethod) &&
      (!onlyGood || b.rating >= 8),
    );
  });

  let groups = $derived.by(() => {
    const out: { day: number; label: string; brews: Brew[] }[] = [];
    for (const b of filtered) {
      const day = startOfDay(b.timestamp);
      if (out.at(-1)?.day !== day) out.push({ day, label: dayLabel(b.timestamp), brews: [] });
      out.at(-1)!.brews.push(b);
    }
    return out;
  });

  // --- detail / edit sheet ---
  let selected = $state<Brew | null>(null);
  let sheetOpen = $state(false);
  let editing = $state(false);
  let edit = $state<Brew | null>(null);

  function open(b: Brew) {
    selected = b;
    editing = false;
    sheetOpen = true;
  }

  function startEdit() {
    if (!selected) return;
    edit = $state.snapshot(selected) as Brew;
    editing = true;
  }

  async function saveEdit() {
    if (!edit) return;
    const brew = $state.snapshot(edit) as Brew;
    await putBrew({ ...brew, synced: false });
    await refreshBrews();
    selected = brew;
    editing = false;
  }

  async function remove(brew: Brew) {
    // A plain copy: IndexedDB can't clone the $state proxy when Undo puts it back.
    const b = $state.snapshot(brew) as Brew;
    sheetOpen = false;
    await deleteBrew(b.id);
    await refreshBrews();
    toastUndo('Brew deleted', async () => {
      await putBrew(b);
      await refreshBrews();
    });
  }

  /** Send this brew back to the Log page prefilled — one tap to brew it again. */
  function repeat(b: Brew) {
    const bean = findInventoryBean(appState.beans, b.beans.brand, b.beans.name);
    saveDraft(draftFromValues(brewToValues(b), { beanId: bean?.id ?? '' }));
    go('log');
  }

  function exportCSV() {
    downloadFile(brewsToCSV(filtered), `coffee-brews-${fileDate()}.csv`, 'text/csv;charset=utf-8');
  }
</script>

<div class="page">
  <PageHeader title="Journal" subtitle={plural(appState.brews.length, 'brew')}>
    {#snippet actions()}
      {#if filtered.length > 0}
        <button class="icon-btn" onclick={exportCSV} aria-label="Export CSV"><Icon name="download" size={18} /></button>
      {/if}
    {/snippet}
  </PageHeader>

  {#if appState.brews.length === 0}
    <div class="empty">
      <Icon name="journal" size={32} stroke={1.4} />
      <h3>Nothing brewed yet</h3>
      <p>Every brew you log on the Brew tab lands here.</p>
      <button class="btn btn-primary" onclick={() => go('log')}>Log a brew</button>
    </div>
  {:else}
    <div class="search">
      <Icon name="search" size={18} />
      <input class="input" type="search" placeholder="Search beans, origins, notes" bind:value={search} />
    </div>

    <div class="chip-scroll filters">
      <button class="chip" class:selected={!filterMethod} onclick={() => (filterMethod = '')}>All</button>
      {#each usedMethods as m (m)}
        <button class="chip" class:selected={filterMethod === m} onclick={() => (filterMethod = filterMethod === m ? '' : m)}>
          <Icon method={m} size={16} />{METHODS[m].label}
        </button>
      {/each}
      <button class="chip" class:selected={onlyGood} onclick={() => (onlyGood = !onlyGood)}>Rated 8+</button>
    </div>

    {#if filtered.length === 0}
      <div class="empty">
        <h3>No matches</h3>
        <p>Nothing fits those filters.</p>
      </div>
    {:else}
      {#each groups as g (g.day)}
        <section class="day">
          <h2 class="day-label">{g.label}</h2>
          <div class="list">
            {#each g.brews as b (b.id)}
              <BrewRow brew={b} onopen={open} />
            {/each}
          </div>
        </section>
      {/each}
    {/if}
  {/if}
</div>

<Sheet bind:open={sheetOpen} title={editing ? 'Edit brew' : selected ? beanTitle(selected.beans.brand, selected.beans.name) : ''}>
  {#if selected && !editing}
    {@const b = selected}
    <div class="detail-head">
      <span class="badge"><Icon method={b.method} size={22} /></span>
      <div class="detail-meta">
        <span>{METHODS[b.method].label}</span>
        <span class="muted num">{formatDateTime(b.timestamp)}</span>
      </div>
      {#if b.rating > 0}
        <div class="detail-score">
          <b class="num">{b.rating}</b>
          <span>{RATING_WORDS[b.rating]}</span>
        </div>
      {/if}
    </div>

    <div class="stat-cells">
      <div class="stat-cell"><span class="label">Dose</span><span class="value num">{b.beans.amountGrams}g</span></div>
      <div class="stat-cell"><span class="label">Water</span><span class="value num">{b.water.amountMl}ml</span></div>
      <div class="stat-cell"><span class="label">Ratio</span><span class="value num">{brewRatio(b.beans.amountGrams, b.water.amountMl)}</span></div>
      <div class="stat-cell">
        <span class="label">Grind</span><span class="value num">{b.grinder.setting}</span>
        <span class="sub num">{formatGrindSetting(b.grinder.setting)}</span>
      </div>
      <div class="stat-cell"><span class="label">Temp</span><span class="value num">{b.water.tempCelsius}°C</span></div>
      <div class="stat-cell">
        <span class="label">Time</span><span class="value num">{formatDuration(b.durationSeconds)}</span>
        {#if b.bloomDurationSeconds > 0}<span class="sub num">{b.bloomDurationSeconds}s bloom</span>{/if}
      </div>
    </div>

    <div class="pills">
      <span class="pill">{roastLabel(b.beans.roastLevel)} roast</span>
      {#if b.beans.origin}<span class="pill">{b.beans.origin}</span>{/if}
    </div>

    {#if b.notes}<p class="notes">{b.notes}</p>{/if}
    {#if b.grinder.notes}<p class="notes muted">Grinder: {b.grinder.notes}</p>{/if}

  {:else if editing && edit}
    <div class="grid-2">
      <input class="input" placeholder="Roaster" bind:value={edit.beans.brand} />
      <input class="input" placeholder="Bean / blend" bind:value={edit.beans.name} />
    </div>
    <div class="grid-2">
      <input class="input" placeholder="Origin" bind:value={edit.beans.origin} />
      <select class="select" bind:value={edit.beans.roastLevel} aria-label="Roast level">
        {#each ROAST_LEVELS as r (r.value)}<option value={r.value}>{r.label} roast</option>{/each}
      </select>
    </div>
    <MethodPicker bind:value={edit.method} methods={ALL_METHODS} />
    <Stepper label="Dose" bind:value={edit.beans.amountGrams} step={0.5} min={1} max={100} unit="g" decimals={1} />
    <Stepper label="Water" bind:value={edit.water.amountMl} step={5} min={10} max={2000} unit="ml" />
    <Stepper label="Temp" bind:value={edit.water.tempCelsius} step={1} min={1} max={100} unit="°C" />
    <Stepper label="Bloom" bind:value={edit.bloomDurationSeconds} step={5} min={0} max={600} unit="s" />
    <Stepper label="Total time" bind:value={edit.durationSeconds} step={5} min={0} max={86400} unit="s" />
    <GrinderSlider bind:value={edit.grinder.setting} />
    <RatingInput bind:value={edit.rating} />
    <textarea class="textarea" rows="3" placeholder="Tasting notes" bind:value={edit.notes}></textarea>
    <input class="input" placeholder="Grinder notes" bind:value={edit.grinder.notes} />
  {/if}

  {#snippet footer()}
    {#if editing}
      <button class="btn btn-ghost" onclick={() => (editing = false)}>Cancel</button>
      <button class="btn btn-primary" onclick={saveEdit}>Save changes</button>
    {:else if selected}
      {@const b = selected}
      <button class="icon-btn danger" onclick={() => remove(b)} aria-label="Delete brew"><Icon name="trash" size={18} /></button>
      <button class="btn btn-secondary" onclick={startEdit}><Icon name="edit" size={16} />Edit</button>
      <button class="btn btn-primary" onclick={() => repeat(b)}><Icon name="repeat" size={16} />Brew again</button>
    {/if}
  {/snippet}
</Sheet>

<style>
  .search { position: relative; display: flex; align-items: center; color: var(--text-3); }
  .search :global(svg) { position: absolute; left: 14px; pointer-events: none; }
  .search .input { padding-left: 42px; border-radius: 999px; }
  .filters { --chip-bleed: var(--gutter); }

  .day { display: flex; flex-direction: column; gap: 8px; margin-top: 4px; }
  .day-label {
    margin: 0;
    padding: 0 4px;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-2);
  }
  .list :global(.row + .row) { border-top: 1px solid var(--line); }

  .detail-head { display: flex; align-items: center; gap: 12px; }
  .badge {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border-radius: 14px;
    background: var(--surface-2);
    color: var(--text-2);
  }
  .detail-meta { flex: 1; display: flex; flex-direction: column; font-weight: 600; }
  .muted { font-size: 0.8rem; font-weight: 400; color: var(--text-3); }
  .detail-score { display: flex; flex-direction: column; align-items: flex-end; }
  .detail-score b {
    font-family: var(--font-display);
    font-size: 2rem;
    font-weight: 500;
    line-height: 1;
    color: var(--accent-2);
  }
  .detail-score span { font-size: 0.75rem; color: var(--text-3); }
  .notes {
    margin: 0;
    padding: 12px 14px;
    background: var(--surface-2);
    border-radius: var(--radius-sm);
    font-size: 0.9rem;
    line-height: 1.5;
  }
  .notes.muted { color: var(--text-2); }
  .icon-btn.danger { width: 44px; height: 44px; background: var(--danger-soft); color: var(--danger); }
</style>
