<script lang="ts">
  import { mode } from '../lib/stores'
</script>

<div class="seg" role="tablist" aria-label="Pick mode">
  <button
    class="seg-btn"
    class:active={$mode === 'kanji'}
    role="tab"
    aria-selected={$mode === 'kanji'}
    onclick={() => ($mode = 'kanji')}
  >
    Kanji
  </button>
  <button
    class="seg-btn"
    class:active={$mode === 'meaning'}
    role="tab"
    aria-selected={$mode === 'meaning'}
    onclick={() => ($mode = 'meaning')}
  >
    Bedeutung
  </button>
</div>

<style>
  .seg {
    display: inline-flex;
    padding: 0.25rem;
    gap: 0.25rem;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 0.85rem;
  }
  .seg-btn {
    border: none;
    background: transparent;
    color: var(--muted);
    font-size: 0.95rem;
    font-weight: 600;
    padding: 0.45rem 1.2rem;
    border-radius: 0.6rem;
    cursor: pointer;
    transition: background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
  }
  .seg-btn:hover {
    color: var(--text);
  }
  .seg-btn.active {
    background: var(--surface);
    color: var(--accent);
    box-shadow: var(--shadow);
  }
  .seg-btn:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
</style>
