<script lang="ts">
  import type { Snippet } from 'svelte';
  import Icon from './Icon.svelte';
  import { appState, go } from '../stores.svelte';

  /** Large-title header. Settings isn't a tab, so every header carries the way in. */
  let {
    title,
    subtitle = '',
    actions,
  }: {
    title: string;
    subtitle?: string;
    actions?: Snippet;
  } = $props();

  let onSettings = $derived(appState.page === 'settings');
</script>

<header class="page-header">
  <div class="titles">
    {#if subtitle}<span class="subtitle">{subtitle}</span>{/if}
    <h1>{title}</h1>
  </div>
  <div class="actions">
    {#if actions}{@render actions()}{/if}
    {#if onSettings}
      <button class="icon-btn" onclick={() => go('log')} aria-label="Close settings">
        <Icon name="x" size={18} />
      </button>
    {:else}
      <button class="icon-btn" onclick={() => go('settings')} aria-label="Settings">
        <Icon name="settings" size={18} />
      </button>
    {/if}
  </div>
</header>

<style>
  .page-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px;
    padding: calc(20px + var(--safe-top)) 0 4px;
  }
  .titles { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .subtitle {
    font-size: 0.78rem;
    font-weight: 500;
    color: var(--text-3);
    letter-spacing: 0.01em;
  }
  h1 {
    margin: 0;
    font-family: var(--font-display);
    font-weight: 500;
    font-size: 2rem;
    line-height: 1.05;
    letter-spacing: -0.02em;
    font-variation-settings: 'opsz' 72;
  }
  .actions { display: flex; gap: 8px; align-items: center; }
</style>
