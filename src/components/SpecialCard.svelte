<script lang="ts">
  import { fly, fade } from 'svelte/transition'
  import type { SpecialItem } from '../lib/specials'
  import { config } from '../lib/config'

  interface Props {
    item: SpecialItem
    /** The flavour line chosen at pick time. */
    description: string
  }

  let { item, description }: Props = $props()
  const meta = $derived($config.rarities[item.rarity])
</script>

<div
  class="special-wrap"
  class:glow={meta.glow}
  style="--rarity: {meta.color}"
  in:fly={{ y: 14, duration: 280 }}
>
  <div class="special card">
    <span class="badge" in:fade={{ duration: 300, delay: 60 }}>
      {meta.dot}
      {meta.label}
    </span>

    <div class="glyph" class:gold={item.gold} class:cjk={item.gold}>
      {item.glyph}
    </div>

    <div class="name">{item.name}</div>
    {#if item.kanji}
      <div class="reading cjk">{item.kanji}</div>
    {/if}
    <p class="message">{description}</p>
  </div>
</div>

<style>
  /* The wrapper centres the card and hosts the glow ring. fit-content so the
     ring (an absolutely-positioned ::before inset around it) hugs the card. */
  .special-wrap {
    position: relative;
    width: fit-content;
    max-width: 100%;
    margin: 0 auto;
  }
  .special {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.6rem;
    padding: 1.75rem 1.5rem;
    text-align: center;
    border-color: color-mix(in srgb, var(--rarity) 55%, var(--border));
    box-shadow: 0 0 0 1px var(--rarity), 0 0 40px -10px var(--rarity);
  }

  /* Glow tiers (legendary, secret): an animated rarity-coloured "comet" that
     orbits the card edge. It is the wrapper's ::before so it paints BEHIND the
     card by DOM order (no negative z-index that would escape behind the stage),
     while still sitting in front of the stage panel. */
  .special-wrap.glow::before {
    content: '';
    position: absolute;
    inset: -6px;
    border-radius: 1.4rem;
    background: conic-gradient(
      from var(--glow-angle, 0deg),
      transparent 0deg,
      transparent 210deg,
      var(--rarity) 270deg,
      #ffffff 312deg,
      var(--rarity) 348deg,
      transparent 360deg
    );
    filter: blur(12px);
    opacity: 1;
    pointer-events: none;
    animation: glow-spin 2.5s linear infinite;
  }
  /* Under the sweeping comet, keep only a faint constant glow so the card never
     looks unlit (the broad static halo washed the motion out). */
  .special-wrap.glow .special {
    box-shadow: 0 0 0 1px var(--rarity), 0 0 20px -12px var(--rarity);
  }
  /* Animating a registered custom property gives a smooth conic rotation
     without transforming (and thus reflowing) the ring. */
  @property --glow-angle {
    syntax: '<angle>';
    initial-value: 0deg;
    inherits: false;
  }
  @keyframes glow-spin {
    to {
      --glow-angle: 360deg;
    }
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--rarity);
    border: 1px solid color-mix(in srgb, var(--rarity) 50%, transparent);
    background: color-mix(in srgb, var(--rarity) 14%, transparent);
    padding: 0.25rem 0.7rem;
    border-radius: 999px;
  }
  .glyph {
    font-size: 5.5rem;
    line-height: 1;
  }
  .name {
    font-size: 1.6rem;
    font-weight: 800;
    letter-spacing: -0.01em;
  }
  .reading {
    font-size: 1.05rem;
    color: var(--muted);
    margin-top: -0.2rem;
  }
  .message {
    margin: 0.2rem 0 0;
    color: var(--muted);
    font-size: 1.02rem;
    max-width: 28rem;
  }

  .gold {
    /* Two identical gold cycles in the image; with a 200% background-size that
       is exactly two cycles, so travelling 0% -> 100% (one cycle) makes the
       start and end frames identical and the loop is seamless (no snap). */
    background-image: linear-gradient(
      100deg,
      #b8860b,
      #ffd700,
      #fff3b0,
      #ffd700,
      #b8860b,
      #ffd700,
      #fff3b0,
      #ffd700,
      #b8860b
    );
    background-size: 200% 100%;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    animation: shimmer 3s linear infinite;
  }
  @keyframes shimmer {
    from {
      background-position: 0% 0;
    }
    to {
      background-position: 100% 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .gold,
    .special-wrap.glow::before {
      animation: none;
    }
  }
</style>
