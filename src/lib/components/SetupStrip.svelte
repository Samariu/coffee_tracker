<script lang="ts">
  import Icon from './Icon.svelte';
  import { METHODS } from '../constants';
  import { formatGrindSetting, relativeAge } from '../format';
  import type { Setup } from '../types';

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
  <div class="strip" aria-label="Recent setups">
    {#each setups as s (s.key)}
      <button class="setup" class:active={s.key === activeKey} onclick={() => onpick(s)}>
        <span class="head">
          <span class="badge"><Icon method={s.method} size={16} /></span>
          <span class="method">{METHODS[s.method].label}</span>
          <span class="age">
            {#if s.source === 'recipe'}<Icon name="recipe" size={12} />{:else}{relativeAge(s.lastUsed)}{/if}
          </span>
        </span>
        <span class="title">{s.title}</span>
        <span class="numbers num">{s.values.amountGrams}g · {s.values.waterMl}ml</span>
        <span class="foot num">
          {formatGrindSetting(s.values.grinderSetting)}
          {#if s.lastRating > 0}<span class="rating">{s.lastRating}/10</span>{/if}
        </span>
      </button>
    {/each}
  </div>
{/if}

<style>
  .strip {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    scroll-snap-type: x proximity;
    /* Bleed to the screen edges so cards scroll off rather than looking clipped. */
    margin: 0 calc(-1 * var(--gutter));
    padding: 2px var(--gutter);
    scroll-padding: 0 var(--gutter);
    scrollbar-width: none;
  }
  .strip::-webkit-scrollbar { display: none; }

  .setup {
    flex: 0 0 auto;
    width: 158px;
    scroll-snap-align: start;
    display: flex;
    flex-direction: column;
    gap: 4px;
    text-align: left;
    padding: 12px;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 16px;
    color: var(--text);
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s, transform 0.1s;
  }
  .setup:active { transform: scale(0.98); }
  .setup.active {
    border-color: var(--accent-line);
    background: linear-gradient(180deg, var(--accent-soft), transparent 70%), var(--surface);
  }
  .head { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
  .badge {
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    border-radius: 8px;
    background: var(--surface-2);
    color: var(--text-2);
  }
  .active .badge { background: var(--accent); color: var(--accent-ink); }
  .method {
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--text-2);
  }
  .age {
    margin-left: auto;
    font-size: 0.7rem;
    color: var(--text-3);
  }
  .title {
    font-size: 0.9rem;
    font-weight: 600;
    line-height: 1.25;
    /* Two lines max, so every card is the same height. */
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    min-height: 2.25rem;
  }
  .numbers { font-size: 0.8rem; color: var(--text); }
  .foot {
    display: flex;
    justify-content: space-between;
    font-size: 0.72rem;
    color: var(--text-3);
  }
  .rating { color: var(--accent-2); font-weight: 600; }
</style>
