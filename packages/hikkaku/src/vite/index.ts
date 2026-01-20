import { createServerModuleRunner, type DevEnvironment, type PluginOption } from 'vite'
import { createHikkakuEnvironment } from './env'
import type * as sb3 from '@pnsk-lab/sb3-types'

const BASE_URL = 'https://scratchfoundation.github.io/scratch-gui/'

export interface HikkakuViteInit {
  entry: string
}
export default function hikkaku(init: HikkakuViteInit): PluginOption {
  return {
    name: 'vite-plugin-hikkaku',
    config(config, env) {
      return {
        environments: {
          hikkaku: {
          },
          client: {}
        }
      }
    },
    async configureServer(server) {
      const hikkakuEnv = server.environments.hikkaku
      if (!hikkakuEnv) {
        throw new Error('Hikkaku environment is not configured.')
      }
      const runner = createServerModuleRunner(hikkakuEnv)
      await runner.import(init.entry)
      hikkakuEnv.hot.on('hikkaku:project', (project: sb3.ScratchProject) => {
        server.environments.client.hot.send('hikkaku:project', project)
      })

      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/') {
          const html = (await fetch(BASE_URL).then(res => res.text()))
            .replace('gui.js', 'https://scratchfoundation.github.io/scratch-gui/gui.js')
            .replace(
              '</head>',
              '<script src="/@vite/client" type="module"></script><script type="module">import "hikkaku/client"</script></head>'
            )
          res.setHeader('Content-Type', 'text/html')
          res.end(html)
          return
        }
        if (req.url?.startsWith('/static/')) {
          const url = new URL(req.url.slice(1), BASE_URL)
          const response = await fetch(url.toString())
          if (!response.ok) {
            res.statusCode = response.status
            res.end(`Error fetching ${url}: ${response.statusText}`)
            return
          }
          res.setHeader('Content-Type', response.headers.get('content-type') || 'application/octet-stream')
          res.end(new Uint8Array(await response.arrayBuffer()))
          return
        }
        next()
      })
    }
  }
}
