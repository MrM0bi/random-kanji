<script lang="ts">
  import { untrack } from 'svelte'
  import { get } from 'svelte/store'
  import type { SpecialItem } from '../lib/specials'
  import { config } from '../lib/config'

  interface Props {
    item: SpecialItem
  }

  let { item }: Props = $props()

  const rand = (min: number, max: number) => min + Math.random() * (max - min)

  // The component is remounted per special (keyed), so particles are generated
  // once from the current item — read untracked to make that intent explicit.
  const { rain, sparkles } = untrack(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const meta = get(config).rarities[item.rarity]

    // The item's own emoji rains down across the whole screen.
    const rain = meta.emojiRain && !reduced
      ? Array.from({ length: 30 }, () => ({
          x: rand(0, 100),
          size: rand(16, 32),
          dur: rand(4, 8),
          delay: rand(0, 2.5),
          dx: rand(-12, 12),
          rot: rand(180, 720),
        }))
      : []

    // Sparkles burst outward from the result area, tinted in the rarity colour.
    const colors = [meta.color, '#ffd700', '#ffffff']
    const sparkles = meta.sparkle && !reduced
      ? Array.from({ length: 26 }, (_, i) => {
          const angle = rand(0, Math.PI * 2)
          const dist = rand(80, 320)
          return {
            dx: Math.cos(angle) * dist,
            dy: Math.sin(angle) * dist,
            dur: rand(0.8, 1.5),
            delay: rand(0, 0.25),
            color: colors[i % colors.length],
            size: rand(8, 16),
          }
        })
      : []

    return { rain, sparkles }
  })
</script>

{#if rain.length || sparkles.length}
  <div class="fx" aria-hidden="true">
    {#each rain as p}
      <span
        class="drop"
        style="left: {p.x}vw; font-size: {p.size}px; --dx: {p.dx}vw; --rot: {p.rot}deg; animation-duration: {p.dur}s; animation-delay: {p.delay}s;"
        >{item.glyph}</span
      >
    {/each}
    {#each sparkles as s}
      <span
        class="sparkle"
        style="--dx: {s.dx}px; --dy: {s.dy}px; color: {s.color}; font-size: {s.size}px; animation-duration: {s.dur}s; animation-delay: {s.delay}s;"
        >✦</span
      >
    {/each}
  </div>
{/if}

<style>
  .fx {
    position: fixed;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
    z-index: 1000;
  }

  .drop {
    position: absolute;
    top: -8vh;
    line-height: 1;
    opacity: 0;
    animation-name: fall;
    animation-timing-function: linear;
    animation-fill-mode: forwards;
    will-change: transform;
  }
  @keyframes fall {
    0% {
      transform: translate3d(0, -10vh, 0) rotate(0deg);
      opacity: 0;
    }
    8% {
      opacity: 0.95;
    }
    100% {
      transform: translate3d(var(--dx), 112vh, 0) rotate(var(--rot));
      opacity: 0.95;
    }
  }

  .sparkle {
    position: fixed;
    left: 50%;
    top: 40%;
    line-height: 1;
    opacity: 0;
    text-shadow: 0 0 8px currentColor;
    animation-name: burst;
    animation-timing-function: cubic-bezier(0.2, 0.7, 0.3, 1);
    animation-fill-mode: forwards;
    will-change: transform, opacity;
  }
  @keyframes burst {
    0% {
      transform: translate(-50%, -50%) scale(0.3);
      opacity: 0;
    }
    20% {
      opacity: 1;
    }
    100% {
      transform: translate(-50%, -50%) translate(var(--dx), var(--dy)) scale(1);
      opacity: 0;
    }
  }
</style>
