<script lang="ts">
  import Icon from './Icon.svelte';
  import { formatClock } from '../format';

  // `value` is bindable so the parent owns the seconds. That's what makes a parent
  // reset actually reach the display, and what stops a still-running timer from
  // being discarded on save.
  let {
    label = 'Timer',
    value = $bindable(0),
  }: {
    label?: string;
    value?: number;
  } = $props();

  let running = $state(false);
  let startTime = 0;
  let handle: ReturnType<typeof setInterval> | null = null;

  function clear() {
    if (handle) clearInterval(handle);
    handle = null;
  }

  function tick() {
    value = Math.floor((Date.now() - startTime) / 1000);
  }

  function toggle() {
    if (running) {
      running = false;
      clear();
      return;
    }
    // Offset by already-elapsed seconds so resume works correctly.
    startTime = Date.now() - value * 1000;
    running = true;
    handle = setInterval(tick, 250);
  }

  function reset() {
    running = false;
    clear();
    value = 0;
  }

  // Re-sync immediately when the app regains focus (iOS throttles background intervals).
  $effect(() => {
    const onVisible = () => running && tick();
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  });

  // Without this, navigating away mid-brew leaves the interval writing forever.
  $effect(() => clear);
</script>

<div class="timer" class:running>
  <span class="timer-label">{label}</span>
  <span class="timer-display num">{formatClock(value)}</span>
  <button class="icon-btn reset" onclick={reset} aria-label="Reset {label}" disabled={!value && !running}>
    <Icon name="refresh" size={16} />
  </button>
  <button class="icon-btn go" onclick={toggle} aria-label="{running ? 'Pause' : 'Start'} {label}">
    <Icon name={running ? 'pause' : 'play'} size={18} stroke={2} />
  </button>
</div>

<style>
  .timer {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 8px 8px 14px;
    background: var(--surface-2);
    border-radius: var(--radius-sm);
    border: 1px solid transparent;
    transition: border-color 0.2s;
  }
  .timer.running { border-color: var(--accent-line); }
  .timer-label { font-size: 0.9rem; color: var(--text-2); flex: 1; }
  .timer-display { font-size: 1.25rem; font-weight: 600; margin-right: 4px; }
  .reset { background: transparent; }
  .reset:disabled { opacity: 0.3; }
  .go { background: var(--accent); color: var(--accent-ink); }
  .running .go { background: var(--text); color: var(--bg); }
</style>
