<script lang="ts">
  import { deckStats, rawFilters, filters } from '../lib/stores'
  import { JLPT_ORDER, jlptLabel } from '../lib/display'

  // Only levels actually present in the deck, in display order.
  const levels = $derived(
    JLPT_ORDER.filter((l) => ($deckStats?.jlptCounts[l] ?? 0) > 0),
  )

  const selected = $derived($filters?.jlptLevels ?? new Set<string>())

  function toggle(level: string): void {
    const next = new Set(selected)
    if (next.has(level)) next.delete(level)
    else next.add(level)
    rawFilters.update((r) => ({ ...r, jlptLevels: [...next] }))
  }
</script>

<div class="jlpt">
  <span class="label">JLPT</span>
  <div class="bar" role="group" aria-label="JLPT-Level">
    {#each levels as level (level)}
      <button
        class="chip"
        class:active={selected.has(level)}
        aria-pressed={selected.has(level)}
        onclick={() => toggle(level)}
      >
        <span class="lvl">
          {#if level === '0'}
            <svg
              class="icon"
              viewBox="0 0 24 24"
              width="17"
              height="17"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              role="img"
              aria-label="Ohne JLPT-Level"
            >
              <title>Ohne JLPT-Level</title>
              <circle cx="12" cy="12" r="9" />
              <line x1="5.6" y1="5.6" x2="18.4" y2="18.4" />
            </svg>
          {:else}
            {jlptLabel(level)}
          {/if}
        </span>
        <span class="count">{$deckStats?.jlptCounts[level] ?? 0}</span>
      </button>
    {/each}
  </div>
</div>

<style>
  .jlpt {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }
  .bar {
    display: inline-flex;
    flex-wrap: wrap;
    border: 1px solid var(--border);
    border-radius: 0.75rem;
    overflow: hidden;
    width: fit-content;
    max-width: 100%;
  }
  .chip {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    border: none;
    border-right: 1px solid var(--border);
    background: var(--surface);
    color: var(--muted);
    padding: 0.5rem 0.85rem;
    cursor: pointer;
    font-weight: 600;
    transition: background-color 0.18s ease, color 0.18s ease;
  }
  .chip:last-child {
    border-right: none;
  }
  .chip:hover {
    background: var(--surface-2);
    color: var(--text);
  }
  .chip.active {
    background: var(--accent);
    color: #fff;
  }
  .chip:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
  }
  .lvl {
    font-size: 0.95rem;
    display: inline-flex;
    align-items: center;
  }
  .icon {
    display: block;
  }
  .count {
    font-size: 0.72rem;
    opacity: 0.75;
    font-variant-numeric: tabular-nums;
  }
</style>
