import { mkdir, rm, writeFile } from 'node:fs/promises'
import type { ServerResponse } from 'node:http'
import * as path from 'node:path'
import { pathToFileURL } from 'node:url'
import { zip } from 'fflate'
import { createServerModuleRunner, type Plugin, type PluginOption } from 'vite'
import type { ModuleRunner } from 'vite/module-runner'
import type { Project } from '../core'
import { pluginScratchImport } from './plugin-scratch-import.ts'

const BASE_URL = 'https://scratchfoundation.github.io/scratch-gui/'

const VIRTUAL_MODULE_IDS = {
  project: '/@virtual/hikkaku-project',
} as const

export interface HikkakuViteInit {
  entry: string
}
export default function hikkaku(init: HikkakuViteInit): PluginOption {
  let runner: ModuleRunner | null = null
  let additionalAssets = new Map<string, Uint8Array>()
  const assetCache = new Map<string, Uint8Array | false>()

  // Helper function to set Content-Type based on file extension
  const setContentType = (res: ServerResponse, assetId: string) => {
    const assetExt = path.extname(assetId).toLowerCase()
    if (assetExt === '.png') {
      res.setHeader('Content-Type', 'image/png')
    } else if (assetExt === '.jpg' || assetExt === '.jpeg') {
      res.setHeader('Content-Type', 'image/jpeg')
    } else if (assetExt === '.wav') {
      res.setHeader('Content-Type', 'audio/wav')
    } else if (assetExt === '.mp3') {
      res.setHeader('Content-Type', 'audio/mpeg')
    } else {
      res.setHeader('Content-Type', 'application/octet-stream')
    }
  }

  return [
    {
      name: 'vite-plugin-hikkaku',
      config(config, env) {
        if (env.command === 'build') {
          // Set the sb3Entry of vite-plugin-turbowarp-packager
          const pluginPackager = config.plugins?.find(
            (p) =>
              p &&
              typeof p === 'object' &&
              'name' in p &&
              p.name === 'vite-plugin-turbowarp-packager',
          ) as Plugin | undefined
          pluginPackager?.api.setEntry(
            path.join(process.cwd(), 'dist', 'project.sb3'),
          )
        }

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
          },
          builder: {},
        }
      },
      async buildApp(builder) {
        const env = builder.environments.hikkaku
        if (!env) {
          throw new Error('Hikkaku environment is not configured.')
        }
        await builder.build(env)
      },
      async generateBundle(_options, bundle) {
        if (this.environment.name !== 'hikkaku') return
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
        const { default: project } = (await import(fileURL.href)) as {
          default: Project
        }
        const projectJSON = project.toScratch()
        const assets = project.getAdditionalAssets()

        const zipData = await new Promise<Uint8Array>((resolve, reject) => {
          zip(
            {
              'project.json': new TextEncoder().encode(
                JSON.stringify(projectJSON),
              ),
              ...Object.fromEntries(assets.entries()),
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
        for (const [assetId, data] of assets.entries()) {
          this.emitFile({
            type: 'asset',
            fileName: `assets/${assetId}`,
            name: `assets/${assetId}`,
            source: data,
          })
        }

        await rm(tmpDir, { recursive: true, force: true })
      },
      resolveId(source) {
        if (source === '/@virtual/hikkaku-client') {
          return source
        }
        if (source === VIRTUAL_MODULE_IDS.project) {
          return source
        }
      },
      async load(id) {
        if (id === '/@virtual/hikkaku-client') {
          return `
          import 'hikkaku/client'
        `
        }
        if (id === VIRTUAL_MODULE_IDS.project) {
          if (this.environment.mode === 'dev') {
            // in dev mode, use entry file
            if (!runner) {
              throw new Error('Module runner is not initialized.')
            }
            const project: Project = (await runner.import(init.entry)).default

            return `
            export default ${JSON.stringify(project.toScratch())}
          `
          } else if (this.environment.mode === 'build') {
            // in build mode, use bundled project.json
            const projectJSONPath = path.join(
              process.cwd(),
              'dist',
              'project.json',
            )
            const projectJSON = await import(
              pathToFileURL(projectJSONPath).href,
              {
                with: { type: 'json' },
              }
            )
            return `
            export default ${JSON.stringify(projectJSON)}
          `
          }
        }
      },
      async hotUpdate(options) {
        if (this.environment.name !== 'hikkaku') return
        if (!runner) {
          throw new Error('Module runner is not initialized.')
        }
        const project: Project = (await runner.import(init.entry)).default
        additionalAssets = project.getAdditionalAssets()
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
          additionalAssets = project.getAdditionalAssets()
          server.environments.client.hot.send(
            'hikkaku:project',
            project.toScratch(),
          )
        })

        server.middlewares.use(async (req, res, next) => {
          // アセット配信用
          if (req.url?.startsWith('/hikkaku-assets/')) {
            const segments = req.url.split('/')
            const assetId = segments[segments.indexOf('hikkaku-assets') + 1]
            if (!assetId) {
              res.statusCode = 400
              res.end('Asset ID is required')
              return
            }
            const assetData = additionalAssets.get(assetId)
            if (!assetData) {
              // fallback to network fetch
              if (assetCache.has(assetId)) {
                const cached = assetCache.get(assetId)
                if (cached === false) {
                  res.statusCode = 404
                  res.end('Asset not found')
                  return
                }
                setContentType(res, assetId)
                res.end(cached)
                return
              }
              const assetData = await fetch(
                `https://assets.scratch.mit.edu/internalapi/asset/${assetId}/get/`,
              )
                .then((r) => {
                  if (!r.ok) {
                    return null
                  }
                  return r.arrayBuffer()
                })
                .catch((e) => {
                  console.warn('Failed to fetch asset from network:', e)
                  return null
                })
              if (assetData) {
                const uint8array = new Uint8Array(assetData)
                assetCache.set(assetId, uint8array)
                setContentType(res, assetId)
                res.end(uint8array)
                return
              }
              // not found
              assetCache.set(assetId, false)
              res.statusCode = 404
              res.end('Asset not found')
              return
            }
            setContentType(res, assetId)
            res.end(assetData)
            return
          }

          // プロキシサーバー用
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
              response.headers.get('content-type') ||
                'application/octet-stream',
            )
            res.end(new Uint8Array(await response.arrayBuffer()))
            return
          }
          next()
        })
      },
    },
    pluginScratchImport(),
  ]
}
