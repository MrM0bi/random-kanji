<script lang="ts">
  import {
    faSun,
    faMoon,
    faPersonWalking,
    faCarSide,
    faRocket,
    faStar,
    faRepeat,
  } from '@fortawesome/free-solid-svg-icons'
  import {
    sourceId,
    lang,
    theme,
    spinSpeed,
    deckStats,
    specialsOn,
    avoidRepeats,
  } from '../lib/stores'
  import { SOURCES } from '../lib/sources'
  import { config, type SpinSpeed } from '../lib/config'
  import { langLabel } from '../lib/display'
  import { toggleTheme } from '../lib/theme'
  import Icon from './Icon.svelte'

  const languages = $derived($deckStats?.languages ?? [])

  const SPEED_ORDER: SpinSpeed[] = ['normal', 'fast', 'instant']
  const speedIcons = {
    normal: faPersonWalking,
    fast: faCarSide,
    instant: faRocket,
  }

  function cycleSpeed(): void {
    const i = SPEED_ORDER.indexOf($spinSpeed)
    $spinSpeed = SPEED_ORDER[(i + 1) % SPEED_ORDER.length]
  }
</script>

<header class="topbar">
  <div class="brand">
    <span class="logo" aria-hidden="true">🏮</span>
    <h1>Random Kanji</h1>
  </div>

  <div class="controls">
    <label class="ctrl">
      <span class="ctrl-label">Deck</span>
      <select class="select" bind:value={$sourceId}>
        {#each SOURCES as src (src.id)}
          <option value={src.id}>{src.label}</option>
        {/each}
      </select>
    </label>

    <label class="ctrl">
      <span class="ctrl-label">Sprache</span>
      <select class="select" bind:value={$lang} disabled={languages.length <= 1}>
        {#each languages as code (code)}
          <option value={code}>{langLabel(code)}</option>
        {/each}
        {#if languages.length === 0}
          <option value={$lang}>{langLabel($lang)}</option>
        {/if}
      </select>
    </label>

    <div class="ctrl">
      <span class="ctrl-label">Tempo</span>
      <button
        class="btn icon-btn"
        onclick={cycleSpeed}
        title="Tempo: {$config.spinSpeeds[$spinSpeed].label}"
        aria-label="Tempo: {$config.spinSpeeds[$spinSpeed].label} (wechseln)"
      >
        <Icon icon={speedIcons[$spinSpeed]} />
      </button>
    </div>

    <div class="ctrl">
      <span class="ctrl-label">Specials</span>
      <button
        class="btn icon-btn"
        class:off={!$specialsOn}
        onclick={() => ($specialsOn = !$specialsOn)}
        title={$specialsOn ? 'Specials aktiv' : 'Specials deaktiviert'}
        aria-label="Specials ein-/ausschalten"
        aria-pressed={$specialsOn}
      >
        <Icon icon={faStar} />
      </button>
    </div>

    <div class="ctrl">
      <span class="ctrl-label">WDH.</span>
      <button
        class="btn icon-btn"
        class:off={$avoidRepeats}
        onclick={() => ($avoidRepeats = !$avoidRepeats)}
        title={$avoidRepeats ? 'Wiederholung aus – jede Karte 1×' : 'Wiederholung erlaubt'}
        aria-label="Wiederholung ein-/ausschalten"
        aria-pressed={!$avoidRepeats}
      >
        <Icon icon={faRepeat} />
      </button>
    </div>

    <div class="ctrl">
      <span class="ctrl-label">Theme</span>
      <button
        class="btn icon-btn"
        onclick={toggleTheme}
        title={$theme === 'dark' ? 'Dunkles Theme' : 'Helles Theme'}
        aria-label="Theme wechseln"
      >
        <Icon icon={$theme === 'dark' ? faMoon : faSun} />
      </button>
    </div>
  </div>
</header>

<style>
  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }
  .logo {
    font-size: 1.6rem;
    line-height: 1;
  }
  h1 {
    font-size: 1.35rem;
    font-weight: 700;
    margin: 0;
    letter-spacing: -0.01em;
  }
  .controls {
    display: flex;
    align-items: flex-end;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
  .ctrl {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }
  .ctrl-label {
    font-size: 0.68rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--muted);
    padding-left: 0.15rem;
  }
  .icon-btn {
    height: 2.375rem; /* match the Deck/Sprache select height (38px) */
    padding: 0 0.8rem;
    font-size: 1.05rem;
    color: var(--accent);
  }
  .icon-btn.off {
    color: var(--muted);
    opacity: 0.6;
  }

  /* Compact the header on phones; the desktop layout above is unchanged. */
  @media (max-width: 560px) {
    .topbar {
      gap: 0.5rem 0.75rem;
    }
    .logo {
      font-size: 1.25rem;
    }
    h1 {
      font-size: 1.05rem;
    }
    .controls {
      gap: 0.4rem 0.6rem;
    }
    .ctrl {
      gap: 0.1rem;
    }
    .ctrl-label {
      font-size: 0.6rem;
    }
    .select {
      padding: 0.35rem 1.7rem 0.35rem 0.55rem;
      font-size: 0.82rem;
    }
    .icon-btn {
      height: 2rem;
      padding: 0 0.55rem;
      font-size: 0.95rem;
    }
  }
</style>
