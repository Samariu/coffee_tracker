# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # dev server at http://localhost:5173 (hot reload)
npm run build    # production build → dist/
npm run preview  # serve dist/ locally
```

There are no tests configured. TypeScript errors surface during `npm run build` via `vite-plugin-svelte`.

## Architecture

**Stack:** Svelte 5 (runes syntax) + Vite 8 + TypeScript, `idb` for IndexedDB, `vite-plugin-pwa` for service worker + manifest.

### State model

Global mutable state lives in `src/lib/stores.svelte.ts` as a single `$state` object (`appState`). This is a Svelte 5 `.svelte.ts` module — the `$state` rune is available at module level because the file extension opts into the Svelte compiler. Components import `appState` and mutate it directly (e.g. `appState.page = 'history'`). After any DB write, call the corresponding `refresh*()` helper to sync the in-memory state.

### Data layer

`src/lib/db.ts` owns all IndexedDB access via the `idb` library. Three stores: `brews` (indexed by `timestamp` and `synced`), `beans`, `recipes`. Call `initDB()` once on app mount before any other DB operations.

### Types

All domain types are in `src/lib/types.ts`:
- `Brew` — one logged session; `grinder.setting` is an integer 0–120 representing K2 click count (40 clicks/rotation × 3 rotations, 18 µm/click).
- `Bean` — inventory entry; `remainingGrams` is decremented by `LogPage` when a brew is saved using a selected inventory bean.
- `Recipe` — reusable preset; `RecipesPage` can instantly log a brew from a recipe, which navigates to History on save.

### Component tree

```
App.svelte                 ← DB init, page routing, bottom nav
  pages/LogPage.svelte     ← brew form; timers, grinder slider, ratio calc
  pages/HistoryPage.svelte ← filterable list + CSV export
  pages/StatsPage.svelte   ← derived stats (pure $derived, no DB calls)
  pages/BeansPage.svelte   ← inventory CRUD with modal form
  pages/RecipesPage.svelte ← recipe CRUD + one-click "Brew" action
  components/Timer.svelte         ← start/stop/reset, calls onDone(seconds)
  components/GrinderSlider.svelte ← slider 0–120 with rotation breakdown display
  components/RatingInput.svelte   ← 1–10 pip buttons, bind:value
  components/MethodPicker.svelte  ← 4-column grid of brew method buttons
  components/BrewCard.svelte      ← collapsible brew history card
```

### Styling

All CSS variables are defined in `src/app.css` (dark coffee theme). Global utility classes (`.btn`, `.input`, `.select`, `.textarea`, `.section`, `.label`, `.page`) are declared there and used throughout — do not re-declare them in component `<style>` blocks. Component styles are scoped and extend the globals.

### PWA

`vite.config.ts` configures `vite-plugin-pwa` with Workbox `generateSW`. The manifest targets iPhone (`standalone`, `viewport-fit=cover`, `apple-mobile-web-app-capable`). Icons at `public/icons/icon-{192,512}.png` are plain colored placeholders — replace with real artwork before distributing.

### Planned: Raspberry Pi backend

The `synced: boolean` field on `Brew` (stored as `0`/`1` for IndexedDB index compatibility) is the hook point. `db.ts` exports `getUnsyncedBrews()`. A future sync module should POST unsynced brews to a self-hosted FastAPI endpoint, then `updateBrew({ ...brew, synced: true })`.
