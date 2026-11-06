# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # dev server at http://localhost:5173 (hot reload)
npm run build    # production build → dist/
npm run preview  # serve dist/ locally
npm run check    # svelte-check + tsc — catches more than the build does
```

There are no tests configured. Run `npm run check` before `npm run build`.

## Architecture

**Stack:** Svelte 5 (runes syntax) + Vite 8 + TypeScript, `idb` for IndexedDB, `vite-plugin-pwa` for service worker + manifest.

### State model

Global mutable state lives in `src/lib/stores.svelte.ts` as a single `$state` object (`appState`). This is a Svelte 5 `.svelte.ts` module — the `$state` rune is available at module level because the file extension opts into the Svelte compiler. Components import `appState` and mutate it directly (e.g. `appState.page = 'history'`). After any DB write, call the corresponding `refresh*()` helper to sync the in-memory state.

### Data layer

`src/lib/db.ts` owns all IndexedDB access via the `idb` library. Three stores: `brews` (indexed by `timestamp` and `synced`), `beans`, `recipes`. Call `initDB()` once on app mount before any other DB operations.

### Types

All domain types are in `src/lib/types.ts`:
- `Brew` — one logged session; `grinder.setting` is an integer 0–120 representing K2 click count (40 clicks/rotation × 3 rotations, 18 µm/click).
- `Bean` — inventory entry; `remainingGrams` is decremented by `LogPage` whenever the saved brew's bean is linked to an inventory entry (`LogDraft.beanId`).
- `Recipe` — reusable preset; `RecipesPage`'s "Brew" hands it to the Log page prefilled.
- `SetupValues` / `Setup` / `BeanOption` / `LogDraft` — the fast-logging types; see below.

### Fast logging

Logging a brew is the app's whole point, so it is optimised for taps, not for
completeness. Two rules follow from that and are easy to break by accident:

- **The Log form never starts empty.** `LogPage.initialForm()` restores a saved draft,
  or else seeds every field from your most recent brew. The steady state is therefore
  rate → Save (2 taps); tapping a setup card first makes it 3.
- **Nothing gates Save but `saving`.** Requiring typed text was what made the form slow.
  The safety net is the Undo button in the post-save toast, not a validation gate.

`src/lib/draft.ts` persists the whole form to localStorage (key `log_draft`, discarded
after 6 h). It doubles as the cross-page hand-off: RecipesPage's "Brew" and
HistoryPage's "Repeat" both write a draft and set `appState.page = 'log'` rather than
saving a brew directly or passing state through `appState`.

The derivations that feed the UI (`recentSetups`, `beanOptions`, `defaultsFor`,
`findInventoryBean`, …) are pure functions in `utils.ts`; components wrap them in
`$derived.by`. `defaultsFor` is the single home of the "prefill from your last brew of
this bean+method, else `METHOD_DEFAULTS`" rule — go through it rather than reading
`METHOD_DEFAULTS` directly.

### Component tree

```
App.svelte                 ← DB init, page routing, bottom nav
  pages/LogPage.svelte     ← brew form; one $state<LogDraft> object, sticky save bar
  pages/HistoryPage.svelte ← filterable list + CSV export + "Repeat" → Log
  pages/StatsPage.svelte   ← derived stats (pure $derived, no DB calls)
  pages/BeansPage.svelte   ← inventory CRUD with modal form
  pages/RecipesPage.svelte ← recipe CRUD; "Brew" prefills Log via a draft
  components/SetupStrip.svelte    ← h-scrolling one-tap cards: top setups + recipes
  components/BeanPicker.svelte    ← bean chips (inventory ∪ history) + "New"
  components/Stepper.svelte       ← −−/−/value/+/++ numeric nudger, bind:value
  components/Timer.svelte         ← start/stop/reset, bind:value (seconds)
  components/GrinderSlider.svelte ← 0–120 slider + exact ±1/±5 click nudges
  components/RatingInput.svelte   ← 1–10 pip buttons, bind:value, `compact` prop
  components/MethodPicker.svelte  ← 4-column grid of brew method buttons
  components/BrewCard.svelte      ← collapsible brew history card
```

### Styling

All CSS variables are defined in `src/app.css` (dark coffee theme). Global utility classes (`.btn`, `.input`, `.select`, `.textarea`, `.section`, `.section.compact`, `.label`, `.page`, `.chip`, `.chip-row`) are declared there and used throughout — do not re-declare them in component `<style>` blocks. Component styles are scoped and extend the globals.

### PWA

`vite.config.ts` configures `vite-plugin-pwa` with Workbox `generateSW`. The manifest targets iPhone (`standalone`, `viewport-fit=cover`, `apple-mobile-web-app-capable`). Icons at `public/icons/icon-{192,512}.png` are plain colored placeholders — replace with real artwork before distributing.

### Planned: Raspberry Pi backend

The `synced` field on `Brew` is the hook point. **Note it is currently a `boolean`, not
the `0`/`1` this section long claimed.** Booleans are not valid IndexedDB keys, so the
`synced` index never populates and `getUnsyncedBrews()` always returns `[]`. Fixing it
means typing it `0 | 1`, normalising in `addBrew`/`updateBrew`/`putAllBrews`, and a
`DB_VERSION = 2` upgrade that cursor-walks existing records — do that alongside the sync
work, with a Settings → Backup export taken first.

Once the index works, a sync module should POST `getUnsyncedBrews()` to a self-hosted
FastAPI endpoint, then `updateBrew({ ...brew, synced: 1 })`.
