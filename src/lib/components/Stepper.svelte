<script lang="ts">
  let {
    value = $bindable(0),
    step = 1,
    coarse = 0,
    min = 0,
    max = 9999,
    unit = '',
    label = '',
    decimals = 0,
  }: {
    value?: number;
    step?: number;
    coarse?: number;
    min?: number;
    max?: number;
    unit?: string;
    label?: string;
    decimals?: number;
  } = $props();

  /** Clearing a number input binds `undefined`. Snap back to a usable value on blur
   *  so a half-edited field can never reach the saved brew. */
  function normalize() {
    if (!Number.isFinite(value)) value = min;
    else value = Math.min(max, Math.max(min, value));
  }

  function nudge(delta: number) {
    const next = Math.min(max, Math.max(min, (value || 0) + delta));
    // Round through the decimal place so 0.5 steps don't accumulate float drift.
    const f = 10 ** decimals;
    value = Math.round(next * f) / f;
  }
</script>

<div class="stepper">
  {#if label}<span class="stepper-label">{label}</span>{/if}
  <div class="stepper-row">
    {#if coarse > 0}
      <button class="nudge wide" onclick={() => nudge(-coarse)} aria-label="Decrease by {coarse}">−{coarse}</button>
    {/if}
    <button class="nudge" onclick={() => nudge(-step)} aria-label="Decrease">−</button>
    <div class="value-wrap">
      <input class="input value" type="number" inputmode="decimal" {step} {min} {max} bind:value onblur={normalize} />
      {#if unit}<span class="unit">{unit}</span>{/if}
    </div>
    <button class="nudge" onclick={() => nudge(step)} aria-label="Increase">+</button>
    {#if coarse > 0}
      <button class="nudge wide" onclick={() => nudge(coarse)} aria-label="Increase by {coarse}">+{coarse}</button>
    {/if}
  </div>
</div>

<style>
  .stepper {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    min-width: 0;
  }
  .stepper-label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-muted);
  }
  .stepper-row {
    display: flex;
    align-items: stretch;
    gap: 0.25rem;
  }
  .nudge {
    flex: 0 0 auto;
    min-width: 2.4rem;
    min-height: 2.75rem;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--surface-2);
    color: var(--primary-light);
    font-size: 1.1rem;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    -webkit-tap-highlight-color: transparent;
  }
  .nudge.wide {
    min-width: 2.6rem;
    font-size: 0.8rem;
    color: var(--text-muted);
  }
  .nudge:active { background: var(--surface-3); }
  .value-wrap {
    position: relative;
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    align-items: center;
  }
  /* 1rem keeps iOS from zooming the viewport on focus. */
  .value {
    text-align: center;
    font-size: 1rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    padding-right: 1.6rem;
    -moz-appearance: textfield;
    appearance: textfield;
  }
  .value::-webkit-outer-spin-button,
  .value::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .unit {
    position: absolute;
    right: 0.5rem;
    font-size: 0.72rem;
    color: var(--text-muted);
    pointer-events: none;
  }
</style>
