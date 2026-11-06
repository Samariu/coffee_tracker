<script lang="ts">
  import Sheet from '../components/Sheet.svelte';
  import Icon from '../components/Icon.svelte';
  import PageHeader from '../components/PageHeader.svelte';
  import Stepper from '../components/Stepper.svelte';
  import { appState, refreshBeans } from '../stores.svelte';
  import { deleteBean, newId, putBean } from '../db';
  import { toastUndo } from '../toast.svelte';
  import { ROAST_LEVELS, roastLabel } from '../constants';
  import { beanTitle, plural } from '../format';
  import { lastBrewFor } from '../setups';
  import type { Bean } from '../types';

  const today = () => new Date().toISOString().slice(0, 10);

  interface BeanForm {
    id: string | null;
    brand: string;
    name: string;
    origin: string;
    roastLevel: Bean['roastLevel'];
    initialAmountGrams: number;
    remainingGrams: number;
    purchaseDate: string;
    notes: string;
  }

  let sheetOpen = $state(false);
  let form = $state<BeanForm>(blankForm());

  function blankForm(): BeanForm {
    return {
      id: null, brand: '', name: '', origin: '', roastLevel: 'medium',
      initialAmountGrams: 250, remainingGrams: 250, purchaseDate: today(), notes: '',
    };
  }

  /** Stocked bags first, then by how recently they were bought. */
  let beans = $derived(
    appState.beans
      .slice()
      .sort((a, b) => Number(b.remainingGrams > 0) - Number(a.remainingGrams > 0) || b.purchaseDate - a.purchaseDate),
  );
  let totalGrams = $derived(appState.beans.reduce((s, b) => s + b.remainingGrams, 0));

  function openAdd() {
    form = blankForm();
    sheetOpen = true;
  }

  function openEdit(b: Bean) {
    form = { ...b, purchaseDate: new Date(b.purchaseDate).toISOString().slice(0, 10) };
    sheetOpen = true;
  }

  let canSave = $derived(Boolean(form.brand.trim() || form.name.trim()));

  async function save() {
    const { id, purchaseDate, ...rest } = form;
    await putBean({
      ...rest,
      id: id ?? newId(),
      // A new bag starts full; an edit keeps whatever the stepper says is left.
      remainingGrams: id ? Math.min(form.remainingGrams, form.initialAmountGrams) : form.initialAmountGrams,
      purchaseDate: new Date(purchaseDate).getTime() || Date.now(),
    });
    await refreshBeans();
    sheetOpen = false;
  }

  async function remove() {
    const found = appState.beans.find((b) => b.id === form.id);
    if (!found) return;
    // A plain copy: IndexedDB can't clone the $state proxy when Undo puts it back.
    const bean = $state.snapshot(found) as Bean;
    sheetOpen = false;
    await deleteBean(bean.id);
    await refreshBeans();
    toastUndo('Bean removed', async () => {
      await putBean(bean);
      await refreshBeans();
    });
  }

  /** Brews left at your usual dose for this bean. */
  function brewsLeft(b: Bean): number {
    const dose = lastBrewFor(appState.brews, { brand: b.brand, name: b.name })?.beans.amountGrams || 15;
    return Math.floor(b.remainingGrams / dose);
  }

  function daysSince(ts: number): number {
    return Math.max(0, Math.floor((Date.now() - ts) / 86_400_000));
  }

  const roastIndex = (r: Bean['roastLevel']) => ROAST_LEVELS.findIndex((x) => x.value === r);
</script>

