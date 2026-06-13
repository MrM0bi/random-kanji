<script lang="ts">
  import { fly, fade } from 'svelte/transition'
  import type { SpecialItem } from '../lib/specials'
  import { RARITY_META } from '../lib/specials'

  interface Props {
    item: SpecialItem
  }

  let { item }: Props = $props()
  const meta = $derived(RARITY_META[item.rarity])
</script>

<div
  class="special card"
  style="--rarity: {meta.color}"
  in:fly={{ y: 14, duration: 280 }}
>
  <span class="badge" in:fade={{ duration: 300, delay: 60 }}>
    {meta.dot}
    {meta.label}
  </span>

  <div class="glyph" class:gold={item.gold} class:cjk={item.gold}>
    {item.glyph}
  </div>

  <div class="name">{item.name}</div>
  <p class="message">{item.message}</p>
</div>

<style>
  .special {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    padding: 1.75rem 1.5rem;
    text-align: center;
    border-color: color-mix(in srgb, var(--rarity) 55%, var(--border));
    box-shadow: 0 0 0 1px var(--rarity), 0 0 40px -10px var(--rarity);
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
  .message {
    margin: 0;
    color: var(--muted);
    font-size: 1.02rem;
    max-width: 28rem;
  }

  .gold {
    background: linear-gradient(100deg, #b8860b, #ffd700, #fff3b0, #ffd700, #b8860b);
    background-size: 220% 100%;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    animation: shimmer 2.2s linear infinite;
  }
  @keyframes shimmer {
    to {
      background-position: 220% 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .gold {
      animation: none;
    }
  }
</style>
