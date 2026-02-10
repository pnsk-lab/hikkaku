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

export default defineConfig({
  title: 'Hikkaku',
  description: 'Write Scratch projects in TypeScript',
  lang: 'en-US',
  base: '/hikkaku/',
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
  },
})
