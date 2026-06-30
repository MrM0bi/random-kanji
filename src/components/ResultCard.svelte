<script lang="ts">
  import { fade, fly } from 'svelte/transition'
  import type { KanjiEntry } from '../lib/types'
  import {
    meaningText,
    primitivesText,
    versionOf,
    jlptLabel,
    jishoUrl,
  } from '../lib/display'

  interface Props {
    entry: KanjiEntry
    mode: 'kanji' | 'meaning'
    lang: string
    revealed?: boolean
  }

  let { entry, mode, lang, revealed = $bindable(false) }: Props = $props()

  const meanings = $derived(meaningText(entry, lang))
  const primitives = $derived(primitivesText(entry, lang))
  const hasPrimitives = $derived(versionOf(entry, lang).primitives.length > 0)
</script>

<div class="result card">
  <!-- The prompt: the side the learner is quizzed on. The kanji is always shown
       large and the meaning at a consistent size, regardless of mode. -->
  {#if mode === 'kanji'}
    <div class="glyph cjk">{entry.kanji}</div>
  {:else}
    <div class="meaning">{meanings || '—'}</div>
  {/if}

  {#if !revealed}
    <button
      class="btn btn-accent reveal"
      title="Auflösen (Leertaste, A order R)"
      onclick={() => (revealed = true)}
    >
      Auflösen
    </button>
  {:else}
    <div class="answer" in:fly={{ y: 12, duration: 260 }}>
      {#if mode === 'kanji'}
        <div class="meaning">{meanings || '—'}</div>
      {:else}
        <div class="glyph cjk">{entry.kanji}</div>
      {/if}

      {#if hasPrimitives}
        <div class="primitives">
          <span class="label">Primitive</span>
          <span class="primitives-text">{primitives}</span>
        </div>
      {/if}

      <div class="meta" in:fade={{ duration: 300, delay: 80 }}>
        <span class="chip">ID {entry.id}</span>
        <span class="chip">JLPT {jlptLabel(entry.jlpt)}</span>
        <span class="chip">{entry.strokes} Striche</span>
      </div>

      <a
        class="btn jisho"
        href={jishoUrl(entry.kanji)}
        target="_blank"
        rel="noopener noreferrer"
      >
        Auf Jisho ansehen
        <svg
          viewBox="0 0 24 24"
          width="15"
          height="15"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M14 4h6v6" />
          <path d="M20 4l-9 9" />
          <path d="M19 14v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
        </svg>
      </a>
    </div>
  {/if}
</div>

<style>
  .result {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 1.75rem 1.5rem;
    text-align: center;
  }
  /* The kanji is always rendered large and clearly visible. */
  .glyph {
    font-size: 6.5rem;
    line-height: 1;
    font-weight: 500;
  }
  /* The meaning keeps a consistent, readable size in both modes. */
  .meaning {
    font-size: 1.8rem;
    font-weight: 700;
    letter-spacing: -0.01em;
  }
  .reveal {
    font-size: 1rem;
    padding: 0.65rem 1.6rem;
  }
  .answer {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.9rem;
    width: 100%;
  }
  .primitives {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .primitives-text {
    font-size: 1.05rem;
    color: var(--text);
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem;
  }
  .chip {
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 0.3rem 0.75rem;
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }
  .jisho {
    margin-top: 0.25rem;
    font-size: 0.9rem;
    padding: 0.5rem 1rem;
    text-decoration: none;
  }
  .jisho svg {
    margin-left: 0.1rem;
  }
</style>
