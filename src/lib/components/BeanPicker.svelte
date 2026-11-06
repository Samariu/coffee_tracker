<script lang="ts">
  import Icon from './Icon.svelte';
  import { beanTitle } from '../format';
  import { revealSelected } from '../dom';
  import type { BeanOption } from '../types';

  let {
    options,
    selectedKey = '',
    adding = false,
    onpick,
    onnew,
  }: {
    options: BeanOption[];
    selectedKey?: string;
    /** The "New" chip is active — the user is typing a bean in. */
    adding?: boolean;
    onpick: (o: BeanOption) => void;
    onnew: () => void;
  } = $props();

  let row: HTMLElement;
  $effect(() => revealSelected(row, selectedKey));
</script>

<div class="chip-scroll beans" bind:this={row}>
  {#each options as o (o.key)}
    <button class="chip" class:selected={o.key === selectedKey} onclick={() => onpick(o)}>
      <span class="name">{beanTitle(o.brand, o.name)}</span>
      {#if o.remainingGrams !== null}
        <span class="grams num" class:empty={o.remainingGrams <= 0}>{o.remainingGrams}g</span>
      {/if}
    </button>
  {/each}
  <button class="chip new" class:selected={adding} onclick={onnew}>
    <Icon name="plus" size={16} /> New
  </button>
</div>

<style>
  .beans { --chip-bleed: 14px; }
  .name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 13rem;
  }
  .grams { font-size: 0.75rem; color: var(--text-3); }
  .grams.empty { color: var(--danger); }
  .chip.selected .grams { color: var(--accent); }
  .new { border-style: dashed; }
</style>
