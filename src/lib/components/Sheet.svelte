<script lang="ts">
  import type { Snippet } from 'svelte';
  import Icon from './Icon.svelte';

  /**
   * Bottom sheet on a native <dialog>: focus trapping, Escape and the top layer come
   * from the browser, so no z-index fights and no hand-rolled a11y.
   */
  let {
    open = $bindable(false),
    title,
    children,
    footer,
  }: {
    open?: boolean;
    title: string;
    children: Snippet;
    footer?: Snippet;
  } = $props();

  let dialog: HTMLDialogElement;

  $effect(() => {
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  });

  // A click whose target is the <dialog> itself landed on the backdrop.
  function onclick(e: MouseEvent) {
    if (e.target === dialog) open = false;
  }
</script>

<dialog bind:this={dialog} {onclick} onclose={() => (open = false)}>
  {#if open}
    <div class="sheet">
      <div class="grabber"></div>
      <header>
        <h2>{title}</h2>
        <button class="icon-btn" onclick={() => (open = false)} aria-label="Close">
          <Icon name="x" size={18} />
        </button>
      </header>
      <div class="body">
        {@render children()}
      </div>
      {#if footer}
        <footer>{@render footer()}</footer>
      {/if}
    </div>
  {/if}
</dialog>

<style>
  dialog {
    margin: auto auto 0;
    padding: 0;
    border: 0;
    width: 100%;
    max-width: 520px;
    max-height: 92dvh;
    background: transparent;
    color: var(--text);
    overflow: visible;
  }
  dialog::backdrop {
    background: rgba(5, 4, 3, 0.62);
    animation: fade 0.2s ease-out;
  }
  .sheet {
    display: flex;
    flex-direction: column;
    max-height: 92dvh;
    background: var(--surface);
    border: 1px solid var(--line-strong);
    border-bottom: 0;
    border-radius: 24px 24px 0 0;
    animation: rise 0.28s cubic-bezier(0.2, 0.9, 0.3, 1);
  }
  .grabber {
    width: 36px;
    height: 4px;
    border-radius: 2px;
    background: var(--line-strong);
    margin: 8px auto 0;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 8px 16px 4px 20px;
  }
  h2 {
    margin: 0;
    font-family: var(--font-display);
    font-weight: 500;
    font-size: 1.35rem;
    letter-spacing: -0.01em;
  }
  .body {
    overflow-y: auto;
    padding: 12px 20px 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  /* The body scrolls; without this its flex children shrink to fit instead. */
  .body > :global(*) { flex-shrink: 0; }
  footer {
    display: flex;
    gap: 8px;
    padding: 12px 20px calc(12px + var(--safe-bottom));
    border-top: 1px solid var(--line);
  }
  footer :global(.btn) { flex: 1; }

  @keyframes rise { from { transform: translateY(40px); opacity: 0; } }
  @keyframes fade { from { opacity: 0; } }
</style>
