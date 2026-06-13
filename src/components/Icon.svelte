<script lang="ts">
  import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'

  interface Props {
    icon: IconDefinition
    title?: string
  }

  let { icon, title }: Props = $props()

  // Derived so the SVG updates when the `icon` prop changes (e.g. theme/speed).
  const width = $derived(icon.icon[0])
  const height = $derived(icon.icon[1])
  const d = $derived.by(() => {
    const path = icon.icon[4]
    return Array.isArray(path) ? path[path.length - 1] : path
  })
</script>

<svg
  class="icon"
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 {width} {height}"
  fill="currentColor"
  role={title ? 'img' : undefined}
  aria-hidden={title ? undefined : 'true'}
  aria-label={title}
>
  {#if title}<title>{title}</title>{/if}
  <path d={d} />
</svg>

<style>
  .icon {
    width: 1em;
    height: 1em;
    display: block;
  }
</style>
