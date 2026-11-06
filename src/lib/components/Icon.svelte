<script lang="ts">
  import { ICONS, METHOD_ICONS, type IconName } from '../icons';
  import type { BrewMethod } from '../types';

  let {
    name,
    method,
    size = 20,
    stroke = 1.75,
  }: {
    name?: IconName;
    /** Draw a brew-method glyph instead of a UI icon. */
    method?: BrewMethod;
    size?: number;
    stroke?: number;
  } = $props();

  let paths = $derived(method ? METHOD_ICONS[method] : name ? ICONS[name] : []);
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width={stroke}
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  {#each paths as d (d)}<path {d} />{/each}
</svg>

<style>
  svg { flex-shrink: 0; display: block; }
</style>