<div class="page">
  <PageHeader title="Beans" subtitle={appState.beans.length ? `${totalGrams}g on the shelf` : ''}>
    {#snippet actions()}
      <button class="btn btn-sm btn-primary" onclick={openAdd}><Icon name="plus" size={16} />Add</button>
    {/snippet}
  </PageHeader>

  {#if beans.length === 0}
    <div class="empty">
      <Icon name="bean" size={32} stroke={1.4} />
      <h3>Shelf's empty</h3>
      <p>Add a bag and each brew deducts its dose, so you know when to restock.</p>
      <button class="btn btn-primary" onclick={openAdd}>Add a bag</button>
    </div>
  {:else}
    {#each beans as b (b.id)}
      {@const pct = b.initialAmountGrams ? Math.round((b.remainingGrams / b.initialAmountGrams) * 100) : 0}
      {@const left = brewsLeft(b)}
      <button class="bean" class:empty-bag={b.remainingGrams <= 0} onclick={() => openEdit(b)}>
        <div class="top">
          <div class="titles">
            <span class="brand">{b.brand || 'Unknown roaster'}</span>
            <span class="name">{b.name || 'Unnamed'}</span>
          </div>
          <div class="roast" title="{roastLabel(b.roastLevel)} roast">
            {#each ROAST_LEVELS as r, i (r.value)}
              <span class="dot" class:on={i <= roastIndex(b.roastLevel)}></span>
            {/each}
          </div>
        </div>

        <div class="track"><div class="fill" class:low={pct < 20} style:width="{pct}%"></div></div>

        <div class="facts num">
          <span><b>{b.remainingGrams}g</b> of {b.initialAmountGrams}g</span>
          <span class:warn={left <= 2}>
            {b.remainingGrams <= 0 ? 'Finished' : `~${plural(left, 'brew')} left`}
          </span>
        </div>
        <div class="pills">
          {#if b.origin}<span class="pill">{b.origin}</span>{/if}
          <span class="pill">{roastLabel(b.roastLevel)} roast</span>
          <span class="pill">opened {daysSince(b.purchaseDate)}d ago</span>
        </div>
      </button>
    {/each}
  {/if}
</div>

<Sheet bind:open={sheetOpen} title={form.id ? beanTitle(form.brand, form.name) : 'New bag'}>
  <div class="grid-2">
    <input class="input" placeholder="Roaster" bind:value={form.brand} />
    <input class="input" placeholder="Bean / blend" bind:value={form.name} />
  </div>
  <div class="grid-2">
    <input class="input" placeholder="Origin" bind:value={form.origin} />
    <select class="select" bind:value={form.roastLevel} aria-label="Roast level">
      {#each ROAST_LEVELS as r (r.value)}<option value={r.value}>{r.label} roast</option>{/each}
    </select>
  </div>
  <Stepper label="Bag size" bind:value={form.initialAmountGrams} step={10} coarse={50} min={1} max={5000} unit="g" />
  {#if form.id}
    <Stepper label="Left" bind:value={form.remainingGrams} step={1} coarse={10} min={0} max={form.initialAmountGrams} unit="g" />
  {/if}
  <div class="field">
    <label class="label" for="bean-date">Bought / opened</label>
    <input id="bean-date" class="input" type="date" bind:value={form.purchaseDate} />
  </div>
  <textarea class="textarea" rows="2" placeholder="Notes — tasting notes on the bag, process…" bind:value={form.notes}></textarea>

  {#snippet footer()}
    {#if form.id}
      <button class="icon-btn danger" onclick={remove} aria-label="Remove bean"><Icon name="trash" size={18} /></button>
    {/if}
    <button class="btn btn-ghost" onclick={() => (sheetOpen = false)}>Cancel</button>
    <button class="btn btn-primary" onclick={save} disabled={!canSave}>Save</button>
  {/snippet}
</Sheet>

<style>
  .bean {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
    padding: 16px;
    text-align: left;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    cursor: pointer;
    transition: transform 0.1s;
  }
  .bean:active { transform: scale(0.99); }
  .bean.empty-bag { opacity: 0.55; }
  .top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
  .titles { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .brand { font-size: 0.75rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-3); }
  .name {
    font-family: var(--font-display);
    font-size: 1.3rem;
    font-weight: 500;
    line-height: 1.2;
    letter-spacing: -0.01em;
  }
  .roast { display: flex; gap: 3px; padding-top: 4px; }
  .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--surface-3); }
  .dot.on { background: #a0693c; }
  .track { height: 6px; border-radius: 3px; background: var(--surface-2); overflow: hidden; }
  .fill { height: 100%; border-radius: 3px; background: var(--accent); transition: width 0.3s; }
  .fill.low { background: var(--danger); }
  .facts { display: flex; justify-content: space-between; font-size: 0.82rem; color: var(--text-2); }
  .facts b { color: var(--text); font-weight: 600; }
  .warn { color: var(--warn); }
  .icon-btn.danger { width: 44px; height: 44px; background: var(--danger-soft); color: var(--danger); }
</style>
