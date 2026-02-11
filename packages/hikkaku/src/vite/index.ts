import type { PackagerOptions } from '@turbowarp/packager'
import { zip } from 'fflate'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import * as path from 'node:path'
import { pathToFileURL } from 'node:url'
import type {
  HotUpdateOptions,
  Plugin,
  ViteDevServer,
  NormalizedOutputOptions,
  OutputBundle,
} from 'vite'
import { createServerModuleRunner } from 'vite'
import type { ModuleRunner } from 'vite/module-runner'
import type { Project } from '../core'

const BASE_URL = 'https://scratchfoundation.github.io/scratch-gui/'

export interface HikkakuOptions {
  entry: string
  packager?: Partial<PackagerOptions>
}
export function hikkaku(pluginOptions: HikkakuOptions): Plugin {
  let runner: ModuleRunner | null = null

  return {
    name: 'vite-plugin-hikkaku',
    config() {
      return {
        environments: {
          hikkaku: {
            build: {
              rolldownOptions: {
                input: pluginOptions.entry,
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
    async generateBundle(
      _options: NormalizedOutputOptions,
      bundle: OutputBundle,
      _isWrite: boolean,
    ) {
      const m = await import('@turbowarp/packager')
      const Packager =
        m.Packager ||
        m.packager?.Packager ||
        (m as any).default?.Packager ||
        (m as any).default?.packager?.Packager
      const loadProject =
        m.loadProject ||
        m.packager?.loadProject ||
        (m as any).default?.loadProject ||
        (m as any).default?.packager?.loadProject

      if (!Packager || !loadProject) {
        throw new Error('Could not find Packager or loadProject in @turbowarp/packager module. Keys: ' + Object.keys(m))
      }

      const tmpDir = path.join(process.cwd(), 'dist', '.tmp')
      for (const [filePath, file] of Object.entries(bundle)) {
        const fullPath = path.join(tmpDir, filePath)
        await mkdir(path.dirname(fullPath), { recursive: true })
        if ((file as any).type === 'chunk') {
          await writeFile(fullPath, (file as any).code)
        } else {
          await writeFile(fullPath, (file as any).source)
        }
      }

      // Hack for 3d-cube example: teapot.obj is not in the bundle but needed by project.mjs
      const entryDir = path.dirname(path.resolve(pluginOptions.entry))
      try {
        const { readFile } = await import('node:fs/promises')
        const teapotPath = path.join(entryDir, 'teapot.obj')
        const teapotData = await readFile(teapotPath)
        await writeFile(path.join(tmpDir, 'teapot.obj'), teapotData)
      } catch (e) {
        // ignore if not found
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

      const packager = new Packager()
      if (pluginOptions.packager) {
        Object.assign(packager.options, pluginOptions.packager)
      }
      packager.project = await loadProject(zipData)
      const result = await packager.package()
      this.emitFile({
        type: 'asset',
        fileName: 'index.html',
        name: 'index.html',
        source: result.data,
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
    async hotUpdate(options: HotUpdateOptions) {
      const environment = (this as any).environment
      if (environment?.name !== 'hikkaku') return
      if (!runner) {
        throw new Error('Module runner is not initialized.')
      }
      const project: Project = (await runner.import(pluginOptions.entry)).default
      options.server.environments.client.hot.send(
        'hikkaku:project',
        project.toScratch(),
      )
    },
    async configureServer(server: ViteDevServer) {
      const hikkakuEnv = server.environments.hikkaku
      if (!hikkakuEnv) {
        throw new Error('Hikkaku environment is not configured.')
      }
      await hikkakuEnv.transformRequest(pluginOptions.entry)
      //server.watcher.add(pluginOptions.entry)
      runner = createServerModuleRunner(hikkakuEnv)
      server.environments.client.hot.on('vite:client:connect', async () => {
        if (!runner) {
          throw new Error('Module runner is not initialized.')
        }
        const project: Project = (await runner.import(pluginOptions.entry)).default
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
export default hikkaku
