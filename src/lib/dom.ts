/**
 * Scroll a horizontal chip row so its `.selected` chip is in view. Only scrolls the
 * row itself — scrollIntoView() would also drag the page vertically.
 *
 * `_key` is unused; passing the selected value makes a calling $effect re-run when
 * the selection changes.
 */
export function revealSelected(row: HTMLElement | undefined, _key: unknown): void {
  queueMicrotask(() => {
    const chip = row?.querySelector<HTMLElement>('.selected');
    if (!row || !chip) return;
    const left = chip.offsetLeft;
    const right = left + chip.offsetWidth;
    if (left < row.scrollLeft || right > row.scrollLeft + row.clientWidth) {
      row.scrollTo({ left: left - 16, behavior: 'smooth' });
    }
  });
}
