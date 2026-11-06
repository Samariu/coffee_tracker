<script lang="ts">
  import { formatGrindSetting } from '../utils';

  let { value = $bindable(60) }: { value?: number } = $props();

  const MAX = 120;
  const MICRONS_PER_CLICK = 18;

  let totalMicrons = $derived(value * MICRONS_PER_CLICK);

  // Fixed buttons rather than press-and-hold repeat: deterministic, no timers to leak.
  const NUDGES = [-5, -1, 1, 5];

  function nudge(delta: number) {
    value = Math.min(MAX, Math.max(0, value + delta));
  }
</script>

<div class="grinder">
  <div class="grinder-header">
    <span class="grinder-clicks">{value} <span class="unit">clicks</span></span>
    <span class="grinder-detail">{formatGrindSetting(value)}</span>
    <span class="grinder-microns">{totalMicrons} µm</span>
  </div>
  <input type="range" min="0" max={MAX} step="1" bind:value class="slider" />
  <div class="grinder-footer">
    <span class="scale">0</span>
    <div class="nudges">
      {#each NUDGES as d (d)}
        <button class="nudge" onclick={() => nudge(d)} aria-label="{d > 0 ? 'Coarser' : 'Finer'} by {Math.abs(d)}">
          {d > 0 ? '+' : '−'}{Math.abs(d)}
        </button>
      {/each}
    </div>
    <span class="scale">3R</span>
  </div>
</div>

<style>
  .grinder {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .grinder-header {
    display: flex;
    align-items: baseline;
    gap: 0.75rem;
  }
  .grinder-clicks {
    font-size: 1.4rem;
    font-weight: 700;
    color: var(--primary);
    font-variant-numeric: tabular-nums;
  }
  .unit {
    font-size: 0.8rem;
    font-weight: 400;
    color: var(--text-muted);
  }
  .grinder-detail {
    font-size: 0.85rem;
    color: var(--text-muted);
  }
  .grinder-microns {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-left: auto;
  }
  .slider {
    width: 100%;
    accent-color: var(--primary);
    height: 6px;
    cursor: pointer;
  }
  .grinder-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }
  .scale {
    font-size: 0.7rem;
    color: var(--text-muted);
  }
  .nudges {
    display: flex;
    gap: 0.3rem;
  }
  .nudge {
    min-width: 2.6rem;
    min-height: 2.4rem;
    border-radius: 9px;
    border: 1px solid var(--border);
    background: var(--surface-2);
    color: var(--primary-light);
    font-size: 0.85rem;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  .nudge:active { background: var(--surface-3); }
</style>
