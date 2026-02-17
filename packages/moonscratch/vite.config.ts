import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { defineConfig } from 'vite-plus'

const RELEASE_IMPORTER_PATH = '../../_build/js/release/build/moonscratch.js'
const RELEASE_BINDING_PATH = '../../_build/js/release/build/moonscratch.js'
const DEBUG_BINDING_PATH = '../../_build/js/debug/build/moonscratch.js'
const DEBUG_BUILD_PATH = './_build/js/debug/build/moonscratch.js'

const toAbsolutePath = (
  importer: string | null | undefined,
  importPath: string,
) => {
  const baseDir = importer ? dirname(importer) : process.cwd()
  const normalizedCandidate = importPath.replace(/^\.\.\/\.\.\//, './')
  const candidates = [
    resolve(baseDir, importPath),
    resolve(process.cwd(), importPath),
    resolve(process.cwd(), normalizedCandidate),
  ]
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate
    }
  }
  return undefined
}

const resolveBindingPath = (importer: string | null | undefined) => {
  const releasePath = toAbsolutePath(importer, RELEASE_IMPORTER_PATH)
  if (releasePath) {
    return releasePath
  }
  if (existsSync(resolve(process.cwd(), DEBUG_BUILD_PATH))) {
    return resolve(process.cwd(), DEBUG_BUILD_PATH)
  }
  const debugPath = toAbsolutePath(importer, DEBUG_BINDING_PATH)
  return debugPath
}

export default defineConfig({
  pack: {
    entry: 'js/index.ts',
    dts: true,
    inlineOnly: ['sb3-types'],
    external: ['sharp', 'detect-libc', 'semver', '@img/colour'],
    plugins: [
      {
        name: 'mbt-binding',
        resolveId(id, importer) {
          if (id === RELEASE_BINDING_PATH) {
            return resolveBindingPath(importer)
          }
        },
      },
    ],
  },
  test: {
    include: ['./js/**/*.test.ts'],
  },
})
