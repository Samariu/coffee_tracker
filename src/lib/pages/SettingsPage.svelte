<script lang="ts">
  import { appState, saveEnabledMethods, ALL_METHODS } from '../stores.svelte';
  import { BREW_METHODS, BREW_METHOD_ICONS } from '../utils';
  import type { BrewMethod } from '../types';

  function toggle(method: BrewMethod) {
    const current = appState.enabledMethods;
    const next = current.includes(method)
      ? current.filter((m) => m !== method)
      : [...current, method];
    // Always keep at least one method enabled
    if (next.length === 0) return;
    appState.enabledMethods = next;
    saveEnabledMethods(next);
  }

  function enableAll() {
    appState.enabledMethods = [...ALL_METHODS];
    saveEnabledMethods([...ALL_METHODS]);
  }
</script>

<div class="page">
  <section class="section">
    <div class="section-header">
      <span class="label">Brew Methods</span>
      <button class="btn btn-ghost btn-sm" onclick={enableAll}>Enable all</button>
    </div>
    <p class="hint">Disabled methods are hidden in the Log form. The picker sorts by most recently used.</p>

    <div class="method-list">
      {#each ALL_METHODS as method}
        {@const enabled = appState.enabledMethods.includes(method)}
        <label class="method-row" class:disabled={!enabled}>
          <span class="method-icon">{BREW_METHOD_ICONS[method]}</span>
          <span class="method-name">{BREW_METHODS[method]}</span>
          <input
            type="checkbox"
            class="toggle"
            checked={enabled}
            onchange={() => toggle(method)}
          />
        </label>
      {/each}
    </div>
  </section>
</div>

<style>
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .hint {
    font-size: 0.78rem;
    color: var(--text-muted);
    margin: 0;
    line-height: 1.5;
  }
  .method-list {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .method-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.7rem 0.75rem;
    background: var(--surface-2);
    border-radius: 10px;
    cursor: pointer;
    transition: opacity 0.15s;
  }
  .method-row.disabled { opacity: 0.45; }
  .method-icon { font-size: 1.2rem; }
  .method-name { flex: 1; font-size: 0.9rem; color: var(--text); }
  .toggle {
    width: 1.1rem;
    height: 1.1rem;
    accent-color: var(--primary);
    cursor: pointer;
  }
</style>
