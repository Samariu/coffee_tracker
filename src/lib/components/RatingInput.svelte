<script lang="ts">
  let {
    value = $bindable(0),
    compact = false,
  }: { value?: number; compact?: boolean } = $props();
</script>

<div class="rating" class:compact>
  {#if value === 0 && !compact}
    <span class="unrated">tap to rate</span>
  {/if}
  {#each { length: 10 } as _, i}
    {@const n = i + 1}
    <button
      class="pip"
      class:active={value > 0 && n <= value}
      class:selected={n === value}
      onclick={() => (value = value === n ? 0 : n)}
      aria-label="Rate {n}"
    >{n}</button>
  {/each}
</div>

<style>
  .rating {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    flex-wrap: wrap;
  }
  .unrated {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-style: italic;
    margin-right: 0.25rem;
  }
  .rating.compact { gap: 0.25rem; }
  .rating.compact .pip {
    flex: 1 1 0;
    width: auto;
    min-width: 0;
  }
  .pip {
    width: 2.4rem;
    height: 2.4rem;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--surface-2);
    color: var(--text-muted);
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
  }
  .pip.active {
    background: var(--surface-3);
    color: var(--text);
    border-color: var(--primary);
  }
  .pip.selected {
    background: var(--primary);
    color: #1a1008;
    border-color: var(--primary);
  }
</style>
