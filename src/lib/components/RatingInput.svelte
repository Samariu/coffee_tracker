<script lang="ts">
  import { RATING_WORDS } from '../constants';

  let { value = $bindable(0) }: { value?: number } = $props();
</script>

<div class="rating">
  <div class="head">
    <span class="label">Rating</span>
    {#if value > 0}
      <span class="readout"><b class="num">{value}</b> {RATING_WORDS[value]}</span>
    {:else}
      <span class="readout muted">Tap to rate</span>
    {/if}
  </div>
  <div class="scale" role="radiogroup" aria-label="Rating">
    {#each { length: 10 } as _, i}
      {@const n = i + 1}
      <button
        class="seg"
        class:on={n <= value}
        class:current={n === value}
        role="radio"
        aria-checked={n === value}
        aria-label="{n} — {RATING_WORDS[n]}"
        onclick={() => (value = value === n ? 0 : n)}
      >{n}</button>
    {/each}
  </div>
</div>

<style>
  .rating { display: flex; flex-direction: column; gap: 10px; }
  .head { display: flex; align-items: baseline; justify-content: space-between; }
  .readout { font-size: 0.9rem; color: var(--text-2); }
  .readout b {
    font-family: var(--font-display);
    font-size: 1.4rem;
    font-weight: 500;
    color: var(--accent-2);
    margin-right: 2px;
  }
  .readout.muted { color: var(--text-3); font-size: 0.85rem; }
  .scale {
    display: grid;
    grid-template-columns: repeat(10, 1fr);
    gap: 3px;
  }
  .seg {
    height: 42px;
    padding: 0;
    border: 0;
    background: var(--surface-2);
    color: var(--text-3);
    font-size: 0.8rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }
  .seg:first-child { border-radius: 10px 4px 4px 10px; }
  .seg:last-child { border-radius: 4px 10px 10px 4px; }
  .seg:not(:first-child):not(:last-child) { border-radius: 4px; }
  /* Everything up to the score is lit, so the bar reads as a level, not a row of toggles. */
  .seg.on { background: var(--accent-soft); color: var(--accent-2); }
  .seg.current { background: var(--accent); color: var(--accent-ink); }
</style>
