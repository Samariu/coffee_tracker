<script lang="ts">
  import { BREW_METHODS, BREW_METHOD_ICONS } from '../utils';
  import { appState } from '../stores.svelte';
  import type { BrewMethod } from '../types';

  let {
    value = $bindable('v60' as BrewMethod),
    onchange,
  }: { value?: BrewMethod; onchange?: (m: BrewMethod) => void } = $props();

  // Sort enabled methods by most-recently-brewed first
  let sortedMethods = $derived.by(() => {
    const lastUsed = new Map<BrewMethod, number>();
    for (const brew of appState.brews.slice(0, 50)) {
      const cur = lastUsed.get(brew.method) ?? 0;
      if (brew.timestamp > cur) lastUsed.set(brew.method, brew.timestamp);
    }
    return appState.enabledMethods
      .slice()
      .sort((a, b) => (lastUsed.get(b) ?? 0) - (lastUsed.get(a) ?? 0));
  });

  // If the currently selected method gets disabled, pick the first enabled one
  $effect(() => {
    if (!appState.enabledMethods.includes(value) && appState.enabledMethods.length > 0) {
      value = sortedMethods[0];
    }
  });
</script>

<div class="method-grid">
  {#each sortedMethods as key (key)}
    <button
      class="method-btn"
      class:selected={value === key}
      onclick={() => { value = key; onchange?.(key); }}
    >
      <span class="method-icon">{BREW_METHOD_ICONS[key]}</span>
      <span class="method-label">{BREW_METHODS[key]}</span>
    </button>
  {/each}
</div>

<style>
  .method-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
  }
  .method-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 0.6rem 0.25rem;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 10px;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
  }
  .method-btn.selected {
    background: var(--surface-3);
    border-color: var(--primary);
  }
  .method-icon { font-size: 1.3rem; }
  .method-label {
    font-size: 0.65rem;
    color: var(--text-muted);
    text-align: center;
    line-height: 1.2;
  }
  .method-btn.selected .method-label { color: var(--primary-light); }
</style>
