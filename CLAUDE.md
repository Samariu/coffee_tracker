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

Global mutable state lives in `src/lib/stores.svelte.ts` as a single `$state` object (`appState`). This is a Svelte 5 `.svelte.ts` module — the `$state` rune is available at module level because the file extension opts into the Svelte compiler. Components import `appState` and mutate it directly; navigate with `go('history')`. After any DB write, call the corresponding `refresh*()` helper to sync the in-memory state.

**Never hand a `$state` proxy to IndexedDB** — it can't be structured-cloned and `put` throws. Records read from `appState` (or a `$state` form) must go through `$state.snapshot()` first; a flat object spread (`{ ...bean }`) is also fine, a nested one (`{ ...brew }`) is not.

`src/lib/toast.svelte.ts` is the single app-wide toast, rendered in `App.svelte` so it survives navigation. `toastUndo(message, fn)` is how every destructive action is made safe — deletes happen immediately and offer Undo rather than asking `confirm()` first. (Backup restore is the one exception: it can't be undone, so it confirms.)

### Data layer

`src/lib/db.ts` owns all IndexedDB access via the `idb` library. Three stores: `brews` (indexed by `timestamp` and `synced`), `beans`, `recipes`. Call `initDB()` once on app mount before any other DB operations. Writes are `put*` (insert-or-replace — also how Undo restores a deleted record); `replaceAllData()` does backup restore in a single transaction.

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
`findInventoryBean`, …) are pure functions in `setups.ts`; components wrap them in
`$derived.by`. `defaultsFor` is the single home of the "prefill from your last brew of
this bean+method, else `METHODS[m].defaults`" rule — go through it rather than reading
the defaults directly.

### Modules

```
lib/constants.ts  ← K2 grinder geometry, METHODS (label/bloom/defaults), ROAST_LEVELS, RATING_WORDS
lib/format.ts     ← display strings: dates, durations, ratio, grind ("1R + 12"), bean titles
lib/setups.ts     ← fast-log derivations (above)
lib/stats.ts      ← Insights derivations (overview, trend, per-bean, per-method)
lib/files.ts      ← CSV export, JSON backup make/parse, downloadFile
lib/icons.ts      ← SVG path data: UI icons (Lucide) + hand-drawn brew-method glyphs
lib/dom.ts        ← revealSelected(): scroll a chip row to its selected chip
```

### Component tree

```
App.svelte                  ← DB init, page routing, bottom nav (5 tabs), <Toast>
  pages/LogPage.svelte      ← "Brew" tab; one $state<LogDraft> object, sticky save bar
  pages/HistoryPage.svelte  ← "Journal"; day-grouped list, detail/edit sheet, CSV, "Brew again"
  pages/StatsPage.svelte    ← "Insights"; pure $derived over stats.ts, no DB calls
  pages/BeansPage.svelte    ← inventory CRUD in a sheet
  pages/RecipesPage.svelte  ← recipe CRUD in a sheet; "Brew this" prefills Log via a draft
  pages/SettingsPage.svelte ← not a tab — reached from the gear in every PageHeader
  components/PageHeader.svelte    ← large serif title + actions snippet + settings gear
  components/Sheet.svelte         ← bottom sheet on native <dialog>; bind:open, footer snippet
  components/Toast.svelte         ← renders toastState
  components/Icon.svelte          ← <Icon name="…"/> or <Icon method="v60"/>
  components/SetupStrip.svelte    ← h-scrolling one-tap cards: top setups + recipes
  components/BeanPicker.svelte    ← bean chips (inventory ∪ history) + "New"
  components/MethodPicker.svelte  ← method chips; enabled methods by default, `methods` prop overrides
  components/Stepper.svelte       ← label · −coarse/−/value/+/+coarse row, bind:value
  components/GrinderSlider.svelte ← big click readout, K2 dial, 0–120 slider, ±1/±5 nudges
  components/RatingInput.svelte   ← 1–10 segmented level bar with word label, bind:value
  components/Timer.svelte         ← play/pause/reset, bind:value (seconds)
  components/BrewRow.svelte       ← one Journal list row
```

### Styling

All tokens are CSS variables in `src/app.css`: warm near-black surfaces stepping up in lightness (`--bg` → `--surface-3`), cream ink in three strengths (`--text`, `--text-2`, `--text-3`), hairlines (`--line`, `--line-strong`) and a single accent (`--accent`, "crema") — keep it the only colour that asks for attention. Type is Inter for UI and Fraunces (`--font-display`) for titles and hero numbers, both self-hosted via `@fontsource-variable` so they work offline. Icons are SVG via `<Icon>`; don't reintroduce emoji.

Global classes (`.page`, `.section`, `.section-head`, `.label`, `.hint`, `.empty`, `.grid-2`, `.field`, `.input`/`.select`/`.textarea`, `.btn` + `-primary`/`-secondary`/`-ghost`/`-danger`/`-sm`, `.icon-btn`, `.chip`/`.chip-row`/`.chip-scroll`, `.pills`/`.pill`, `.stat-cells`/`.stat-cell`, `.list`/`.list-row`, `.switch`, `.num`) are declared there — do not re-declare them in component `<style>` blocks. Component styles are scoped and extend the globals.

### PWA

`vite.config.ts` configures `vite-plugin-pwa` with Workbox `generateSW`. The manifest targets iPhone (`standalone`, `viewport-fit=cover`, `apple-mobile-web-app-capable`). Icons at `public/icons/icon-{192,512}.png` are full-bleed (maskable) renders of the bean glyph on `--bg`; `public/favicon.svg` is the rounded version.

### Planned: Raspberry Pi backend

The `synced` field on `Brew` is the hook point. **Note it is currently a `boolean`, not
the `0`/`1` this section long claimed.** Booleans are not valid IndexedDB keys, so the
`synced` index never populates and `getUnsyncedBrews()` always returns `[]`. Fixing it
means typing it `0 | 1`, normalising in `addBrew`/`putBrew`/`replaceAllData`, and a
`DB_VERSION = 2` upgrade that cursor-walks existing records — do that alongside the sync
work, with a Settings → Backup export taken first.

Once the index works, a sync module should POST `getUnsyncedBrews()` to a self-hosted
FastAPI endpoint, then `putBrew({ ...brew, synced: 1 })`.
