import type * as sb3 from 'sb3-types'
import { fromPrimitiveSource } from './block-helper'
import { block, createBlocks, valueBlock } from './composer'
import type { Monitor } from './monitors'
import {
  cloneMonitor,
  createListMonitor,
  createVariableMonitor,
} from './monitors'
import type {
  CostumeReference,
  CreateListOptions,
  CreateVariableOptions,
  ListReference,
  SoundReference,
  VariableDefinition,
} from './types'

let nextAssetId = 0
const createAssetId = () => `asset-${(++nextAssetId).toString(16)}`

const coreOpcodePrefixes = new Set([
  'argument',
  'control',
  'data',
  'event',
  'looks',
  'motion',
  'operator',
  'procedures',
  'sensing',
  'sound',
])

const isBlockObject = (
  block: sb3.Block | sb3.TopLevelPrimitive,
): block is sb3.Block => {
  return typeof block === 'object' && block !== null && 'opcode' in block
}

const collectExtensions = (targets: Array<sb3.Stage | sb3.Sprite>) => {
  const extensions = new Set<string>()

  for (const target of targets) {
    for (const block of Object.values(target.blocks)) {
      if (!isBlockObject(block)) {
        continue
      }

      const [prefix] = block.opcode.split('_')
      if (prefix && !coreOpcodePrefixes.has(prefix)) {
        extensions.add(prefix)
      }
    }
  }

  return Array.from(extensions).sort()
}

export class Target<IsStage extends boolean = boolean> {
  readonly isStage: IsStage
  readonly name: IsStage extends true ? 'Stage' : string
  currentCostume = 0

  #blocks: Record<string, sb3.Block> = {}
  #variables: Record<string, sb3.ScalarVariable> = {}
  #lists: Record<string, sb3.List> = {}
  #monitors: Monitor[] = []
  #costumes: sb3.Costume[] = []
  #sounds: sb3.Sound[] = []
  constructor(isStage: IsStage, name: IsStage extends true ? 'Stage' : string) {
    this.isStage = isStage
    this.name = name
  }

  run(handler: (target: Target<IsStage>) => void): void {
    const blocks = createBlocks(() => {
      handler(this)
    })
    this.#blocks = {
      ...this.#blocks,
      ...blocks,
    }
  }

  createVariable(
    name: string,
    defaultValue: sb3.ScalarVal = 0,
    isCloudVariableOrOptions?: boolean | CreateVariableOptions,
  ): VariableDefinition {
    const options =
      typeof isCloudVariableOrOptions === 'boolean'
        ? { isCloudVariable: isCloudVariableOrOptions }
        : isCloudVariableOrOptions
    const id = createAssetId()
    this.#variables[id] = options?.isCloudVariable
      ? [name, defaultValue, true]
      : [name, defaultValue]

    if (options?.monitor) {
      this.#monitors.push(
        createVariableMonitor(
          id,
          name,
          defaultValue,
          this.isStage ? null : this.name,
          options.monitor,
        ),
      )
    }

    return {
      id,
      name,
      type: 'variable',
      get: () =>
        valueBlock('data_variable', {
          fields: {
            VARIABLE: [name, id],
          },
        }),
      set: (value) =>
        block('data_setvariableto', {
          inputs: {
            VALUE: fromPrimitiveSource(value),
          },
          fields: {
            VARIABLE: [name, id],
          },
        }),
    }
  }

  createList(
    name: string,
    defaultValue: sb3.ScalarVal[] = [],
    options?: CreateListOptions,
  ): ListReference {
    const id = createAssetId()
    this.#lists[id] = [name, defaultValue]

    if (options?.monitor) {
      this.#monitors.push(
        createListMonitor(
          id,
          name,
          defaultValue,
          this.isStage ? null : this.name,
          options.monitor,
        ),
      )
    }

    return {
      id,
      name,
      type: 'list',
    }
  }

  addCostume(costume: sb3.Costume): CostumeReference {
    this.#costumes.push(costume)
    return {
      name: costume.name,
      type: 'costume' as const,
    }
  }

  addSound(sound: sb3.Sound): SoundReference {
    this.#sounds.push(sound)
    return {
      name: sound.name,
      type: 'sound' as const,
    }
  }

  get monitors(): readonly Monitor[] {
    return this.#monitors
  }

  toScratch(): IsStage extends true ? sb3.Stage : sb3.Sprite {
    const costumes =
      this.#costumes.length > 0
        ? this.#costumes
        : [
            {
              name: this.name,
              assetId: 'cd21514d0531fdffb22204e0ec5ed84a',
              dataFormat: 'svg' as const,
            },
          ]
    const target: sb3.Target = {
      blocks: this.#blocks,
      broadcasts: {},
      variables: this.#variables,
      lists: this.#lists,
      sounds: this.#sounds,
      currentCostume: this.currentCostume,
      costumes,
      comments: {},
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
      visible: true,
    } satisfies sb3.Sprite as IsStage extends true ? sb3.Stage : sb3.Sprite
  }
}

export class Project {
  readonly stage: Target<true>
  #targets: Target[] = []
  constructor() {
    const target = new Target(true, 'Stage')
    this.stage = target
    this.#targets.push(target)
  }
  createSprite(name: string): Target<false> {
    const sprite = new Target(false, name)
    this.#targets.push(sprite)
    return sprite
  }

  addCostume(costume: sb3.Costume): CostumeReference {
    return this.stage.addCostume(costume)
  }

  addSound(sound: sb3.Sound): SoundReference {
    return this.stage.addSound(sound)
  }

  toScratch(): sb3.ScratchProject {
    const targets = this.#targets.map((target) => target.toScratch())
    const monitors = this.#targets.flatMap((target) =>
      target.monitors.map((monitor) => cloneMonitor(monitor)),
    )
    const extensions = collectExtensions(targets)
    const project: sb3.ScratchProject & {
      monitors: Monitor[]
      extensions: string[]
    } = {
      targets,
      monitors,
      extensions,
      meta: {
        semver: '3.0.0',
        agent: `Hikkaku | ${typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'}`,
      },
    }

    return project
  }
}
