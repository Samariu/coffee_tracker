<script lang="ts">
  import Icon from './Icon.svelte';
  import { METHODS } from '../constants';
  import { appState } from '../stores.svelte';
  import { revealSelected } from '../dom';
  import type { BrewMethod } from '../types';

  let {
    value = $bindable('v60' as BrewMethod),
    methods,
    onchange,
  }: {
    value?: BrewMethod;
    /** Defaults to the methods enabled in Settings, most recently brewed first. */
    methods?: BrewMethod[];
    onchange?: (m: BrewMethod) => void;
  } = $props();

  let sortedMethods = $derived.by(() => {
    if (methods) return methods;
    const lastUsed = new Map<BrewMethod, number>();
    for (const brew of appState.brews.slice(0, 50)) {
      if (!lastUsed.has(brew.method)) lastUsed.set(brew.method, brew.timestamp);
    }
    const list = appState.enabledMethods
      .slice()
      .sort((a, b) => (lastUsed.get(b) ?? 0) - (lastUsed.get(a) ?? 0));
    // Never hide the current value — an old brew may use a since-disabled method.
    return list.includes(value) ? list : [value, ...list];
  });

  let row: HTMLElement;
  $effect(() => revealSelected(row, value));

  function pick(m: BrewMethod) {
    value = m;
    onchange?.(m);
  }
</script>

<div class="chip-scroll methods" bind:this={row}>
  {#each sortedMethods as key (key)}
    <button class="chip" class:selected={value === key} onclick={() => pick(key)}>
      <Icon method={key} size={18} />
      {METHODS[key].label}
    </button>
  {/each}
</div>

<style>
  .methods { --chip-bleed: 14px; }
</style>
