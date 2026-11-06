<script lang="ts">
  import Icon from './Icon.svelte';
  import { beanTitle, brewRatio, formatTime } from '../format';
  import type { Brew } from '../types';

  let { brew, onopen }: { brew: Brew; onopen: (b: Brew) => void } = $props();
</script>

<button class="row" onclick={() => onopen(brew)}>
  <span class="badge"><Icon method={brew.method} size={20} /></span>
  <span class="main">
    <span class="title">{beanTitle(brew.beans.brand, brew.beans.name)}</span>
    <span class="meta num">
      {brew.beans.amountGrams}g · {brew.water.amountMl}ml · {brewRatio(brew.beans.amountGrams, brew.water.amountMl)} · {brew.grinder.setting} clk
    </span>
  </span>
  <span class="side">
    {#if brew.rating > 0}
      <span class="score num" class:high={brew.rating >= 8}>{brew.rating}</span>
    {:else}
      <span class="score unrated">–</span>
    {/if}
    <span class="time num">{formatTime(brew.timestamp)}</span>
  </span>
</button>

<style>
  .row {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 12px 14px;
    background: transparent;
    border: 0;
    text-align: left;
    cursor: pointer;
  }
  .row:active { background: var(--surface-2); }
  .badge {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: var(--surface-2);
    color: var(--text-2);
    flex-shrink: 0;
  }
  .main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
  .title {
    font-size: 0.95rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .meta {
    font-size: 0.78rem;
    color: var(--text-3);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .side { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; flex-shrink: 0; }
  .score {
    font-family: var(--font-display);
    font-size: 1.25rem;
    font-weight: 500;
    line-height: 1.1;
    color: var(--text);
  }
  .score.high { color: var(--accent-2); }
  .score.unrated { color: var(--text-3); }
  .time { font-size: 0.72rem; color: var(--text-3); }
</style>
