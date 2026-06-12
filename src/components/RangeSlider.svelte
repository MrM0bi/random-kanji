<script lang="ts">
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

  const span = $derived(Math.max(1, max - min))
  const pctFrom = $derived(((from - min) / span) * 100)
  const pctTo = $derived(((to - min) / span) * 100)

  function clamp(v: number): number {
    if (Number.isNaN(v)) return min
    return Math.min(max, Math.max(min, Math.round(v)))
  }

  function setFrom(value: number): void {
    let v = clamp(value)
    if (v > to) v = to
    onchange(v, to)
  }

  function setTo(value: number): void {
    let v = clamp(value)
    if (v < from) v = from
    onchange(from, v)
  }
</script>

<div class="slider">
  <div class="head">
    <span class="label">{label}</span>
    <span class="range-readout">{from} – {to}</span>
  </div>

  <div class="row">
    <input
      class="num"
      type="number"
      {min}
      {max}
      value={from}
      aria-label="{label} von"
      onchange={(e) => setFrom(+e.currentTarget.value)}
    />

    <div class="track-wrap">
      <div class="track"></div>
      <div
        class="fill"
        style="left: {pctFrom}%; right: {100 - pctTo}%"
      ></div>
      <input
        class="thumb"
        type="range"
        {min}
        {max}
        {step}
        value={from}
        aria-label="{label} von"
        oninput={(e) => setFrom(+e.currentTarget.value)}
      />
      <input
        class="thumb"
        type="range"
        {min}
        {max}
        {step}
        value={to}
        aria-label="{label} bis"
        oninput={(e) => setTo(+e.currentTarget.value)}
      />
    </div>

    <input
      class="num"
      type="number"
      {min}
      {max}
      value={to}
      aria-label="{label} bis"
      onchange={(e) => setTo(+e.currentTarget.value)}
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

  /* Two overlapping range inputs; only their thumbs are interactive. */
  .thumb {
    position: absolute;
    left: 0;
    right: 0;
    width: 100%;
    margin: 0;
    background: transparent;
    pointer-events: none;
    -webkit-appearance: none;
    appearance: none;
  }
  .thumb:focus-visible {
    outline: none;
  }
  .thumb::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    pointer-events: auto;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--surface);
    border: 2px solid var(--accent);
    box-shadow: var(--shadow);
    cursor: grab;
    transition: transform 0.12s ease;
  }
  .thumb::-webkit-slider-thumb:active {
    cursor: grabbing;
    transform: scale(1.12);
  }
  .thumb::-moz-range-thumb {
    pointer-events: auto;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--surface);
    border: 2px solid var(--accent);
    box-shadow: var(--shadow);
    cursor: grab;
  }
  .thumb:focus-visible::-webkit-slider-thumb {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  .thumb::-webkit-slider-runnable-track {
    background: transparent;
  }
  .thumb::-moz-range-track {
    background: transparent;
  }
</style>
