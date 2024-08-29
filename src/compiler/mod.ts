/**
 * Compiler
 * @module
 */

import type { AbstractTarget } from '../ast.ts'
import type { Config } from '../config/mod.ts'
import type { ScratchProject, Stage as ScratchStage, Sprite as ScratchSprite, Costume as ScratchCostume } from '@pnsk-lab/sb3-types'
import { uint8ArrayToHex } from '../utils/hex.ts'
import { getFormatFromMime } from './assets.ts'
import { fetchAsset } from './assets.ts'
import { crypto as stdCrypto } from '@std/crypto'
import { compileBlocks } from './blocks.ts'
import { zipSync } from 'fflate'

class CompileContext {
  config: Config
  constructor(config: Config) {
    this.config = config
  }
  #assets: Map<string, {
    fileFormat: string
    blob: Blob
  }> = new Map()
  async addAsset(data: Blob) {
    const md5 = uint8ArrayToHex(new Uint8Array(await stdCrypto.subtle.digest('MD5', await data.arrayBuffer())))
    this.#assets.set(md5, {
      blob: data,
      fileFormat: getFormatFromMime(data.type)
    })
    return md5
  }
}


const compileTarget = async (tree: AbstractTarget, ctx: CompileContext): Promise<(ScratchStage | ScratchSprite)> => {
  const costumes: ScratchCostume[] = await Promise.all(tree.costumes.map(async (costume): Promise<ScratchCostume> => {
    const blob = await fetchAsset(costume.data)
    const md5 = await ctx.addAsset(blob)
    const format = getFormatFromMime(blob.type) as ScratchCostume['dataFormat']
    return {
      name: costume.id,
      assetId: md5,
      dataFormat: format,
      md5ext: `${md5}.${format}`
    }
  }))
  const blocks = compileBlocks(tree.blocks)

  if (tree.name === 'stage') {
    return {
      isStage: true,
      blocks,
      broadcasts: {}, // TODO
      costumes,
      currentCostume: 0,
      lists: {}, // TODO
      name: 'Stage',
      sounds: [], // TODO
      variables: {}, // TODO
    } satisfies ScratchStage
  } else {
    return {
      isStage: false,
      blocks,
      broadcasts: {}, // TODO
      costumes,
      currentCostume: 0,
      lists: {}, // TODO
      name: tree.name,
      sounds: [], // TODO
      variables: {}, // TODO

      comments: {
        [crypto.randomUUID()]: {
          text: 'Compiled with Hikkaku\nhttps://github.com/pnsk-lab/hikkaku',
          width: 256,
          height: 256,
          x: -100,
          y: -100
        }
      }
    } satisfies ScratchSprite
  }
}

/**
 * Compile to sb3
 * @param config Config
 * @returns sb3 file
 */
export const compile = async (config: Config): Promise<Uint8Array> => {
  const ast = config.project.exportAsAST()

  const ctx = new CompileContext(config)

  const project: ScratchProject = {
    meta: {
      semver: "3.0.0",
      vm: "0.2.0",
      agent: navigator.userAgent + ', Hikkaku'
    },
    targets: await Promise.all([ast.stage, ...ast.sprites].map(target => compileTarget(target, ctx)))
  }

  const fileTree = {
    'project.json': new TextEncoder().encode(JSON.stringify(project))
  }
  const sb3 = zipSync(fileTree)

  return sb3
}
