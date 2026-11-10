import type { PluginOption } from 'vite'
import type { MinifyScratchProjectOptions } from './minify'
import { minifyScratchProjectJson } from './minify'

export interface ScratchProjectMinifierPluginOptions
  extends MinifyScratchProjectOptions {
  include?: Array<string | RegExp>
}

const DEFAULT_INCLUDE = ['project.json']

const matchesInclude = (fileName: string, include: Array<string | RegExp>) => {
  return include.some((pattern) => {
    if (typeof pattern === 'string') {
      return fileName === pattern
    }
    return pattern.test(fileName)
  })
}

const readAssetSource = (source: string | Uint8Array) => {
  if (typeof source === 'string') {
    return source
  }
  return new TextDecoder().decode(source)
}

export const scratchProjectMinifier = (
  options: ScratchProjectMinifierPluginOptions = {},
): PluginOption => {
  const { include = DEFAULT_INCLUDE, ...minifyOptions } = options

  return {
    name: 'vite-plugin-hikkaku:scratch-project-minifier',
    enforce: 'post',
    generateBundle(_outputOptions, bundle) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== 'asset') {
          continue
        }
        if (!matchesInclude(chunk.fileName, include)) {
          continue
        }

        chunk.source = minifyScratchProjectJson(
          readAssetSource(chunk.source),
          minifyOptions,
        )
      }
    },
  }
}
