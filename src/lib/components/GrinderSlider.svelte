<script lang="ts">
  import { K2 } from '../constants';
  import { formatGrindSetting } from '../format';

  let { value = $bindable(60) }: { value?: number } = $props();

  // Fixed buttons rather than press-and-hold repeat: deterministic, no timers to leak.
  const NUDGES = [-5, -1, 1, 5];
  const TICKS = Array.from({ length: K2.clicksPerRotation }, (_, i) => i);
  const ROTATIONS = Array.from({ length: K2.maxClicks / K2.clicksPerRotation + 1 }, (_, i) => i);

  let inRotation = $derived(value % K2.clicksPerRotation);
  let rotation = $derived(Math.floor(value / K2.clicksPerRotation));
  let fill = $derived(`${(value / K2.maxClicks) * 100}%`);
  let marker = $derived(polar(inRotation, 20));

  function nudge(delta: number) {
    value = Math.min(K2.maxClicks, Math.max(0, value + delta));
  }

  /** Point on the dial for a click within the rotation, 0 at 12 o'clock. */
  function polar(click: number, r: number) {
    const a = (click / K2.clicksPerRotation) * 2 * Math.PI - Math.PI / 2;
    return { x: 32 + r * Math.cos(a), y: 32 + r * Math.sin(a) };
  }
</script>

<div class="grinder">
  <div class="top">
    <div class="readout">
      <span class="clicks num">{value}<span class="unit">clicks</span></span>
      <span class="detail num">{formatGrindSetting(value)} · {value * K2.micronsPerClick} µm</span>
    </div>

    <!-- The K2's numbered dial: where in the current rotation you are. -->
    <svg class="dial" viewBox="0 0 64 64" aria-hidden="true">
      {#each TICKS as t (t)}
        {@const major = t % 10 === 0}
        {@const a = polar(t, major ? 25 : 27)}
        {@const b = polar(t, 30)}
        <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} class:major class:passed={t <= inRotation} />
      {/each}
      <circle cx={marker.x} cy={marker.y} r="3" class="marker" />
      <text x="32" y="36.5" text-anchor="middle">{rotation}R</text>
    </svg>
  </div>

  <input type="range" min="0" max={K2.maxClicks} step="1" bind:value style:--fill={fill} aria-label="Grinder clicks" />
  <div class="scale">
    {#each ROTATIONS as r (r)}<span>{r === 0 ? '0' : `${r}R`}</span>{/each}
  </div>

  <div class="nudges">
    {#each NUDGES as d (d)}
      <button class="nudge" onclick={() => nudge(d)} aria-label="{d > 0 ? 'Coarser' : 'Finer'} by {Math.abs(d)}">
        {d > 0 ? '+' : '−'}{Math.abs(d)}
      </button>
    {/each}
  </div>
</div>

<style>
  .grinder { display: flex; flex-direction: column; gap: 6px; }
  .top { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .readout { display: flex; flex-direction: column; gap: 2px; }
  .clicks {
    font-family: var(--font-display);
    font-size: 2.4rem;
    font-weight: 500;
    line-height: 1;
    letter-spacing: -0.02em;
    font-variation-settings: 'opsz' 72;
  }
  .unit {
    font-family: var(--font);
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--text-3);
    margin-left: 6px;
    letter-spacing: 0;
  }
  .detail { font-size: 0.82rem; color: var(--text-2); }

  .dial { width: 64px; height: 64px; flex-shrink: 0; }
  .dial line { stroke: var(--surface-3); stroke-width: 1.2; stroke-linecap: round; }
  .dial line.major { stroke: var(--text-3); stroke-width: 1.6; }
  .dial line.passed { stroke: var(--accent-line); }
  .dial line.major.passed { stroke: var(--accent); }
  .marker { fill: var(--accent); }
  .dial text { fill: var(--text-2); font-size: 11px; font-weight: 600; font-family: var(--font); }

  .scale {
    display: flex;
    justify-content: space-between;
    padding: 0 6px;
    font-size: 0.68rem;
    color: var(--text-3);
    font-variant-numeric: tabular-nums;
  }
  .nudges {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
    margin-top: 6px;
  }
  .nudge {
    height: 40px;
    border-radius: var(--radius-sm);
    border: 0;
    background: var(--surface-2);
    color: var(--text);
    font-size: 0.88rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    cursor: pointer;
    transition: background 0.12s, transform 0.1s;
  }
  .nudge:active { background: var(--surface-3); transform: scale(0.96); }
</style>
