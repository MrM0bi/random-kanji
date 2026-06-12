import { theme } from './stores'

/** Apply the theme class to <html> and keep it in sync with the store. */
export function initTheme(): void {
  theme.subscribe((t) => {
    document.documentElement.classList.toggle('dark', t === 'dark')
  })
}

export function toggleTheme(): void {
  theme.update((t) => (t === 'dark' ? 'light' : 'dark'))
}
