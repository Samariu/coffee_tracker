<script lang="ts">
  import { toastState, dismissToast } from '../toast.svelte';
  import Icon from './Icon.svelte';

  async function run() {
    const action = toastState.current?.action;
    dismissToast();
    await action?.run();
  }
</script>

{#if toastState.current}
  {#key toastState.current.id}
    <div class="toast" role="status">
      <Icon name="check" size={16} stroke={2.2} />
      <span class="msg">{toastState.current.message}</span>
      {#if toastState.current.action}
        <button class="action" onclick={run}>{toastState.current.action.label}</button>
      {/if}
    </div>
  {/key}
{/if}

<style>
  .toast {
    position: fixed;
    left: 50%;
    bottom: calc(var(--nav-h) + var(--safe-bottom) + 84px);
    transform: translateX(-50%);
    z-index: 100;
    display: flex;
    align-items: center;
    gap: 10px;
    width: max-content;
    max-width: calc(100vw - 32px);
    padding: 8px 8px 8px 16px;
    background: var(--text);
    color: var(--bg);
    border-radius: 999px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    font-size: 0.9rem;
    font-weight: 600;
    animation: pop 0.25s cubic-bezier(0.2, 0.9, 0.3, 1.2);
  }
  .msg { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .action {
    border: 0;
    border-radius: 999px;
    padding: 7px 14px;
    background: var(--bg);
    color: var(--accent-2);
    font-weight: 700;
    font-size: 0.85rem;
    cursor: pointer;
  }
  @keyframes pop { from { transform: translate(-50%, 12px); opacity: 0; } }
</style>
