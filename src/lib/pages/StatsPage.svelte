<script lang="ts">
  import { appState } from '../stores.svelte';
  import { BREW_METHODS, brewRatio } from '../utils';
  import type { Brew, BrewMethod } from '../types';

  interface Stat {
    label: string;
    value: string | number;
    sub?: string;
  }

  let brews = $derived(appState.brews);

  let totalBrews = $derived(brews.length);
  let avgRating = $derived(() => {
    const rated = brews.filter((b) => b.rating > 0);
    return rated.length ? (rated.reduce((s, b) => s + b.rating, 0) / rated.length).toFixed(1) : '—';
  });
  let avgRatio = $derived(() => {
    const valid = brews.filter((b) => b.beans.amountGrams && b.water.amountMl);
    if (!valid.length) return '—';
    const avg = valid.reduce((s, b) => s + b.water.amountMl / b.beans.amountGrams, 0) / valid.length;
    return `1:${avg.toFixed(1)}`;
  });

  // Best-rated bean
  interface BeanGroup { sum: number; count: number }
  let beanRatings = $derived(() => {
    const map = new Map<string, BeanGroup>();
    for (const b of brews) {
      if (b.rating === 0) continue;
      const key = `${b.beans.brand} — ${b.beans.name}`;
      const cur = map.get(key) ?? { sum: 0, count: 0 };
      map.set(key, { sum: cur.sum + b.rating, count: cur.count + 1 });
    }
    return [...map.entries()]
      .map(([name, { sum, count }]) => ({ name, avg: sum / count, count }))
      .sort((a, b) => b.avg - a.avg);
  });

  // Method breakdown
  let methodCounts = $derived(() => {
    const map = new Map<BrewMethod, number>();
    for (const b of brews) {
      map.set(b.method, (map.get(b.method) ?? 0) + 1);
    }
    return [...map.entries()]
      .map(([method, count]) => ({ method, label: BREW_METHODS[method], count }))
      .sort((a, b) => b.count - a.count);
  });

  // Grind sweet spots per bean
  let grindSweetSpots = $derived(() => {
    const map = new Map<string, Brew[]>();
    for (const b of brews) {
      const key = `${b.beans.brand} — ${b.beans.name}`;
      const arr = map.get(key) ?? [];
      arr.push(b);
      map.set(key, arr);
    }
    return [...map.entries()].map(([name, entries]) => {
      const best = entries.filter((e) => e.rating >= 8);
      if (!best.length) return null;
      const avgClick = Math.round(best.reduce((s, e) => s + e.grinder.setting, 0) / best.length);
      return { name, avgClick, count: best.length };
    }).filter(Boolean) as { name: string; avgClick: number; count: number }[];
  });

  // Rating over time (last 20 rated brews)
  let ratingTrend = $derived(brews.filter((b) => b.rating > 0).slice(0, 20).reverse());
  let maxRating = 10;
</script>

<div class="page">
  {#if totalBrews === 0}
    <div class="empty">
      <p>No data yet — log some brews first.</p>
    </div>
  {:else}
    <!-- Overview cards -->
    <div class="stat-grid">
      <div class="stat-card">
        <span class="stat-value">{totalBrews}</span>
        <span class="stat-label">Total brews</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{avgRating()}</span>
        <span class="stat-label">Avg rating</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{avgRatio()}</span>
        <span class="stat-label">Avg ratio</span>
      </div>
    </div>

    <!-- Rating trend chart (sparkline) -->
    {#if ratingTrend.length > 1}
      <section class="section">
        <span class="label">Rating Trend (last {ratingTrend.length})</span>
        <div class="sparkline">
          {#each ratingTrend as brew, i}
            {@const h = (brew.rating / maxRating) * 100}
            <div class="spark-bar" style="height:{h}%" title="{brew.rating}/10">
              <span class="spark-tip">{brew.rating}</span>
            </div>
          {/each}
        </div>
      </section>
    {/if}

    <!-- Best beans -->
    {#if beanRatings().length > 0}
      <section class="section">
        <span class="label">Beans by Rating</span>
        {#each beanRatings().slice(0, 8) as item}
          <div class="rank-row">
            <span class="rank-name">{item.name}</span>
            <span class="rank-sub">{item.count} brew{item.count !== 1 ? 's' : ''}</span>
            <div class="rank-bar-wrap">
              <div class="rank-bar" style="width:{(item.avg / 10) * 100}%"></div>
            </div>
            <span class="rank-val">{item.avg.toFixed(1)}</span>
          </div>
        {/each}
      </section>
    {/if}

    <!-- Grind sweet spots -->
    {#if grindSweetSpots().length > 0}
      <section class="section">
        <span class="label">Grind Sweet Spots (rating ≥ 8)</span>
        {#each grindSweetSpots() as spot}
          <div class="rank-row">
            <span class="rank-name">{spot.name}</span>
            <span class="rank-sub">{spot.count} brew{spot.count !== 1 ? 's' : ''}</span>
            <span class="rank-val highlight">{spot.avgClick} clicks</span>
          </div>
        {/each}
      </section>
    {/if}

    <!-- Method breakdown -->
    {#if methodCounts().length > 0}
      <section class="section">
        <span class="label">Methods Used</span>
        {#each methodCounts() as item}
          <div class="rank-row">
            <span class="rank-name">{item.label}</span>
            <div class="rank-bar-wrap">
              <div class="rank-bar" style="width:{(item.count / totalBrews) * 100}%"></div>
            </div>
            <span class="rank-val">{item.count}</span>
          </div>
        {/each}
      </section>
    {/if}
  {/if}
</div>

<style>
  .stat-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
  }
  .stat-card {
    background: var(--surface);
    border-radius: 14px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }
  .stat-value {
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--primary-light);
  }
  .stat-label {
    font-size: 0.72rem;
    color: var(--text-muted);
    text-align: center;
  }
  .sparkline {
    display: flex;
    align-items: flex-end;
    height: 60px;
    gap: 3px;
  }
  .spark-bar {
    flex: 1;
    background: var(--primary);
    border-radius: 3px 3px 0 0;
    position: relative;
    min-height: 4px;
    transition: background 0.2s;
  }
  .spark-bar:hover { background: var(--primary-light); }
  .spark-tip {
    display: none;
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    font-size: 0.6rem;
    color: var(--text);
    background: var(--surface-3);
    padding: 1px 3px;
    border-radius: 3px;
    white-space: nowrap;
  }
  .spark-bar:hover .spark-tip { display: block; }
  .rank-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
  }
  .rank-name {
    min-width: 0;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--text);
  }
  .rank-sub {
    font-size: 0.72rem;
    color: var(--text-muted);
    white-space: nowrap;
  }
  .rank-bar-wrap {
    width: 80px;
    height: 6px;
    background: var(--surface-3);
    border-radius: 3px;
    flex-shrink: 0;
  }
  .rank-bar {
    height: 100%;
    background: var(--primary);
    border-radius: 3px;
    min-width: 2px;
  }
  .rank-val {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text);
    min-width: 2.5rem;
    text-align: right;
  }
  .rank-val.highlight { color: var(--primary-light); }
  .empty {
    text-align: center;
    padding: 3rem 1rem;
    color: var(--text-muted);
  }
</style>
