import type { Theme } from 'vitepress'
import { inBrowser } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { defineAsyncComponent, defineComponent, h } from 'vue'
import '@shikijs/vitepress-twoslash/style.css'
import './tailwind.css'
import TwoslashFloatingVue from '@shikijs/vitepress-twoslash/client'

const PlaygroundAsync = defineAsyncComponent({
  loader: () => import('../components/Playground.vue'),
  delay: 0,
  suspensible: false,
})

const ShowcaseGridAsync = defineAsyncComponent({
  loader: () => import('../components/ShowcaseGrid/ShowcaseGrid.vue'),
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

const ShowcaseGridClientOnly = defineComponent({
  name: 'ShowcaseGridClientOnly',
  setup(_, { attrs, slots }) {
    return () => {
      if (!inBrowser) return null
      return h(ShowcaseGridAsync, attrs, slots)
    }
  },
})

const theme: Theme = {
  ...DefaultTheme,
  enhanceApp(context) {
    DefaultTheme.enhanceApp?.(context)
    context.app.component('Playground', PlaygroundClientOnly)
    context.app.component('ShowcaseGrid', ShowcaseGridClientOnly)
    context.app.use(TwoslashFloatingVue)
  },
}

export default theme
