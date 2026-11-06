/**
 * One app-wide toast. Lives outside any page so it survives navigation — saving a
 * brew and immediately switching tabs must not swallow the Undo.
 *
 * Undo is the app's safety net in place of confirm() dialogs and validation gates.
 */
interface Toast {
  id: number;
  message: string;
  action?: { label: string; run: () => void | Promise<void> };
}

export const toastState = $state<{ current: Toast | null }>({ current: null });

let timer: ReturnType<typeof setTimeout> | null = null;
let seq = 0;

export function toast(message: string, action?: Toast['action'], ms = 5000) {
  if (timer) clearTimeout(timer);
  const id = ++seq;
  toastState.current = { id, message, action };
  timer = setTimeout(() => {
    if (toastState.current?.id === id) toastState.current = null;
  }, ms);
}

export function dismissToast() {
  if (timer) clearTimeout(timer);
  toastState.current = null;
}

/** Shorthand for the common case: show `message` with an Undo that runs `undo`. */
export function toastUndo(message: string, undo: () => void | Promise<void>) {
  toast(message, { label: 'Undo', run: undo });
}
