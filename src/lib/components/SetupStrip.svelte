<script lang="ts">
  import type { Setup } from '../types';
  import { BREW_METHODS, BREW_METHOD_ICONS, formatGrindSetting, relativeAge } from '../utils';

  let {
    setups,
    activeKey = '',
    onpick,
  }: {
    setups: Setup[];
    activeKey?: string;
    onpick: (s: Setup) => void;
  } = $props();
</script>

{#if setups.length > 0}
  <div class="strip">
    {#each setups as s (s.key)}
      <button class="setup" class:active={s.key === activeKey} onclick={() => onpick(s)}>
        <span class="head">
          <span class="icon">{s.source === 'recipe' ? '📌' : BREW_METHOD_ICONS[s.method]}</span>
          <span class="method">{BREW_METHODS[s.method]}</span>
          <span class="age">{s.source === 'recipe' ? 'saved' : relativeAge(s.lastUsed)}</span>
        </span>
        <span class="title">{s.title}</span>
        <span class="numbers">{s.values.amountGrams}g · {s.values.waterMl}ml</span>
        <span class="foot">
          <span class="grind">{formatGrindSetting(s.values.grinderSetting)}</span>
          {#if s.lastRating > 0}<span class="rating">★{s.lastRating}</span>{/if}
        </span>
      </button>
    {/each}
  </div>
{/if}

<style>
  .strip {
    display: flex;
    gap: 0.5rem;
    overflow-x: auto;
    scroll-snap-type: x proximity;
    /* Bleed to the screen edges so cards can scroll off rather than looking clipped. */
    margin: 0 -0.75rem;
    padding: 0 0.75rem 0.15rem;
    scrollbar-width: none;
  }
  .strip::-webkit-scrollbar { display: none; }

  .setup {
    flex: 0 0 auto;
    width: 9.4rem;
    scroll-snap-align: start;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    text-align: left;
    padding: 0.6rem 0.7rem;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    color: var(--text);
    font-family: inherit;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: border-color 0.15s, background 0.15s;
  }
  .setup.active {
    border-color: var(--primary);
    background: var(--surface-2);
  }
  .head {
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }
  .icon { font-size: 0.95rem; }
  .method {
    font-size: 0.68rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--primary-light);
  }
  .age {
    margin-left: auto;
    font-size: 0.62rem;
    color: var(--text-muted);
  }
  .title {
    font-size: 0.85rem;
    font-weight: 600;
    line-height: 1.2;
    /* Two lines max, so every card is the same height. */
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    min-height: 2.05rem;
  }
  .numbers {
    font-size: 0.75rem;
    color: var(--text);
    font-variant-numeric: tabular-nums;
  }
  .foot {
    display: flex;
    align-items: baseline;
    gap: 0.4rem;
  }
  .grind {
    font-size: 0.68rem;
    color: var(--text-muted);
  }
  .rating {
    margin-left: auto;
    font-size: 0.68rem;
    font-weight: 700;
    color: var(--primary);
  }
</style>
