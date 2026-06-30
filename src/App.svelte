<script lang="ts">
  import { onMount } from 'svelte'
  import { fade } from 'svelte/transition'
  import {
    sourceId,
    lang,
    mode,
    entries,
    deckStats,
    filters,
    filtered,
    availableCount,
    loadState,
    loadError,
    currentPick,
    lastPickId,
    resetFilters,
    specialsOn,
    avoidRepeats,
    seenIds,
  } from './lib/stores'
  import { spinSpeed } from './lib/stores'
  import { sourceById } from './lib/sources'
  import { loadDeck, computeStats } from './lib/data'
  import { pickRandom } from './lib/filters'
  import { maybePickSpecial, pickDescription } from './lib/specials'
  import { config } from './lib/config'
  import { initTheme } from './lib/theme'

  import TopBar from './components/TopBar.svelte'
  import ModeToggle from './components/ModeToggle.svelte'
  import Filters from './components/Filters.svelte'
  import SpinnerReel from './components/SpinnerReel.svelte'
  import ResultCard from './components/ResultCard.svelte'
  import SpecialCard from './components/SpecialCard.svelte'
  import SpecialEffects from './components/SpecialEffects.svelte'
  import PickButton from './components/PickButton.svelte'

  type Phase = 'idle' | 'spinning' | 'result'

  let phase = $state<Phase>('idle')
  let revealed = $state(false)
  let reel = $state<SpinnerReel | null>(null)
  let firstLoad = true

  async function loadDeckFor(id: string): Promise<void> {
    const src = sourceById(id)
    loadState.set('loading')
    loadError.set('')
    try {
      const deck = await loadDeck(src.url)
      entries.set(deck.kanji)
      const stats = computeStats(deck)
      deckStats.set(stats)
      // Default language to the deck's first available if current is missing.
      if (!stats.languages.includes($lang) && stats.languages.length > 0) {
        lang.set(stats.languages[0])
      }
      // Switching to a different deck resets ranges; first load keeps persisted.
      if (!firstLoad) resetFilters()
      firstLoad = false
      currentPick.set(null)
      phase = 'idle'
      loadState.set('ready')
    } catch (e) {
      loadError.set(e instanceof Error ? e.message : String(e))
      loadState.set('error')
    }
  }

  onMount(() => {
    initTheme()
  })

  $effect(() => {
    const id = $sourceId
    loadDeckFor(id)
  })

  function doPick(): void {
    const pool = $filtered
    if (!$filters || pool.length === 0) return

    // Roll for a rare special "loot drop" first; otherwise a normal kanji.
    const special = $specialsOn ? maybePickSpecial() : null
    let pick: import('./lib/stores').Pick
    if (special) {
      pick = { kind: 'special', item: special, description: pickDescription(special) }
    } else {
      const entry = pickRandom(pool, $lastPickId, $avoidRepeats ? $seenIds : undefined)
      if (!entry) return
      lastPickId.set(entry.id)
      if ($avoidRepeats) seenIds.update((s) => new Set(s).add(entry.id))
      pick = { kind: 'kanji', entry }
    }

    currentPick.set(pick)
    revealed = false
    phase = 'spinning'
    reel?.spin(pick, pool)
  }

  function onSettled(): void {
    phase = 'result'
  }

  // A kanji result that hasn't been revealed yet (specials have no reveal step).
  const canReveal = $derived(
    phase === 'result' && $currentPick?.kind === 'kanji' && !revealed,
  )

  function spinIfPossible(): void {
    if (phase !== 'spinning' && $availableCount > 0) doPick()
  }

  function onKey(e: KeyboardEvent): void {
    // Ignore keys typed into form controls (deck/lang selects, slider inputs).
    const tag = (e.target as HTMLElement)?.tagName
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return

    if (e.code === 'Space') {
      e.preventDefault() // stop page scroll
      if (canReveal) revealed = true
      else spinIfPossible()
    } else if (e.key === 's' || e.key === 'S') {
      e.preventDefault()
      spinIfPossible() // always spins, regardless of reveal state
    } else if (e.key === 'a' || e.key === 'r' || e.key === 'A' || e.key === 'R') {
      if (canReveal) {
        e.preventDefault()
        revealed = true
      }
    }
  }
