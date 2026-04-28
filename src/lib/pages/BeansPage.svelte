<script lang="ts">
  import { appState, refreshBeans } from '../stores.svelte';
  import { addBean, updateBean, deleteBean } from '../db';
  import { generateId, ROAST_LEVELS, formatDate } from '../utils';
  import type { Bean, RoastLevel } from '../types';

  let showForm = $state(false);
  let editingId = $state<string | null>(null);

  let brand = $state('');
  let name = $state('');
  let origin = $state('');
  let roastLevel = $state<RoastLevel>('medium');
  let initialAmount = $state(250);
  let purchaseDate = $state(new Date().toISOString().slice(0, 10));
  let beanNotes = $state('');

  function openAdd() {
    editingId = null;
    brand = ''; name = ''; origin = ''; roastLevel = 'medium';
    initialAmount = 250; purchaseDate = new Date().toISOString().slice(0, 10); beanNotes = '';
    showForm = true;
  }

  function openEdit(b: Bean) {
    editingId = b.id;
    brand = b.brand; name = b.name; origin = b.origin; roastLevel = b.roastLevel as RoastLevel;
    initialAmount = b.initialAmountGrams;
    purchaseDate = new Date(b.purchaseDate).toISOString().slice(0, 10);
    beanNotes = b.notes;
    showForm = true;
  }

  async function save() {
    if (!brand || !name) return;
    if (editingId) {
      const existing = appState.beans.find((b) => b.id === editingId)!;
      await updateBean({
        ...existing,
        brand, name, origin, roastLevel,
        initialAmountGrams: initialAmount,
        purchaseDate: new Date(purchaseDate).getTime(),
        notes: beanNotes,
      });
    } else {
      await addBean({
        id: generateId(),
        brand, name, origin, roastLevel,
        initialAmountGrams: initialAmount,
        remainingGrams: initialAmount,
        purchaseDate: new Date(purchaseDate).getTime(),
        notes: beanNotes,
      });
    }
    await refreshBeans();
    showForm = false;
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this bean from inventory?')) return;
    await deleteBean(id);
    await refreshBeans();
  }

  function stockPercent(b: Bean): number {
    return Math.round((b.remainingGrams / b.initialAmountGrams) * 100);
  }
</script>

<div class="page">
  <div class="page-header">
    <span class="page-title">Bean Inventory</span>
    <button class="btn btn-primary btn-sm" onclick={openAdd}>+ Add Bean</button>
  </div>

  {#if appState.beans.length === 0}
    <div class="empty">
      <p>No beans in inventory.</p>
      <p class="muted">Track your bags to monitor stock levels.</p>
    </div>
  {:else}
    <div class="bean-list">
      {#each appState.beans as b (b.id)}
        {@const pct = stockPercent(b)}
        <div class="bean-card" class:low={pct < 20}>
          <div class="bean-main">
            <div class="bean-info">
              <span class="bean-name">{b.brand} — {b.name}</span>
              <span class="bean-meta">{b.roastLevel} · {b.origin || 'Unknown origin'}</span>
              {#if b.notes}<span class="bean-meta muted">{b.notes}</span>{/if}
            </div>
            <div class="bean-actions">
              <button class="btn btn-ghost btn-sm" onclick={() => openEdit(b)}>Edit</button>
              <button class="btn btn-danger btn-sm" onclick={() => handleDelete(b.id)}>×</button>
            </div>
          </div>
          <div class="stock">
            <div class="stock-bar">
              <div class="stock-fill" style="width:{pct}%" class:low={pct < 20}></div>
            </div>
            <span class="stock-text">{b.remainingGrams}g / {b.initialAmountGrams}g</span>
          </div>
          <span class="bean-date">Purchased {formatDate(b.purchaseDate)}</span>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Add / Edit form modal -->
  {#if showForm}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="modal-overlay" onclick={() => (showForm = false)} onkeydown={() => {}}>
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div class="modal" role="dialog" aria-modal="true" onclick={(e) => e.stopPropagation()} onkeydown={() => {}}>
        <h2 class="modal-title">{editingId ? 'Edit Bean' : 'Add Bean'}</h2>

        <div class="row2">
          <input class="input" placeholder="Brand *" bind:value={brand} />
          <input class="input" placeholder="Name / blend *" bind:value={name} />
        </div>
        <div class="row2">
          <input class="input" placeholder="Origin" bind:value={origin} />
          <select class="select" bind:value={roastLevel}>
            {#each ROAST_LEVELS as r}
              <option value={r.value}>{r.label}</option>
            {/each}
          </select>
        </div>
        <div class="row2">
          <div class="input-unit">
            <input class="input" type="number" min="1" max="5000" bind:value={initialAmount} />
            <span class="unit">g</span>
          </div>
          <input class="input" type="date" bind:value={purchaseDate} />
        </div>
        <textarea class="textarea" rows="2" placeholder="Notes (optional)" bind:value={beanNotes}></textarea>

        <div class="modal-footer">
          <button class="btn btn-ghost" onclick={() => (showForm = false)}>Cancel</button>
          <button class="btn btn-primary" onclick={save} disabled={!brand || !name}>Save</button>
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
  .bean-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .bean-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 0.9rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    transition: border-color 0.2s;
  }
  .bean-card.low { border-color: #c07030; }
  .bean-main {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.5rem;
  }
  .bean-info { display: flex; flex-direction: column; gap: 0.2rem; min-width: 0; }
  .bean-name { font-weight: 600; color: var(--text); font-size: 0.95rem; }
  .bean-meta { font-size: 0.75rem; color: var(--text-muted); }
  .bean-meta.muted { font-style: italic; }
  .bean-actions { display: flex; gap: 0.4rem; flex-shrink: 0; }
  .stock { display: flex; align-items: center; gap: 0.75rem; }
  .stock-bar { flex: 1; height: 6px; background: var(--surface-3); border-radius: 3px; }
  .stock-fill { height: 100%; background: var(--primary); border-radius: 3px; transition: width 0.3s; }
  .stock-fill.low { background: #c07030; }
  .stock-text { font-size: 0.75rem; color: var(--text-muted); white-space: nowrap; }
  .bean-date { font-size: 0.72rem; color: var(--text-muted); }
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    display: flex;
    align-items: flex-end;
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
  }
  .modal-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text);
    margin: 0 0 0.25rem;
  }
  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 0.5rem;
  }
  .row2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }
  .input-unit { position: relative; display: flex; align-items: center; }
  .input-unit .input { padding-right: 2rem; }
  .input-unit .unit {
    position: absolute; right: 0.6rem;
    font-size: 0.75rem; color: var(--text-muted); pointer-events: none;
  }
  .empty {
    text-align: center;
    padding: 3rem 1rem;
    color: var(--text-muted);
  }
  .empty p { margin: 0.25rem 0; }
  .muted { font-size: 0.85rem; }
</style>
