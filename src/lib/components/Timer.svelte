<script lang="ts">
  let {
    label = 'Timer',
    onDone,
  }: {
    label?: string;
    onDone: (seconds: number) => void;
  } = $props();

  let running = $state(false);
  let seconds = $state(0);
  let startTime = 0;
  let handle: ReturnType<typeof setInterval> | null = null;

  function start() {
    if (running) return;
    // Offset by already-elapsed seconds so resume works correctly
    startTime = Date.now() - seconds * 1000;
    running = true;
    handle = setInterval(() => {
      seconds = Math.floor((Date.now() - startTime) / 1000);
    }, 250);
  }

  function stop() {
    if (!running) return;
    running = false;
    if (handle) clearInterval(handle);
    handle = null;
    onDone(seconds);
  }

  function reset() {
    running = false;
    if (handle) clearInterval(handle);
    handle = null;
    seconds = 0;
  }

  function fmt(s: number): string {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  // Re-sync immediately when tab regains focus (iOS throttles background intervals)
  $effect(() => {
    function onVisible() {
      if (running) seconds = Math.floor((Date.now() - startTime) / 1000);
    }
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  });
</script>

<div class="timer" class:running>
  <span class="timer-label">{label}</span>
  <span class="timer-display">{fmt(seconds)}</span>
  <div class="timer-btns">
    {#if !running}
      <button class="btn btn-primary" onclick={start}>Start</button>
    {:else}
      <button class="btn btn-danger" onclick={stop}>Stop</button>
    {/if}
    <button class="btn btn-ghost" onclick={reset}>Reset</button>
  </div>
</div>

<style>
  .timer {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: var(--surface-2);
    border-radius: 12px;
    border: 1px solid var(--border);
    transition: border-color 0.2s;
  }
  .timer.running { border-color: var(--primary); }
  .timer-label {
    font-size: 0.8rem;
    color: var(--text-muted);
    min-width: 3.5rem;
  }
  .timer-display {
    font-size: 1.4rem;
    font-variant-numeric: tabular-nums;
    font-weight: 600;
    color: var(--text);
    min-width: 3.5rem;
  }
  .timer-btns {
    display: flex;
    gap: 0.5rem;
    margin-left: auto;
  }
</style>
