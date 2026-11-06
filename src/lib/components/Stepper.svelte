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
    /** Size of the outer ±buttons; 0 hides them. */
    coarse?: number;
    min?: number;
    max?: number;
    unit?: string;
    label?: string;
    decimals?: number;
  } = $props();

  const id = $props.id();

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
  {#if label}<label class="stepper-label" for={id}>{label}</label>{/if}
  <div class="controls">
    {#if coarse > 0}
      <button class="nudge coarse" onclick={() => nudge(-coarse)} aria-label="Decrease {label} by {coarse}">−{coarse}</button>
    {/if}
    <button class="nudge" onclick={() => nudge(-step)} aria-label="Decrease {label}">
      <svg width="14" height="14" viewBox="0 0 14 14"><path d="M2 7h10" /></svg>
    </button>
    <div class="value-wrap">
      <input {id} class="value" type="number" inputmode="decimal" {step} {min} {max} bind:value onblur={normalize} />
      {#if unit}<span class="unit">{unit}</span>{/if}
    </div>
    <button class="nudge" onclick={() => nudge(step)} aria-label="Increase {label}">
      <svg width="14" height="14" viewBox="0 0 14 14"><path d="M2 7h10M7 2v10" /></svg>
    </button>
    {#if coarse > 0}
      <button class="nudge coarse" onclick={() => nudge(coarse)} aria-label="Increase {label} by {coarse}">+{coarse}</button>
    {/if}
  </div>
</div>

<style>
  .stepper {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-width: 0;
  }
  .stepper-label {
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--text-2);
    white-space: nowrap;
  }
  .controls {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .nudge {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 0;
    background: var(--surface-2);
    color: var(--text);
    cursor: pointer;
    transition: background 0.12s, transform 0.1s;
  }
  .nudge:active { background: var(--surface-3); transform: scale(0.92); }
  .nudge svg { stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; fill: none; }
  .nudge.coarse {
    width: 36px;
    background: transparent;
    color: var(--text-3);
    font-size: 0.74rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  .value-wrap {
    display: flex;
    align-items: baseline;
    justify-content: center;
    width: 76px;
    padding: 0 2px;
  }
  .value {
    width: 100%;
    min-width: 0;
    background: transparent;
    border: 0;
    border-radius: 8px;
    padding: 4px 0;
    color: var(--text);
    font-family: inherit;
    font-size: 1.2rem;
    font-weight: 600;
    text-align: right;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.01em;
    outline: none;
  }
  .value:focus { background: var(--surface-2); }
  .unit {
    flex-shrink: 0;
    margin-left: 2px;
    font-size: 0.8rem;
    color: var(--text-3);
  }
</style>
