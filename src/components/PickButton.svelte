<script lang="ts">
  interface Props {
    disabled?: boolean
    spinning?: boolean
    empty?: boolean
    emptyText?: string
    onpick: () => void
  }

  let { disabled = false, spinning = false, empty = false, emptyText = '', onpick }: Props =
    $props()
</script>

<div class="pick-wrap">
  <button class="btn btn-accent pick" {disabled} onclick={onpick}>
    {#if empty}
      {emptyText}
    {:else if spinning}
      Dreht …
    {:else}
      🎲 Spin
    {/if}
  </button>
</div>

<style>
  .pick-wrap {
    display: flex;
    justify-content: center;
  }
  .pick {
    font-size: 1.15rem;
    font-weight: 700;
    padding: 0.9rem 2.4rem;
    border-radius: 1rem;
    box-shadow: 0 10px 24px -10px var(--accent);
  }
  .pick:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: none;
  }
</style>
