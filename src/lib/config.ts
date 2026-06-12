/**
 * Tunable spinner-reel animation settings. Adjust these to change how the spin
 * feels — everything is static and read by `SpinnerReel.svelte`.
 */
export const SPINNER_CONFIG = {
  /** Total duration of a single spin, in milliseconds. Larger = slower spin. */
  durationMs: 5000,
  /**
   * CSS timing function. A strong ease-out (fast start, long slow finish) gives
   * the CS:GO case-opening feel. Try `cubic-bezier(0.16, 1, 0.3, 1)` for snappier.
   */
  easing: 'cubic-bezier(0.18, 0.9, 0.24, 1)',
  /** How many cells the reel travels per spin (more = longer visible travel). */
  spinCells: 48,
  /** Quick nudge that snaps the landed cell to exact centre, in milliseconds. */
  settleMs: 450,
  /** Easing for that final centring nudge. */
  settleEasing: 'cubic-bezier(0.22, 1, 0.36, 1)',
}
