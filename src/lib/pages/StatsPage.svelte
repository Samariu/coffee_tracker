<script lang="ts">
  import Icon from '../components/Icon.svelte';
  import PageHeader from '../components/PageHeader.svelte';
  import { appState, go } from '../stores.svelte';
  import { RATING_WORDS } from '../constants';
  import { beanTitle, dayLabel, plural } from '../format';
  import { beanStats, methodCounts, overview, ratingTrend } from '../stats';

  let o = $derived(overview(appState.brews));
  let trend = $derived(ratingTrend(appState.brews));
  let beans = $derived(beanStats(appState.brews).slice(0, 8));
  let methods = $derived(methodCounts(appState.brews));

  // --- trend chart: scrub to read a bar; at rest it shows the latest brew ---
  let picked = $state<number | null>(null);
  let shown = $derived(trend[picked ?? trend.length - 1]);

  function scrub(e: PointerEvent) {
    const el = e.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    const i = Math.floor(((e.clientX - r.left) / r.width) * trend.length);
    picked = Math.max(0, Math.min(trend.length - 1, i));
  }
</script>

<div class="page">
  <PageHeader title="Insights" subtitle={plural(o.total, 'brew')} />

  {#if o.total === 0}
    <div class="empty">
      <Icon name="insights" size={32} stroke={1.4} />
      <h3>No data yet</h3>
      <p>Log a few brews and patterns start showing up here.</p>
      <button class="btn btn-primary" onclick={() => go('log')}>Log a brew</button>
    </div>
  {:else}
    <section class="hero">
      <div class="hero-main">
        <span class="label">Average rating</span>
        <span class="hero-value num">{o.avgRating?.toFixed(1) ?? '—'}<small>/10</small></span>
      </div>
      <div class="tiles">
        <div class="tile"><span class="tile-value num">{o.thisWeek}</span><span class="tile-label">last 7 days</span></div>
        <div class="tile"><span class="tile-value num">{o.streak}</span><span class="tile-label">day streak</span></div>
        <div class="tile"><span class="tile-value num">{o.avgRatio ? `1:${o.avgRatio.toFixed(1)}` : '—'}</span><span class="tile-label">avg ratio</span></div>
      </div>
    </section>

    {#if trend.length > 1}
      <section class="section">
        <div class="section-head">
          <span class="label">Rating, last {trend.length}</span>
          {#if picked !== null}
            <button class="btn btn-sm btn-ghost" onclick={() => (picked = null)}>Latest</button>
          {/if}
        </div>
        {#if shown}
          <div class="readout">
            <b class="num">{shown.rating}</b>
            <div>
              <span class="readout-title">{beanTitle(shown.beans.brand, shown.beans.name)}</span>
              <span class="readout-sub num">{RATING_WORDS[shown.rating]} · {dayLabel(shown.timestamp)} · {shown.grinder.setting} clicks</span>
            </div>
          </div>
        {/if}
        <div
          class="chart"
          role="img"
          aria-label="Ratings of the last {trend.length} rated brews"
          onpointerdown={scrub}
          onpointermove={(e) => e.buttons && scrub(e)}
        >
          <div class="grid" style:bottom="50%"></div>
          {#each trend as b, i (b.id)}
            <div
              class="bar"
              class:active={i === (picked ?? trend.length - 1)}
              style:height="{b.rating * 10}%"
            ></div>
          {/each}
        </div>
        <div class="axis"><span>older</span><span>newest</span></div>
      </section>
    {/if}

    {#if beans.length > 0}
      <section class="section">
        <div class="section-head">
          <span class="label">Beans</span>
          <span class="label">avg · sweet spot</span>
        </div>
        <div class="rows">
          {#each beans as bean (bean.title)}
            <div class="bean-row">
              <div class="bean-top">
                <span class="name">{bean.title}</span>
                <span class="val num">{bean.avg.toFixed(1)}</span>
                <span class="spot num" class:none={bean.sweetSpot === null}>
                  {bean.sweetSpot !== null ? `${bean.sweetSpot} clk` : '—'}
                </span>
              </div>
              <div class="track"><div class="fill" style:width="{bean.avg * 10}%"></div></div>
              <span class="sub">{plural(bean.count, 'rated brew')}</span>
            </div>
          {/each}
        </div>
        <p class="hint">Sweet spot is the average grind of brews you rated 8 or higher.</p>
      </section>
    {/if}

    <section class="section">
      <span class="label">Methods</span>
      <div class="rows">
        {#each methods as m (m.method)}
          <div class="method-row">
            <Icon method={m.method} size={18} />
            <span class="name">{m.label}</span>
            <div class="track grow"><div class="fill" style:width="{(m.count / o.total) * 100}%"></div></div>
            <span class="val num">{m.count}</span>
          </div>
        {/each}
      </div>
    </section>
  {/if}
</div>

<style>
  .hero {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 20px;
    border-radius: var(--radius);
    border: 1px solid var(--line);
    background:
      radial-gradient(120% 90% at 100% 0%, var(--accent-soft), transparent 60%),
      var(--surface);
  }
  .hero-main { display: flex; flex-direction: column; gap: 4px; }
  .hero-value {
    font-family: var(--font-display);
    font-size: 3.6rem;
    font-weight: 400;
    line-height: 1;
    letter-spacing: -0.03em;
    font-variation-settings: 'opsz' 144;
  }
  .hero-value small { font-size: 1.1rem; color: var(--text-3); margin-left: 4px; letter-spacing: 0; }
  .tiles { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .tile {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 10px 12px;
    border-radius: var(--radius-sm);
    background: rgba(0, 0, 0, 0.22);
  }
  .tile-value { font-size: 1.2rem; font-weight: 600; }
  .tile-label { font-size: 0.72rem; color: var(--text-3); }

  .readout { display: flex; align-items: center; gap: 12px; min-height: 44px; }
  .readout b {
    font-family: var(--font-display);
    font-size: 2rem;
    font-weight: 500;
    color: var(--accent-2);
    min-width: 1.6ch;
  }
  .readout div { display: flex; flex-direction: column; min-width: 0; }
  .readout-title { font-weight: 600; font-size: 0.92rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .readout-sub { font-size: 0.78rem; color: var(--text-3); }

  .chart {
    position: relative;
    display: flex;
    align-items: flex-end;
    gap: 2px;
    height: 120px;
    border-bottom: 1px solid var(--line-strong);
    touch-action: pan-y;
    cursor: crosshair;
  }
  .grid { position: absolute; left: 0; right: 0; border-top: 1px dashed var(--line); pointer-events: none; }
  .bar {
    flex: 1;
    min-width: 0;
    border-radius: 4px 4px 0 0;
    background: var(--surface-3);
    transition: background 0.15s;
  }
  .bar.active { background: var(--accent); }
  .axis { display: flex; justify-content: space-between; font-size: 0.7rem; color: var(--text-3); margin-top: -4px; }

  .rows { display: flex; flex-direction: column; gap: 14px; }
  .bean-row { display: flex; flex-direction: column; gap: 6px; }
  .bean-top { display: flex; align-items: baseline; gap: 10px; }
  .name { flex: 1; min-width: 0; font-size: 0.9rem; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .val { font-weight: 600; font-size: 0.9rem; }
  .spot { min-width: 4.2rem; text-align: right; font-size: 0.82rem; color: var(--accent-2); font-weight: 600; }
  .spot.none { color: var(--text-3); font-weight: 400; }
  .sub { font-size: 0.72rem; color: var(--text-3); }
  .track { height: 6px; border-radius: 3px; background: var(--surface-2); overflow: hidden; }
  .fill { height: 100%; border-radius: 3px; background: var(--accent); min-width: 4px; }

  .method-row { display: flex; align-items: center; gap: 10px; color: var(--text-2); }
  .method-row .name { flex: 0 0 6.5rem; color: var(--text); }
  .grow { flex: 1; }
  .method-row .val { min-width: 2ch; text-align: right; color: var(--text); }
</style>
