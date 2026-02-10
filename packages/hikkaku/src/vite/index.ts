import { mkdir, rm, writeFile } from 'node:fs/promises'
import * as path from 'node:path'
import { pathToFileURL } from 'node:url'
import { zip } from 'fflate'
import { createServerModuleRunner, type PluginOption } from 'vite'
import type { ModuleRunner } from 'vite/module-runner'
import type { Project } from '../core'

const BASE_URL = 'https://scratchfoundation.github.io/scratch-gui/'

export interface HikkakuViteInit {
  entry: string
}
export default function hikkaku(init: HikkakuViteInit): PluginOption {
  let runner: ModuleRunner | null = null

  return {
    name: 'vite-plugin-hikkaku',
    config() {
      return {
        environments: {
          hikkaku: {
            build: {
              rolldownOptions: {
                input: init.entry,
                output: {
                  entryFileNames: 'project.mjs',
                  format: 'es',
                },
              },
            },
          },
          client: {},
        },
        builder: {
          async buildApp(builder) {
            const env = builder.environments.hikkaku
            if (!env) {
              throw new Error('Hikkaku environment is not configured.')
            }
            await builder.build(env)
          },
        },
      }
    },
    async generateBundle(_options, bundle) {
      const tmpDir = path.join(process.cwd(), 'dist', '.tmp')
      for (const [filePath, file] of Object.entries(bundle)) {
        if (file.type === 'chunk') {
          const fullPath = path.join(tmpDir, filePath)
          await mkdir(path.dirname(fullPath), { recursive: true })
          await writeFile(fullPath, file.code)
        }
      }

      const filePath = path.join(process.cwd(), 'dist/.tmp', 'project.mjs')
      const fileURL = pathToFileURL(filePath)
      const { default: project } = await import(fileURL.href)
      const projectJSON = project.toScratch()
      const zipData = await new Promise<Uint8Array>((resolve, reject) => {
        zip(
          {
            'project.json': new TextEncoder().encode(
              JSON.stringify(projectJSON),
            ),
          },
          (err, data) => {
            if (err) {
              reject(err)
            } else {
              resolve(data)
            }
          },
        )
      })
      this.emitFile({
        type: 'asset',
        fileName: 'project.sb3',
        name: 'project.sb3',
        source: zipData,
      })
      this.emitFile({
        type: 'asset',
        fileName: 'project.json',
        name: 'project.json',
        source: JSON.stringify(projectJSON, null, 2),
      })

      await rm(tmpDir, { recursive: true, force: true })
    },
    resolveId(source) {
      if (source === '/@virtual/hikkaku-client') {
        return source
      }
    },
    load(id) {
      if (id === '/@virtual/hikkaku-client') {
        return `
          import 'hikkaku/client'
        `
      }
    },
    async hotUpdate(options) {
      if (this.environment.name !== 'hikkaku') return
      if (!runner) {
        throw new Error('Module runner is not initialized.')
      }
      const project: Project = (await runner.import(options.file)).default
      options.server.environments.client.hot.send(
        'hikkaku:project',
        project.toScratch(),
      )
    },
    async configureServer(server) {
      const hikkakuEnv = server.environments.hikkaku
      if (!hikkakuEnv) {
        throw new Error('Hikkaku environment is not configured.')
      }
      await hikkakuEnv.transformRequest(init.entry)
      //server.watcher.add(init.entry)
      runner = createServerModuleRunner(hikkakuEnv)
      server.environments.client.hot.on('vite:client:connect', async () => {
        if (!runner) {
          throw new Error('Module runner is not initialized.')
        }
        const project: Project = (await runner.import(init.entry)).default
        server.environments.client.hot.send(
          'hikkaku:project',
          project.toScratch(),
        )
      })

      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/') {
          const html = (await fetch(BASE_URL).then((res) => res.text()))
            .replace(
              'gui.js',
              'https://scratchfoundation.github.io/scratch-gui/gui.js',
            )
            .replace(
              '</head>',
              '<script src="/@vite/client" type="module"></script><script type="module" src="/@virtual/hikkaku-client"></script></head>',
            )
          res.setHeader('Content-Type', 'text/html')
          res.end(html)
          return
        }
        if (
          req.url?.startsWith('/static/') ||
          req.url?.startsWith('/js/') ||
          req.url?.startsWith('/css/') ||
          req.url?.startsWith('/svgs') ||
          req.url?.startsWith('/images/') ||
          req.url?.startsWith('/session/') ||
          req.url === '/common.css' ||
          req.url === '/projects.css'
        ) {
          const url = new URL(req.url.slice(1), BASE_URL)
          const response = await fetch(url.toString())
          if (!response.ok) {
            res.statusCode = response.status
            res.end(`Error fetching ${url}: ${response.statusText}`)
            return
          }
          res.setHeader(
            'Content-Type',
            response.headers.get('content-type') || 'application/octet-stream',
          )
          res.end(new Uint8Array(await response.arrayBuffer()))
          return
        }
        next()
      })
    },
  }
}
