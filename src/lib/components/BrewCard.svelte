<script lang="ts">
  import type { Brew } from '../types';
  import { BREW_METHODS, BREW_METHOD_ICONS, brewRatio, formatDuration, formatDateTime, formatGrindSetting } from '../utils';

  let {
    brew,
    onDelete,
    onEdit,
  }: {
    brew: Brew;
    onDelete: (id: string) => void;
    onEdit: (id: string) => void;
  } = $props();

  let expanded = $state(false);

  let ratingLabel = $derived(brew.rating > 0 ? `${brew.rating}/10` : '—');
</script>

<article class="card" class:expanded>
  <button class="card-header" onclick={() => (expanded = !expanded)}>
    <div class="card-meta">
      <span class="card-method">{BREW_METHOD_ICONS[brew.method]} {BREW_METHODS[brew.method]}</span>
      <span class="card-date">{formatDateTime(brew.timestamp)}</span>
    </div>
    <div class="card-summary">
      <span class="card-bean">{brew.beans.brand}{brew.beans.name ? ` — ${brew.beans.name}` : ''}</span>
      <div class="card-pills">
        <span class="pill">{brew.beans.amountGrams}g</span>
        <span class="pill">{brew.water.amountMl}ml</span>
        <span class="pill ratio">{brewRatio(brew.beans.amountGrams, brew.water.amountMl)}</span>
        <span class="pill rating" class:unrated={brew.rating === 0}>{ratingLabel}</span>
      </div>
    </div>
    <span class="chevron" class:open={expanded}>›</span>
  </button>

  {#if expanded}
    <div class="card-body">
      <div class="detail-grid">
        <div class="detail">
          <span class="detail-label">Grind</span>
          <span class="detail-value">{brew.grinder.setting} clicks<br><small>{formatGrindSetting(brew.grinder.setting)}</small></span>
        </div>
        <div class="detail">
          <span class="detail-label">Water</span>
          <span class="detail-value">{brew.water.tempCelsius}°C</span>
        </div>
        {#if brew.bloomDurationSeconds > 0}
          <div class="detail">
            <span class="detail-label">Bloom</span>
            <span class="detail-value">{formatDuration(brew.bloomDurationSeconds)}</span>
          </div>
        {/if}
        <div class="detail">
          <span class="detail-label">Duration</span>
          <span class="detail-value">{formatDuration(brew.durationSeconds)}</span>
        </div>
        <div class="detail">
          <span class="detail-label">Roast</span>
          <span class="detail-value">{brew.beans.roastLevel}</span>
        </div>
        {#if brew.beans.origin}
          <div class="detail">
            <span class="detail-label">Origin</span>
            <span class="detail-value">{brew.beans.origin}</span>
          </div>
        {/if}
      </div>

      {#if brew.notes}
        <p class="card-notes">{brew.notes}</p>
      {/if}
      {#if brew.grinder.notes}
        <p class="card-notes muted">Grinder: {brew.grinder.notes}</p>
      {/if}

      <div class="card-actions">
        <button class="btn btn-ghost btn-sm" onclick={() => onEdit(brew.id)}>Edit</button>
        <button class="btn btn-danger btn-sm" onclick={() => onDelete(brew.id)}>Delete</button>
      </div>
    </div>
  {/if}
</article>

<style>
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    overflow: hidden;
    transition: border-color 0.15s;
  }
  .card.expanded { border-color: var(--primary); }
  .card-header {
    width: 100%;
    text-align: left;
    padding: 0.9rem 1rem;
    background: none;
    border: none;
    cursor: pointer;
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 0.35rem;
    color: var(--text);
  }
  .card-meta {
    grid-column: 1;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .card-method { font-size: 0.8rem; color: var(--primary-light); font-weight: 600; }
  .card-date { font-size: 0.75rem; color: var(--text-muted); }
  .card-summary { grid-column: 1; display: flex; flex-direction: column; gap: 0.35rem; }
  .card-bean { font-size: 0.95rem; font-weight: 600; }
  .card-pills { display: flex; gap: 0.35rem; flex-wrap: wrap; }
  .pill {
    font-size: 0.72rem;
    padding: 0.15rem 0.5rem;
    background: var(--surface-2);
    border-radius: 20px;
    color: var(--text-muted);
  }
  .pill.ratio { color: var(--text); }
  .pill.rating { background: var(--surface-3); color: var(--primary-light); font-weight: 600; }
  .pill.rating.unrated { color: var(--text-muted); font-weight: 400; }
  .chevron {
    grid-column: 2;
    grid-row: 1 / 3;
    align-self: center;
    font-size: 1.3rem;
    color: var(--text-muted);
    transition: transform 0.2s;
    display: inline-block;
  }
  .chevron.open { transform: rotate(90deg); }
  .card-body {
    padding: 0.75rem 1rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    border-top: 1px solid var(--border);
  }
  .detail-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; }
  .detail { display: flex; flex-direction: column; gap: 0.1rem; }
  .detail-label { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
  .detail-value { font-size: 0.9rem; color: var(--text); font-weight: 500; }
  .detail-value small { font-size: 0.75rem; color: var(--text-muted); font-weight: 400; }
  .card-notes {
    font-size: 0.85rem; color: var(--text);
    background: var(--surface-2);
    padding: 0.6rem 0.75rem; border-radius: 8px; margin: 0; line-height: 1.5;
  }
  .card-notes.muted { color: var(--text-muted); }
  .card-actions { display: flex; gap: 0.5rem; }
</style>
