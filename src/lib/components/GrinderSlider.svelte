<script lang="ts">
  import { formatGrindSetting } from '../utils';

  let { value = $bindable(60) }: { value?: number } = $props();

  const MAX = 120;
  const MICRONS_PER_CLICK = 18;

  let totalMicrons = $derived(value * MICRONS_PER_CLICK);
</script>

<div class="grinder">
  <div class="grinder-header">
    <span class="grinder-clicks">{value} <span class="unit">clicks</span></span>
    <span class="grinder-detail">{formatGrindSetting(value)}</span>
    <span class="grinder-microns">{totalMicrons} µm</span>
  </div>
  <input
    type="range"
    min="0"
    max={MAX}
    step="1"
    bind:value
    class="slider"
  />
  <div class="grinder-scale">
    <span>0</span>
    <span>1R (40)</span>
    <span>2R (80)</span>
    <span>3R (120)</span>
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
    font-size: 1.6rem;
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
    font-size: 0.9rem;
    color: var(--text-muted);
  }
  .grinder-microns {
    font-size: 0.8rem;
    color: var(--text-muted);
    margin-left: auto;
  }
  .slider {
    width: 100%;
    accent-color: var(--primary);
    height: 6px;
    cursor: pointer;
  }
  .grinder-scale {
    display: flex;
    justify-content: space-between;
    font-size: 0.7rem;
    color: var(--text-muted);
  }
</style>
