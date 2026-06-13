<script lang="ts">
  import { untrack } from 'svelte'

  interface Props {
    min: number
    max: number
    from: number
    to: number
    step?: number
    label: string
    onchange: (from: number, to: number) => void
  }

  let { min, max, from, to, step = 1, label, onchange }: Props = $props()

  // Two independent thumb values that may cross each other. The emitted range is
  // always sorted, so the knobs can be dragged past one another freely. Seeded
  // from the initial props; kept in sync afterwards by the $effect below.
  let a = $state(untrack(() => from))
  let b = $state(untrack(() => to))
  let dragging = $state(false)
  let trackEl: HTMLDivElement
  let thumbEls: HTMLButtonElement[] = []

  const span = $derived(Math.max(1, max - min))
  const lo = $derived(Math.min(a, b))
  const hi = $derived(Math.max(a, b))
  const pctA = $derived(((a - min) / span) * 100)
  const pctB = $derived(((b - min) / span) * 100)
  const pctLo = $derived(Math.min(pctA, pctB))
  const pctHi = $derived(Math.max(pctA, pctB))

  // Sync from props on external changes (e.g. Reset), but skip our own emits and
  // anything mid-drag so the active thumb is never yanked.
  $effect(() => {
    const f = from
    const t = to
    untrack(() => {
      if (dragging) return
      if (Math.min(a, b) === f && Math.max(a, b) === t) return
      a = f
      b = t
    })
  })

  function clamp(v: number, low = min, high = max): number {
    if (Number.isNaN(v)) return low
    return Math.min(high, Math.max(low, Math.round(v)))
  }

  function emit(): void {
    onchange(Math.min(a, b), Math.max(a, b))
  }

  function setThumb(i: 0 | 1, v: number): void {
    const clamped = clamp(v)
    if (i === 0) a = clamped
    else b = clamped
    emit()
  }

  function valueFromClientX(clientX: number): number {
    const rect = trackEl.getBoundingClientRect()
    const ratio = (clientX - rect.left) / rect.width
    return clamp(min + ratio * (max - min))
  }

  function nearestThumb(v: number): 0 | 1 {
    return Math.abs(v - a) <= Math.abs(v - b) ? 0 : 1
  }

  let activeThumb: 0 | 1 | null = null

  function onPointerDown(e: PointerEvent): void {
    e.preventDefault()
    const v = valueFromClientX(e.clientX)
    activeThumb = nearestThumb(v)
    dragging = true
    trackEl.setPointerCapture(e.pointerId)
    thumbEls[activeThumb]?.focus()
    setThumb(activeThumb, v)
  }

  function onPointerMove(e: PointerEvent): void {
    if (!dragging || activeThumb === null) return
    setThumb(activeThumb, valueFromClientX(e.clientX))
  }

  function onPointerUp(e: PointerEvent): void {
    dragging = false
    activeThumb = null
    try {
      trackEl.releasePointerCapture(e.pointerId)
    } catch {
      /* capture may already be released */
    }
  }

  function onThumbKey(i: 0 | 1, e: KeyboardEvent): void {
    const cur = i === 0 ? a : b
    let next = cur
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        next = cur - step
        break
      case 'ArrowRight':
      case 'ArrowUp':
        next = cur + step
        break
      case 'PageDown':
        next = cur - step * 10
        break
      case 'PageUp':
        next = cur + step * 10
        break
      case 'Home':
        next = min
        break
      case 'End':
        next = max
        break
      default:
        return
    }
    e.preventDefault()
    setThumb(i, next)
  }
</script>

<div class="slider">
  <div class="head">
    <span class="label">{label}</span>
    <span class="range-readout">{lo} – {hi}</span>
  </div>

  <div class="row">
    <input
      class="num"
      type="number"
      {min}
      {max}
      value={lo}
      aria-label="{label} von"
      onchange={(e) => {
        const v = clamp(+e.currentTarget.value, min, hi)
        a = v
        b = hi
        emit()
      }}
    />

    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="track-wrap"
      bind:this={trackEl}
      onpointerdown={onPointerDown}
      onpointermove={onPointerMove}
      onpointerup={onPointerUp}
      onpointercancel={onPointerUp}
    >
      <div class="track"></div>
      <div class="fill" style="left: {pctLo}%; right: {100 - pctHi}%"></div>

      <button
        class="thumb"
        type="button"
        style="left: {pctA}%"
        role="slider"
        tabindex="0"
        aria-label="{label} A"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={a}
        bind:this={thumbEls[0]}
        onkeydown={(e) => onThumbKey(0, e)}
      ></button>
      <button
        class="thumb"
        type="button"
        style="left: {pctB}%"
        role="slider"
        tabindex="0"
        aria-label="{label} B"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={b}
        bind:this={thumbEls[1]}
        onkeydown={(e) => onThumbKey(1, e)}
      ></button>
    </div>

    <input
      class="num"
      type="number"
      {min}
      {max}
      value={hi}
      aria-label="{label} bis"
      onchange={(e) => {
        const v = clamp(+e.currentTarget.value, lo, max)
        a = lo
        b = v
        emit()
      }}
    />
  </div>
</div>

<style>
  .slider {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }
  .head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
  }
  .range-readout {
    font-variant-numeric: tabular-nums;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--accent);
  }
  .row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .num {
    width: 4.5rem;
    flex: none;
    text-align: center;
    background: var(--surface);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 0.6rem;
    padding: 0.4rem 0.4rem;
    font-size: 0.9rem;
    font-variant-numeric: tabular-nums;
  }
  .num:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }

  .track-wrap {
    position: relative;
    flex: 1;
    height: 28px;
    display: flex;
    align-items: center;
    touch-action: none;
    cursor: pointer;
  }
  .track {
    position: absolute;
    left: 0;
    right: 0;
    height: 6px;
    border-radius: 999px;
    background: var(--surface-2);
    border: 1px solid var(--border);
  }
  .fill {
    position: absolute;
    height: 6px;
    border-radius: 999px;
    background: var(--accent);
  }

  .thumb {
    position: absolute;
    top: 50%;
    width: 20px;
    height: 20px;
    padding: 0;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    background: var(--surface);
    border: 2px solid var(--accent);
    box-shadow: var(--shadow);
    cursor: grab;
    touch-action: none;
    transition: transform 0.08s ease;
  }
  .thumb:active {
    cursor: grabbing;
    transform: translate(-50%, -50%) scale(1.12);
  }
  .thumb:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
</style>
