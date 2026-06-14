import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'
import { loadConfig } from './lib/config'

// Load the runtime config (spinner/speeds/loot) before mounting so every
// component sees real values immediately. Falls back to built-in defaults.
async function start() {
  await loadConfig()
  mount(App, {
    target: document.getElementById('app')!,
  })
}

start()
