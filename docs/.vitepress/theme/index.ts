import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import Playground from '../components/Playground.vue'

const theme: Theme = {
  ...DefaultTheme,
  enhanceApp({ app }) {
    DefaultTheme.enhanceApp?.({ app })
    app.component('Playground', Playground)
  },
}

export default theme
