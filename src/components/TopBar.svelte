<script lang="ts">
  import { sourceId, lang, theme, deckStats } from '../lib/stores'
  import { SOURCES } from '../lib/sources'
  import { langLabel } from '../lib/display'
  import { toggleTheme } from '../lib/theme'

  const languages = $derived($deckStats?.languages ?? [])
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

    <button
      class="btn theme-toggle"
      onclick={toggleTheme}
      title="Theme wechseln"
      aria-label="Theme wechseln"
    >
      {#if $theme === 'dark'}☀️{:else}🌙{/if}
    </button>
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
  .theme-toggle {
    font-size: 1.05rem;
    padding: 0.5rem 0.7rem;
    align-self: flex-end;
  }
</style>
