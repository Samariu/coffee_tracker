<script lang="ts">
  import { BREW_METHODS, BREW_METHOD_ICONS } from '../utils';
  import type { BrewMethod } from '../types';

  let { value = $bindable('v60' as BrewMethod) }: { value?: BrewMethod } = $props();

  const methods = Object.entries(BREW_METHODS) as [BrewMethod, string][];
</script>

<div class="method-grid">
  {#each methods as [key, label]}
    <button
      class="method-btn"
      class:selected={value === key}
      onclick={() => (value = key)}
    >
      <span class="method-icon">{BREW_METHOD_ICONS[key]}</span>
      <span class="method-label">{label}</span>
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
  .method-icon {
    font-size: 1.3rem;
  }
  .method-label {
    font-size: 0.65rem;
    color: var(--text-muted);
    text-align: center;
    line-height: 1.2;
  }
  .method-btn.selected .method-label {
    color: var(--primary-light);
  }
</style>
