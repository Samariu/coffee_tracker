<script lang="ts">
  import { onMount } from 'svelte';
  import { registerSW } from 'virtual:pwa-register';
  import { initDB } from './lib/db';
  import { appState, go, refreshAll, swState, type Page } from './lib/stores.svelte';
  import type { IconName } from './lib/icons';
  import Icon from './lib/components/Icon.svelte';
  import Toast from './lib/components/Toast.svelte';
  import LogPage from './lib/pages/LogPage.svelte';
  import HistoryPage from './lib/pages/HistoryPage.svelte';
  import StatsPage from './lib/pages/StatsPage.svelte';
  import BeansPage from './lib/pages/BeansPage.svelte';
  import RecipesPage from './lib/pages/RecipesPage.svelte';
  import SettingsPage from './lib/pages/SettingsPage.svelte';

  const NAV: { id: Page; label: string; icon: IconName }[] = [
    { id: 'log',     label: 'Brew',     icon: 'brew' },
    { id: 'history', label: 'Journal',  icon: 'journal' },
    { id: 'stats',   label: 'Insights', icon: 'insights' },
    { id: 'beans',   label: 'Beans',    icon: 'bean' },
    { id: 'recipes', label: 'Recipes',  icon: 'recipe' },
  ];

  let main: HTMLElement;

  // Each tab starts at the top rather than inheriting the last page's scroll.
  $effect(() => {
    void appState.page;
    main?.scrollTo(0, 0);
  });

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
  {#if swState.updateAvailable}
    <div class="update-bar">
      <Icon name="refresh" size={16} />
      <span>A new version is ready</span>
      <button class="btn btn-sm btn-primary" onclick={() => swState.applyUpdate?.(true)}>Reload</button>
    </div>
  {/if}

  <main class="app-main" bind:this={main}>
    {#if !appState.dbReady}
      <div class="loading"><Icon name="brew" size={28} /></div>
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
    {#each NAV as item (item.id)}
      {@const active = appState.page === item.id}
      <button
        class="nav-btn"
        class:active
        aria-current={active ? 'page' : undefined}
        onclick={() => go(item.id)}
      >
        <span class="nav-icon"><Icon name={item.icon} size={22} stroke={active ? 2 : 1.6} /></span>
        <span class="nav-label">{item.label}</span>
      </button>
    {/each}
  </nav>

  <Toast />
</div>

<style>
  .app {
    display: flex;
    flex-direction: column;
    height: 100dvh;
    max-width: 520px;
    margin: 0 auto;
  }
  .update-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: calc(10px + var(--safe-top)) 16px 10px;
    background: var(--surface-2);
    border-bottom: 1px solid var(--line);
    color: var(--text-2);
    font-size: 0.85rem;
    font-weight: 500;
    flex-shrink: 0;
  }
  .update-bar span { flex: 1; }
  .app-main {
    flex: 1;
    overflow-y: auto;
    overscroll-behavior-y: contain;
  }
  .app-nav {
    display: flex;
    height: calc(var(--nav-h) + var(--safe-bottom));
    padding: 0 6px var(--safe-bottom);
    background: var(--bg);
    border-top: 1px solid var(--line);
    flex-shrink: 0;
  }
  .nav-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    background: none;
    border: none;
    color: var(--text-3);
    cursor: pointer;
    transition: color 0.15s;
  }
  .nav-icon {
    display: grid;
    place-items: center;
    width: 52px;
    height: 30px;
    border-radius: 999px;
    transition: background 0.2s;
  }
  .nav-btn.active { color: var(--accent-2); }
  .nav-btn.active .nav-icon { background: var(--accent-soft); }
  .nav-label {
    font-size: 0.68rem;
    font-weight: 500;
    letter-spacing: 0.01em;
  }
  .nav-btn.active .nav-label { color: var(--text); font-weight: 600; }
  .loading {
    display: grid;
    place-items: center;
    height: 100%;
    color: var(--text-3);
  }
</style>
