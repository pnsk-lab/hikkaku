/// <reference types="vitepress" />
/// <reference types="vite/client" />

import { createTwoslashWithInlineCache } from '@shikijs/vitepress-twoslash/cache-inline'
import { defineConfig } from 'vitepress'

const guideSidebar = [
  {
    text: 'Guide',
    items: [
      { text: 'Overview', link: '/guides/' },
      { text: 'Getting Started', link: '/guides/getting-started' },
      { text: 'Project Basics', link: '/guides/usage' },
      { text: 'Calculations', link: '/guides/calculate' },
      { text: 'Variables and Lists', link: '/guides/variable' },
      { text: 'Custom Blocks', link: '/guides/custom-blocks' },
    ],
  },
]

const blocksSidebar = [
  {
    text: 'Block API',
    items: [
      { text: 'Overview', link: '/reference/blocks/overview' },
      { text: 'Control', link: '/reference/blocks/control' },
      { text: 'Data', link: '/reference/blocks/data' },
      { text: 'Events', link: '/reference/blocks/events' },
      { text: 'Looks', link: '/reference/blocks/looks' },
      { text: 'Motion', link: '/reference/blocks/motion' },
      { text: 'Operators', link: '/reference/blocks/operator' },
      { text: 'Pen', link: '/reference/blocks/pen' },
      { text: 'Procedures', link: '/reference/blocks/procedures' },
      { text: 'Sensing', link: '/reference/blocks/sensing' },
      { text: 'Sound', link: '/reference/blocks/sound' },
    ],
  },
]

const withTwoslashInlineCache = createTwoslashWithInlineCache({})

const BASE = '/hikkaku/'
const DOMAIN = 'https://pnsk-lab.github.io'

export default withTwoslashInlineCache(
  defineConfig({
    title: 'Hikkaku',
    description: 'Write Scratch projects in TypeScript',
    lang: 'en-US',
    base: BASE,
    head: [
      [
        'link',
        {
          rel: 'icon',
          type: 'image/svg+xml',
          href: `${BASE}assets/logo.svg`,
        },
      ],
      ['meta', { property: 'og:type', content: 'website' }],
      ['meta', { property: 'og:title', content: 'Hikkaku' }],
      [
        'meta',
        {
          property: 'og:description',
          content: 'Write Scratch projects in TypeScript',
        },
      ],
      ['meta', { property: 'og:url', content: `${DOMAIN}${BASE}` }],
      [
        'meta',
        {
          property: 'og:image',
          content: `${DOMAIN}${BASE}assets/logo.svg`,
        },
      ],
      ['meta', { name: 'twitter:card', content: 'summary' }],
      ['meta', { name: 'twitter:title', content: 'Hikkaku' }],
      [
        'meta',
        {
          name: 'twitter:description',
          content: 'Write Scratch projects in TypeScript',
        },
      ],
      [
        'meta',
        {
          name: 'twitter:image',
          content: `${DOMAIN}${BASE}assets/logo.svg`,
        },
      ],
    ],
    markdown: {
      codeTransformers: [],
    },
    themeConfig: {
      nav: [
        { text: 'Guide', link: '/guides/' },
        { text: 'Reference', link: '/reference/' },
        { text: 'Playground', link: '/playground' },
        { text: 'GitHub', link: 'https://github.com/pnsk-lab/hikkaku' },
      ],
      sidebar: {
        '/guides/': guideSidebar,
        '/reference/': [
          {
            text: 'Reference',
            items: [{ text: 'Overview', link: '/reference/' }],
          },
          ...blocksSidebar,
        ],
      },
      search: {
        provider: 'local',
      },
      logo: {
        src: '/assets/logo.svg',
        alt: 'Hikkaku Logo',
      },
    },
  }),
)
