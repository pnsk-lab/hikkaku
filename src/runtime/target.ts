import { denoResolverPlugin } from '@luca/esbuild-deno-loader'
import { AbstractBlock, Costume } from '../ast.ts'
import type { Runtime } from './runtime.ts'

interface RuntimeTargetInit {
  blocks: AbstractBlock[][]
  costumes: Costume[]
  currentCostumeIndex: number
  name: string
  runtime: Runtime
}

export abstract class RuntimeTarget {
  abstract readonly isStage: boolean

  readonly name: string

  readonly costumes: Costume[]
  currentCostumeIndex: number = 0
  readonly blocks: AbstractBlock[][]

  readonly runtime: Runtime

  constructor(init: RuntimeTargetInit) {
    this.costumes = init.costumes
    this.currentCostumeIndex = init.currentCostumeIndex
    this.blocks = init.blocks
    this.name = init.name
    this.runtime = init.runtime
  }

  abstract init(): Promise<() => Promise<void>>
}

interface RuntimeSpriteInit extends RuntimeTargetInit {
  x: number
  y: number
}

export class RuntimeSprite extends RuntimeTarget {
  isStage = false

  x: number
  y: number

  constructor(init: RuntimeSpriteInit) {
    super(init)

    this.x = init.x
    this.y = init.y
  }

  async init(): Promise<() => Promise<void>> {
    const runtime = this.runtime
    const drawableID = runtime.renderer.createDrawable(this.name)

    const skinIDs = await Promise.all(this.costumes.map(async costume => {
      const res = await fetch(costume.data)
      let skinID: number
      if (res.headers.get('Content-Type') === 'image/svg+xml') {
        skinID = runtime.renderer.createSVGSkin(await res.text())
      } else {
        const src = URL.createObjectURL(await res.blob())
        const image = await new Promise<HTMLImageElement>(resolve => {
          const image = new Image()
          image.onload = () => resolve(image)
          image.src = src
        })
        skinID = runtime.renderer.createBitmapSkin(image)
      }
      return {
        id: costume.id,
        skinID
      }
    }))

    runtime.renderer.updateDrawableSkinId(drawableID, skinIDs[0].skinID)

    return async () => {
      runtime.renderer.updateDrawablePosition(drawableID, [0, 0])
    }
  }
}

export class RuntimeStage extends RuntimeTarget {
  isStage = true

  async init(): Promise<() => Promise<void>> {
    return async () => {

    }
  }
}
