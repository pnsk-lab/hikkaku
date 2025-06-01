import type * as sb3 from "@pnsk-lab/sb3-types"
import { createBlocks } from "./composer"

export class Target<IsStage extends boolean = boolean> {
  readonly isStage: IsStage
  readonly name: IsStage extends true ? 'Stage' : string

  #blocks: Record<string, sb3.Block> = {}
  constructor(
    isStage: IsStage,
    name: IsStage extends true ? 'Stage' : string
  ) {
    this.isStage = isStage
    this.name = name
  }

  run (handler: (target: Target<IsStage>) => void): void {
    const blocks = createBlocks(() => {
      handler(this)
    })
    this.#blocks = {
      ...this.#blocks,
      ...blocks
    }
  }

  toScratch(): IsStage extends true ? sb3.Stage : sb3.Sprite {
    const target: sb3.Target = {
      blocks: this.#blocks,
      broadcasts: {},
      variables: {},
      lists: {},
      sounds: [],
      currentCostume: 0,
      costumes: [{
        name: this.name,
        assetId: 'cd21514d0531fdffb22204e0ec5ed84a',
        dataFormat: 'svg'
      }]
    }
    if (this.isStage) {
      return {
        ...target,
        isStage: true,
        name: 'Stage',
      } satisfies sb3.Stage as IsStage extends true ? sb3.Stage : sb3.Sprite
    }
    return {
      ...target,
      isStage: false,
      name: this.name,
      visible: true
    } satisfies sb3.Sprite as IsStage extends true ? sb3.Stage : sb3.Sprite
  }
}

export class Project {
  readonly stage: Target<true>
  #targets: Target[] = []
  constructor () {
    this.#targets.push(this.stage = new Target(true, 'Stage'))
  }
  createSprite (name: string): Target<false> {
    const sprite = new Target(false, name)
    this.#targets.push(sprite)
    return sprite
  }
  toScratch(): sb3.ScratchProject {
    return {
      targets: this.#targets.map(target => target.toScratch()),
      meta: {
        semver: '3.0.0',
        agent: `Hikkaku | ${globalThis.navigator ? navigator.userAgent : 'unknown'}`,
      }
    }
  }
}
