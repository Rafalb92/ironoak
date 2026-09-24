import { usePreferredReducedMotion } from '@vueuse/core';
import type { Ref } from 'vue';

interface DiptychSplitOptions {
  /** resting position in percent */
  rest?: number;
  min?: number;
  max?: number;
  /** time constant in ms — higher means heavier */
  smoothing?: number;
}

/**
 * Drives a split position (0–100) written to the `--split` CSS variable.
 * The value approaches its goal exponentially per elapsed time, so motion
 * feels identical at 60 Hz and 144 Hz. Vue never re-renders per frame —
 * only the rounded value used for ARIA is reactive.
 */
export function useDiptychSplit(
  target: Readonly<Ref<HTMLElement | null>>,
  { rest = 50, min = 8, max = 92, smoothing = 90 }: DiptychSplitOptions = {},
) {
  const reducedMotion = usePreferredReducedMotion();

  const value = ref(rest);

  let current = rest;
  let goal = rest;
  let frame: number | null = null;
  let lastTime = 0;

  const clamp = (v: number) => Math.min(max, Math.max(min, v));

  function paint(v: number) {
    target.value?.style.setProperty('--split', v.toFixed(2));
    const rounded = Math.round(v);
    if (rounded !== value.value) value.value = rounded;
  }

  function tick(now: number) {
    const dt = lastTime ? now - lastTime : 16;
    lastTime = now;

    current += (goal - current) * (1 - Math.exp(-dt / smoothing));
    if (Math.abs(goal - current) < 0.05) current = goal;

    paint(current);

    if (current === goal) {
      frame = null;
      lastTime = 0;
    } else {
      frame = requestAnimationFrame(tick);
    }
  }

  function moveTo(v: number) {
    goal = clamp(v);

    if (reducedMotion.value === 'reduce') {
      current = goal;
      paint(current);
      return;
    }

    if (frame === null) frame = requestAnimationFrame(tick);
  }

  function followPointer(event: PointerEvent) {
    const el = target.value;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    moveTo(((event.clientX - rect.left) / rect.width) * 100);
  }

  const reset = () => moveTo(rest);
  const nudge = (delta: number) => moveTo(goal + delta);

  onBeforeUnmount(() => {
    if (frame !== null) cancelAnimationFrame(frame);
  });

  return { value, min, max, moveTo, followPointer, reset, nudge };
}
