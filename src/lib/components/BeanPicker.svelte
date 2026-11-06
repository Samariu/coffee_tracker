<script lang="ts">
  import type { BeanOption } from '../types';
  import { beanTitle } from '../utils';

  let {
    options,
    selectedKey = '',
    onpick,
    onnew,
  }: {
    options: BeanOption[];
    selectedKey?: string;
    onpick: (o: BeanOption) => void;
    onnew: () => void;
  } = $props();
</script>

<div class="chip-row">
  {#each options as o (o.key)}
    <button class="chip" class:selected={o.key === selectedKey} onclick={() => onpick(o)}>
      <span class="chip-name">{beanTitle(o.brand, o.name)}</span>
      {#if o.remainingGrams !== null}
        <span class="chip-meta" class:empty={o.remainingGrams <= 0}>{o.remainingGrams}g</span>
      {/if}
    </button>
  {/each}
  <button class="chip chip-new" onclick={onnew}>+ New</button>
</div>

<style>
  .chip-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 11rem;
  }
  .chip-meta {
    font-size: 0.68rem;
    font-weight: 600;
    color: var(--text-muted);
  }
  .chip-meta.empty { color: var(--error); }
  .chip.selected .chip-meta { color: var(--primary-light); }
  .chip-new {
    color: var(--primary-light);
    border-style: dashed;
  }
</style>