</script>

<svelte:window onkeydown={onKey} />

<div class="page">
  <div class="shell">
    <TopBar />

    {#if $loadState === 'loading'}
      <div class="state card" in:fade>
        <div class="spinner" aria-hidden="true"></div>
        <p>Deck wird geladen …</p>
      </div>
    {:else if $loadState === 'error'}
      <div class="state card" in:fade>
        <p class="err">Deck konnte nicht geladen werden.</p>
        <p class="err-detail">{$loadError}</p>
        <button class="btn btn-accent" onclick={() => loadDeckFor($sourceId)}>
          Erneut versuchen
        </button>
      </div>
    {:else}
      <main class="main">
        <div class="stage-controls">
          <ModeToggle />
        </div>

        <section class="card stage">
          <PickButton
            spinning={phase === 'spinning'}
            disabled={$availableCount === 0 || phase === 'spinning'}
            empty={$availableCount === 0}
            emptyText="Pool leer"
            onpick={doPick}
          />

          <SpinnerReel
            bind:this={reel}
            pool={$filtered}
            mode={$mode}
            lang={$lang}
            durationMs={$config.spinSpeeds[$spinSpeed].durationMs}
            onsettled={onSettled}
          />

          <div class="stage-body">
            {#if phase === 'result' && $currentPick}
              {#if $currentPick.kind === 'special'}
                {#key $currentPick.item.id}
                  <SpecialCard
                    item={$currentPick.item}
                    description={$currentPick.description}
                  />
                  <SpecialEffects item={$currentPick.item} />
                {/key}
              {:else}
                {#key $currentPick.entry.id + $mode}
                  <div in:fade={{ duration: 220 }}>
                    <ResultCard
                      entry={$currentPick.entry}
                      mode={$mode}
                      lang={$lang}
                      bind:revealed
                    />
                  </div>
                {/key}
              {/if}
            {:else if $availableCount === 0}
              <p class="hint warn">
                Pool leer – erweitere die Filter{#if $avoidRepeats} oder erlaube Wiederholungen{/if}.
              </p>
            {:else}
              <p class="hint">
                {#if $mode === 'kanji'}
                  Drücke <strong>Spin</strong>, um ein zufälliges Kanji zu ziehen.
                {:else}
                  Drücke <strong>Spin</strong>, um eine zufällige Bedeutung zu ziehen.
                {/if}
              </p>
            {/if}
          </div>
        </section>

        <Filters />
      </main>
    {/if}

    <footer class="footer">
      <span>🏮 Random Kanji · MrMobi</span>
    </footer>
  </div>
</div>

<style>
  .page {
    min-height: 100%;
    padding: 1.5rem 1rem 3rem;
  }
  .shell {
    max-width: 760px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  .main {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  .stage-controls {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.75rem;
  }
  .stage {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1.5rem;
    align-items: stretch;
  }
  .stage-body {
    min-height: 9rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .hint {
    color: var(--muted);
    text-align: center;
    margin: 0;
    font-size: 1.05rem;
  }
  .hint.warn {
    color: var(--accent);
    font-weight: 600;
  }

  .state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 3rem 1.5rem;
    text-align: center;
  }
  .err {
    font-weight: 700;
    margin: 0;
  }
  .err-detail {
    color: var(--muted);
    margin: 0;
    font-size: 0.9rem;
  }
  .spinner {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 3px solid var(--surface-2);
    border-top-color: var(--accent);
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .footer {
    text-align: center;
    color: var(--muted);
    font-size: 0.82rem;
  }

  /* Tighten vertical rhythm on phones so the header/stage take less space. */
  @media (max-width: 560px) {
    .page {
      padding: 1rem 0.75rem 2rem;
    }
    .shell {
      gap: 1rem;
    }
    .main {
      gap: 1rem;
    }
    .stage {
      gap: 1rem;
      padding: 1rem;
    }
  }
</style>
