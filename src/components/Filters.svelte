<script lang="ts">
  import { deckStats, filters, rawFilters, poolCount, resetFilters } from '../lib/stores'
  import RangeSlider from './RangeSlider.svelte'
  import JlptSelector from './JlptSelector.svelte'

  function setIdRange(from: number, to: number): void {
    rawFilters.update((r) => ({ ...r, idFrom: from, idTo: to }))
  }
  function setStrokeRange(from: number, to: number): void {
    rawFilters.update((r) => ({ ...r, strokeMin: from, strokeMax: to }))
  }
</script>

<section class="card filters">
  <div class="filters-head">
    <h2>Filter</h2>
    <div class="head-right">
      <span class="pool-count" class:empty={$poolCount === 0}>
        {$poolCount} im Pool
      </span>
      <button class="btn reset" onclick={resetFilters}>Zurücksetzen</button>
    </div>
  </div>

  {#if $deckStats && $filters}
    <div class="filter-grid">
      <RangeSlider
        label="Heisig-ID"
        min={$deckStats.idMin}
        max={$deckStats.idMax}
        from={$filters.idFrom}
        to={$filters.idTo}
        onchange={setIdRange}
      />
      <RangeSlider
        label="Striche"
        min={$deckStats.strokeMin}
        max={$deckStats.strokeMax}
        from={$filters.strokeMin}
        to={$filters.strokeMax}
        onchange={setStrokeRange}
      />
      <JlptSelector />
    </div>
  {:else}
    <p class="loading">Filter werden geladen …</p>
  {/if}
</section>

<style>
  .filters {
    padding: 1.25rem 1.4rem;
  }
  .filters-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.1rem;
  }
  h2 {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 700;
  }
  .head-right {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .pool-count {
    font-size: 0.85rem;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }
  .pool-count.empty {
    color: var(--accent);
    font-weight: 600;
  }
  .reset {
    font-size: 0.82rem;
    padding: 0.35rem 0.7rem;
  }
  .filter-grid {
    display: grid;
    gap: 1.5rem;
  }
  .loading {
    color: var(--muted);
    margin: 0;
  }
</style>
