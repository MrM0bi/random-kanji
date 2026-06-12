<script lang="ts">
  import { tick, onMount, untrack } from 'svelte'
  import type { KanjiEntry } from '../lib/types'
  import { meaningText } from '../lib/display'
  import { SPINNER_CONFIG } from '../lib/config'

  interface Props {
    pool: KanjiEntry[]
    mode: 'kanji' | 'meaning'
    lang: string
    onsettled?: () => void
  }

  let { pool, mode, lang, onsettled }: Props = $props()

  const SPIN_CELLS = SPINNER_CONFIG.spinCells // cells travelled per spin (plus jitter)
  const TAIL = 8 // buffer cells after the winner (right fade room)
  const TEASER_LEN = 24
  const DURATION = SPINNER_CONFIG.durationMs
  const EASE = SPINNER_CONFIG.easing
  const SETTLE_MS = SPINNER_CONFIG.settleMs
  const SETTLE_EASE = SPINNER_CONFIG.settleEasing

  let viewport = $state<HTMLDivElement | null>(null)
  let stripEl = $state<HTMLDivElement | null>(null)
  let cells = $state<KanjiEntry[]>([])
  let offset = $state(0)
  let transition = $state('none')
  let spinning = $state(false)
  let winnerIdx = $state(-1)
  let hasSpun = $state(false)

  let pendingWinnerIdx = -1
  let endTimer: ReturnType<typeof setTimeout> | undefined

  function label(e: KanjiEntry): string {
    return mode === 'kanji' ? e.kanji : meaningText(e, lang)
  }

  function randomEntry(p: KanjiEntry[]): KanjiEntry {
    return p[Math.floor(Math.random() * p.length)]
  }

  function prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  /** Position the strip so the given cell index sits under the centre marker. */
  async function centerOn(index: number, animate = false): Promise<void> {
    await tick()
    if (!stripEl || !viewport) return
    const cell = stripEl.children[index] as HTMLElement | undefined
    if (!cell) return
    const vw = viewport.clientWidth
    transition = animate ? `transform ${DURATION}ms ${EASE}` : 'none'
    offset = -(cell.offsetLeft + cell.offsetWidth / 2 - vw / 2)
  }

  /** Idle strip shown before the first spin so the stage never looks empty. */
  function buildTeaser(): void {
    if (spinning || hasSpun || pool.length === 0) return
    cells = Array.from({ length: TEASER_LEN }, () => randomEntry(pool))
    winnerIdx = -1
    centerOn(Math.floor(TEASER_LEN / 2))
  }

  // Build/refresh the teaser only before the first spin. Once the user has
  // picked, the reel is left untouched (it stays on the winner). Tracks `pool`
  // only — the rest runs untracked so it never re-fires mid-spin.
  $effect(() => {
    pool
    untrack(() => {
      if (!spinning && !hasSpun) buildTeaser()
    })
  })

  // Re-centre the current cell when mode/lang (and thus cell widths) change, so
  // the winner stays centred. Tracks `mode`/`lang` only — NOT `cells`, so the
  // spin's own cell appends/trims can't retrigger it and stomp the animation.
  $effect(() => {
    mode
    lang
    untrack(() => {
      if (spinning) return
      const idx = winnerIdx >= 0 ? winnerIdx : Math.floor(cells.length / 2)
      if (idx >= 0 && cells.length > 0) centerOn(idx)
    })
  })

  onMount(() => {
    const onResize = () => {
      if (spinning) return
      const idx = winnerIdx >= 0 ? winnerIdx : Math.floor(cells.length / 2)
      if (idx >= 0 && cells.length > 0) centerOn(idx)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  })

  export async function spin(winner: KanjiEntry, spinPool: KanjiEntry[]): Promise<void> {
    if (spinPool.length === 0) return
    clearTimeout(endTimer)

    spinning = true
    hasSpun = true
    winnerIdx = -1

    // Commit a no-transition baseline at the CURRENT offset before appending,
    // so the upcoming transition animates from where the reel currently sits.
    transition = 'none'

    // Append a fresh run to the RIGHT of the existing strip (off-screen, so the
    // current view does not jump), with the winner planted near the new end.
    const segment: KanjiEntry[] = []
    for (let i = 0; i < SPIN_CELLS; i++) segment.push(randomEntry(spinPool))
    segment.push(winner)
    for (let i = 0; i < TAIL; i++) segment.push(randomEntry(spinPool))

    const wIdx = cells.length + SPIN_CELLS
    pendingWinnerIdx = wIdx
    cells = [...cells, ...segment]

    await tick()
    if (!stripEl || !viewport) {
      winnerIdx = wIdx
      finish()
      return
    }

    const vw = viewport.clientWidth
    const cell = stripEl.children[wIdx] as HTMLElement
    const cw = cell.offsetWidth
    const jitter = (Math.random() - 0.5) * cw * 0.5
    const target = -(cell.offsetLeft + cw / 2 - vw / 2 + jitter)

    if (prefersReducedMotion()) {
      transition = 'none'
      offset = target
      winnerIdx = wIdx
      endTimer = setTimeout(finish, 80)
      return
    }

    // Force a reflow so the browser commits the `transition: none` + current
    // offset baseline, then animate to the target on the next frame. Without the
    // forced reflow the transition is occasionally dropped (instant jump).
    void stripEl.getBoundingClientRect()
    requestAnimationFrame(() => {
      transition = `transform ${DURATION}ms ${EASE}`
      offset = target
    })
    endTimer = setTimeout(finish, DURATION + 200)
  }

  function onTransitionEnd(e: TransitionEvent): void {
    // Ignore transitions bubbling up from child cells (e.g. the winner's scale
    // animation) — only the strip's own transform settle ends the spin.
    if (e.target !== stripEl) return
    if (e.propertyName !== 'transform') return
    clearTimeout(endTimer)
    finish()
  }

  function finish(): void {
    if (!spinning) return
    spinning = false
    winnerIdx = pendingWinnerIdx
    trimLeft()
    onsettled?.()
    recenterWinner()
  }

  /** Quick nudge so the landed cell ends up exactly centred (it lands with a
   *  little jitter for realism). */
  async function recenterWinner(): Promise<void> {
    await tick()
    if (!stripEl || !viewport || winnerIdx < 0) return
    const cell = stripEl.children[winnerIdx] as HTMLElement | undefined
    if (!cell) return
    const vw = viewport.clientWidth
    const target = -(cell.offsetLeft + cell.offsetWidth / 2 - vw / 2)
    if (prefersReducedMotion()) {
      transition = 'none'
      offset = target
      return
    }
    void stripEl.getBoundingClientRect()
    requestAnimationFrame(() => {
      transition = `transform ${SETTLE_MS}ms ${SETTLE_EASE}`
      offset = target
    })
  }

  /** Drop fully off-screen-left cells, compensating offset so nothing moves. */
  function trimLeft(): void {
    if (!stripEl) return
    const leftEdge = -offset
    const children = stripEl.children
    let drop = 0
    for (let i = 0; i < children.length; i++) {
      const c = children[i] as HTMLElement
      if (c.offsetLeft + c.offsetWidth < leftEdge - 100) drop++
      else break
    }
    if (drop > 0 && drop < winnerIdx) {
      const firstKept = stripEl.children[drop] as HTMLElement
      const shift = firstKept.offsetLeft
      transition = 'none'
      cells = cells.slice(drop)
      offset += shift
      winnerIdx -= drop
      pendingWinnerIdx -= drop
    }
  }
</script>

<div class="reel" class:reel--meaning={mode === 'meaning'} class:spinning>

  <div class="viewport" bind:this={viewport}>
    <div
      class="strip"
      bind:this={stripEl}
      style="transform: translate3d({offset}px, 0, 0); transition: {transition};"
      ontransitionend={onTransitionEnd}
    >
      {#each cells as entry, i (i)}
        <div
          class="cell"
          class:kanji={mode === 'kanji'}
          class:meaning={mode === 'meaning'}
          class:winner={i === winnerIdx}
        >
          <span class:cjk={mode === 'kanji'}>{label(entry)}</span>
        </div>
      {/each}
    </div>
  </div>

  <div class="blur-layer" aria-hidden="true"></div>
  <div class="fade fade-l" aria-hidden="true"></div>
  <div class="fade fade-r" aria-hidden="true"></div>
  <div class="marker" aria-hidden="true">
    <div class="marker-line"></div>
  </div>
</div>

<style>
  .reel {
    --reel-h: 168px;
    --cell-h: 132px;
    position: relative;
    width: 100%;
    height: var(--reel-h);
    overflow: hidden;
    border-radius: 1rem;
    background: linear-gradient(var(--surface-2), var(--surface));
    border: 1px solid var(--border);
    box-shadow: inset 0 0 30px -18px rgba(0, 0, 0, 0.5);
    transition: height 0.3s ease;
  }
  .reel--meaning {
    --reel-h: 120px;
    --cell-h: 84px;
  }

  .viewport {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
  }
  .strip {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 8px;
    will-change: transform;
  }

  .cell {
    flex: 0 0 auto;
    height: var(--cell-h);
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 0.7rem;
    color: var(--text);
    transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
  }
  .cell.kanji {
    width: 116px;
  }
  .cell.kanji .cjk {
    font-size: 3.2rem;
    line-height: 1;
  }
  .cell.meaning {
    width: fit-content;
    max-width: 15rem;
    padding: 0.5rem 0.9rem;
  }
  .cell.meaning span {
    font-size: 1.05rem;
    font-weight: 600;
    line-height: 1.2;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .cell.winner {
    border-color: var(--accent);
    box-shadow: 0 0 0 2px var(--accent), 0 0 28px -6px var(--accent);
    transform: scale(1.06);
  }

  /* Permanent edge blur: frosted at the far ends, sharp through the centre. */
  .blur-layer {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    -webkit-mask-image: linear-gradient(
      to right,
      #000 0%,
      #000 16%,
      transparent 42%,
      transparent 58%,
      #000 84%,
      #000 100%
    );
    mask-image: linear-gradient(
      to right,
      #000 0%,
      #000 16%,
      transparent 42%,
      transparent 58%,
      #000 84%,
      #000 100%
    );
  }

  .fade {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 56px;
    z-index: 3;
    pointer-events: none;
  }
  .fade-l {
    left: 0;
    background: linear-gradient(to right, var(--surface), transparent);
  }
  .fade-r {
    right: 0;
    background: linear-gradient(to left, var(--surface), transparent);
  }

  .marker {
    position: absolute;
    top: 8px;
    bottom: 8px;
    left: 50%;
    width: 2px;
    transform: translateX(-50%);
    z-index: 4;
  }
  /* The vertical line is hidden once landed; the triangles always stay. */
  .marker-line {
    position: absolute;
    inset: 0;
    background: var(--accent);
    border-radius: 2px;
    box-shadow: 0 0 14px -2px var(--accent);
    opacity: 0;
    transition: opacity 0.25s ease;
  }
  .reel.spinning .marker-line {
    opacity: 1;
  }
  .marker::before,
  .marker::after {
    content: '';
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
  }
  .marker::before {
    top: -7px;
    border-top: 8px solid var(--accent);
  }
  .marker::after {
    bottom: -7px;
    border-bottom: 8px solid var(--accent);
  }
</style>
