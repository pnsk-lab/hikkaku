import type { Theme } from 'vitepress'
import { inBrowser } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { defineAsyncComponent, defineComponent, h } from 'vue'

const PlaygroundAsync = defineAsyncComponent({
  loader: () => import('../components/Playground.vue'),
  delay: 0,
  suspensible: false,
})

const PlaygroundClientOnly = defineComponent({
  name: 'PlaygroundClientOnly',
  setup(_, { attrs, slots }) {
    return () => {
      if (!inBrowser) return null
      return h(PlaygroundAsync, attrs, slots)
    }
  },
})

const theme: Theme = {
  ...DefaultTheme,
  enhanceApp(context) {
    DefaultTheme.enhanceApp?.(context)
    context.app.component('Playground', PlaygroundClientOnly)
  },
}

export default theme
