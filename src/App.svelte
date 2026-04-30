<script lang="ts">
  import { onMount } from 'svelte';
  import { registerSW } from 'virtual:pwa-register';
  import { initDB } from './lib/db';
  import { appState, refreshAll, swState } from './lib/stores.svelte';
  import LogPage from './lib/pages/LogPage.svelte';
  import HistoryPage from './lib/pages/HistoryPage.svelte';
  import StatsPage from './lib/pages/StatsPage.svelte';
  import BeansPage from './lib/pages/BeansPage.svelte';
  import RecipesPage from './lib/pages/RecipesPage.svelte';
  import SettingsPage from './lib/pages/SettingsPage.svelte';

  const NAV = [
    { id: 'log',      label: 'Log',      icon: '✏️' },
    { id: 'history',  label: 'History',  icon: '📋' },
    { id: 'stats',    label: 'Stats',    icon: '📊' },
    { id: 'beans',    label: 'Beans',    icon: '☕' },
    { id: 'recipes',  label: 'Recipes',  icon: '📌' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ] as const;

  onMount(async () => {
    await initDB();
    await refreshAll();
    appState.dbReady = true;

    swState.applyUpdate = registerSW({
      onNeedRefresh() {
        swState.updateAvailable = true;
      },
      onRegistered(r) {
        if (r) swState.registration = r;
      },
      // silence the error when offline and SW can't reach network
      onOfflineReady() {},
      onRegisterError() {},
    });
  });
</script>

<div class="app">
  <header class="app-header">
    <span class="app-logo">☕</span>
    <span class="app-title">Coffee Tracker</span>
  </header>

  {#if swState.updateAvailable}
    <div class="update-bar">
      <span>Update available</span>
      <button class="update-btn" onclick={() => swState.applyUpdate?.(true)}>Reload</button>
    </div>
  {/if}

  <main class="app-main">
    {#if !appState.dbReady}
      <div class="loading">Loading…</div>
    {:else if appState.page === 'log'}
      <LogPage />
    {:else if appState.page === 'history'}
      <HistoryPage />
    {:else if appState.page === 'stats'}
      <StatsPage />
    {:else if appState.page === 'beans'}
      <BeansPage />
    {:else if appState.page === 'recipes'}
      <RecipesPage />
    {:else if appState.page === 'settings'}
      <SettingsPage />
    {/if}
  </main>

  <nav class="app-nav">
    {#each NAV as item}
      <button
        class="nav-btn"
        class:active={appState.page === item.id}
        onclick={() => (appState.page = item.id)}
      >
        <span class="nav-icon">{item.icon}</span>
        <span class="nav-label">{item.label}</span>
      </button>
    {/each}
  </nav>
</div>

<style>
  .app {
    display: flex;
    flex-direction: column;
    height: 100dvh;
    max-width: 480px;
    margin: 0 auto;
  }
  .app-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: calc(0.75rem + var(--safe-top)) 1rem 0.75rem;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }
  .app-logo { font-size: 1.3rem; }
  .app-title {
    font-size: 1rem;
    font-weight: 700;
    color: var(--primary-light);
    letter-spacing: 0.02em;
  }
  .update-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 1rem;
    background: var(--primary);
    color: #1a1008;
    font-size: 0.85rem;
    font-weight: 600;
    flex-shrink: 0;
  }
  .update-btn {
    background: rgba(0,0,0,0.15);
    border: none;
    border-radius: 8px;
    padding: 0.3rem 0.75rem;
    font-size: 0.82rem;
    font-weight: 700;
    color: #1a1008;
    cursor: pointer;
  }
  .app-main {
    flex: 1;
    overflow-y: auto;
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    -webkit-overflow-scrolling: touch;
  }
  .app-nav {
    display: flex;
    background: var(--surface);
    border-top: 1px solid var(--border);
    padding-bottom: var(--safe-bottom);
    flex-shrink: 0;
  }
  .nav-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.2rem;
    padding: 0.6rem 0.25rem;
    background: none;
    border: none;
    cursor: pointer;
    transition: background 0.15s;
  }
  .nav-btn.active { background: var(--surface-2); }
  .nav-icon { font-size: 1.2rem; }
  .nav-label {
    font-size: 0.65rem;
    color: var(--text-muted);
    letter-spacing: 0.02em;
  }
  .nav-btn.active .nav-label {
    color: var(--primary-light);
    font-weight: 600;
  }
  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--text-muted);
  }
</style>
