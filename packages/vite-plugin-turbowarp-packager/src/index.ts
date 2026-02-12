import { readFile } from 'node:fs/promises'
import type { PackagerOptions } from '@turbowarp/packager'
import type { PluginOption } from 'vite'
import { loadPackager } from './packager'

const VIRTUAL_MODULE_IDS = {
  html: 'virtual:turbowarp-packager.html',
  js: 'virtual:turbowarp-packager.js',
} as const

export interface TurbowarpPackagerOptions {
  sb3Entry?: string
  packagerOptions?: Partial<PackagerOptions>
}

export const pluginTurbowarpPackager = (
  options?: TurbowarpPackagerOptions,
): PluginOption => {
  let packedData: string | null = null
  const decoder = new TextDecoder()
  const pack = async () => {
    if (packedData) {
      return packedData
    }
    const sb3Entry = options?.sb3Entry
    if (!sb3Entry) {
      throw new Error('sb3Entry is not set in TurbowarpPackagerOptions.')
    }
    const { loadProject, Packager } = await loadPackager()
    const sb3 = await readFile(sb3Entry)

    const project = await loadProject(sb3)
    const packager = new Packager()
    const resolvedPackagerOptions = Object.assign(
      {},
      packager.options,
      {
        target: 'html',
      },
      options?.packagerOptions ?? {},
    )
    packager.options = resolvedPackagerOptions
    packager.project = project
    if (resolvedPackagerOptions.target !== 'html') {
      throw new Error(
        `Currently ${resolvedPackagerOptions.target} target is not supported in Vite plugin, only 'html' target is supported.`,
      )
    }
    const packageResult = await packager.package()

    const html =
      typeof packageResult.data === 'string'
        ? packageResult.data
        : decoder.decode(packageResult.data)
    packedData = html
    return html
  }
  return {
    name: 'vite-plugin-turbowarp-packager',
    api: {
      setEntry(sb3Entry: string) {
        options = {
          ...options,
          sb3Entry,
        }
      },
    },
    config(_config, _env) {
      const sb3Entry = options?.sb3Entry
      if (!sb3Entry) {
        throw new Error('sb3Entry is not set in TurbowarpPackagerOptions.')
      }
      return {
        environments: {
          turbowarpPackager: {
            build: {
              rolldownOptions: {
                input: VIRTUAL_MODULE_IDS.html,
                output: {
                  entryFileNames: 'turbowarp-packager.html',
                },
              },
            },
            consumer: 'client',
          },
        },
        builder: {},
      }
    },
    async buildApp(builder) {
      const env = builder.environments.turbowarpPackager
      if (!env) {
        throw new Error('Turbowarp Packager environment is not configured.')
      }
      await builder.build(env)
    },
    resolveId(source) {
      if (source === VIRTUAL_MODULE_IDS.html) {
        return source
      }
    },
    async load(id) {
      if (id === VIRTUAL_MODULE_IDS.html) {
        const packed = await pack()
        if (!packed) {
          throw new Error('Packing failed.')
        }

        return {
          code: packed,
        }
      }
    },
  }
}
