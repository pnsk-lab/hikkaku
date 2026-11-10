import type * as sb3 from 'sb3-types'
import { InputType, Shadow } from 'sb3-types/enum'

export type ScratchProjectLike = sb3.ScratchProject & {
  extensions?: string[]
  monitors?: Array<Record<string, unknown>>
}

export interface MinifyScratchProjectOptions {
  renameVariables?: boolean
  renameLists?: boolean
  renameBroadcasts?: boolean
  renameCostumes?: boolean
  renameSounds?: boolean
  renameSprites?: boolean
  pruneUnreachableBlocks?: boolean
  pruneInputFallbacks?: boolean
  stripBlockMetadata?: boolean
  stripMetaAgent?: boolean
}

export const defaultMinifyScratchProjectOptions: Readonly<
  Required<MinifyScratchProjectOptions>
> = {
  renameVariables: true,
  renameLists: true,
  renameBroadcasts: true,
  renameCostumes: true,
  renameSounds: true,
  renameSprites: true,
  pruneUnreachableBlocks: true,
  pruneInputFallbacks: true,
  stripBlockMetadata: true,
  stripMetaAgent: true,
}

type ResolvedOptions = Required<MinifyScratchProjectOptions>

type TargetRenameState = {
  variableNamesById: Map<string, string>
  listNamesById: Map<string, string>
  costumeNamesByValue: Map<string, string>
  soundNamesByValue: Map<string, string>
}

type RenameState = {
  spriteNamesByValue: Map<string, string>
  broadcastNamesById: Map<string, string>
  broadcastNamesByValue: Map<string, string>
  stageBackdropNamesByValue: Map<string, string>
  targets: TargetRenameState[]
}

const EMPTY_TARGET_RENAME_STATE: TargetRenameState = {
  variableNamesById: new Map(),
  listNamesById: new Map(),
  costumeNamesByValue: new Map(),
  soundNamesByValue: new Map(),
}

const TARGET_MENU_OPCODES = new Set([
  'event_whentouchingobject',
  'motion_glideto_menu',
  'motion_goto_menu',
  'motion_pointtowards_menu',
  'sensing_distancetomenu',
  'sensing_of_object_menu',
  'sensing_touchingobjectmenu',
])

const RESERVED_SPRITE_NAMES = new Set([
  '_edge_',
  '_mouse_',
  '_myself_',
  '_random_',
  '_stage_',
])

const SHORT_NAME_ALPHABET =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

const isBlockObject = (
  block: sb3.Block | sb3.TopLevelPrimitive,
): block is sb3.Block => {
  return typeof block === 'object' && block !== null && 'opcode' in block
}

const cloneProject = (project: ScratchProjectLike): ScratchProjectLike => {
  if (typeof structuredClone === 'function') {
    return structuredClone(project)
  }
  return JSON.parse(JSON.stringify(project)) as ScratchProjectLike
}

const resolveOptions = (
  options?: MinifyScratchProjectOptions,
): ResolvedOptions => {
  return {
    ...defaultMinifyScratchProjectOptions,
    ...options,
  }
}

const nextShortName = (index: number) => {
  let cursor = index
  let result = ''

  while (cursor >= 0) {
    result = SHORT_NAME_ALPHABET[cursor % SHORT_NAME_ALPHABET.length] + result
    cursor = Math.floor(cursor / SHORT_NAME_ALPHABET.length) - 1
  }

  return result
}

const createAllocator = (reserved?: Set<string>) => {
  let index = 0
  const used = new Set(reserved ?? [])

  return () => {
    while (true) {
      const candidate = nextShortName(index++)
      if (used.has(candidate)) {
        continue
      }
      used.add(candidate)
      return candidate
    }
  }
}

const buildIdRenameMap = (ids: string[]) => {
  const allocate = createAllocator()
  const renameMap = new Map<string, string>()
  for (const id of ids) {
    renameMap.set(id, allocate())
  }
  return renameMap
}

const buildUniqueValueRenameMap = (
  values: string[],
  reserved?: Set<string>,
): Map<string, string> => {
  if (values.length === 0) {
    return new Map()
  }

  const uniqueValues = new Set(values)
  if (uniqueValues.size !== values.length) {
    return new Map()
  }

  const allocate = createAllocator(reserved)
  const renameMap = new Map<string, string>()
  for (const value of values) {
    renameMap.set(value, allocate())
  }
  return renameMap
}

const buildRenameState = (
  project: ScratchProjectLike,
  options: ResolvedOptions,
): RenameState => {
  const spriteNamesByValue = options.renameSprites
    ? buildUniqueValueRenameMap(
        project.targets
          .filter((target): target is sb3.Sprite => !target.isStage)
          .map((target) => target.name),
        RESERVED_SPRITE_NAMES,
      )
    : new Map<string, string>()

  const broadcastEntries = project.targets.flatMap((target) =>
    Object.entries(target.broadcasts ?? {}),
  )
  const broadcastNamesById = options.renameBroadcasts
    ? buildIdRenameMap(broadcastEntries.map(([id]) => id))
    : new Map<string, string>()
  const broadcastNamesByValue = options.renameBroadcasts
    ? buildUniqueValueRenameMap(broadcastEntries.map(([, value]) => value))
    : new Map<string, string>()

  const stage = project.targets.find(
    (target): target is sb3.Stage => target.isStage,
  )
  const stageBackdropNamesByValue =
    options.renameCostumes && stage
      ? buildUniqueValueRenameMap(stage.costumes.map((costume) => costume.name))
      : new Map<string, string>()

  const targets = project.targets.map<TargetRenameState>((target) => ({
    variableNamesById: options.renameVariables
      ? buildIdRenameMap(Object.keys(target.variables ?? {}))
      : new Map<string, string>(),
    listNamesById: options.renameLists
      ? buildIdRenameMap(Object.keys(target.lists ?? {}))
      : new Map<string, string>(),
    costumeNamesByValue: options.renameCostumes
      ? buildUniqueValueRenameMap(
          target.costumes.map((costume) => costume.name),
        )
      : new Map<string, string>(),
    soundNamesByValue: options.renameSounds
      ? buildUniqueValueRenameMap(target.sounds.map((sound) => sound.name))
      : new Map<string, string>(),
  }))

  return {
    spriteNamesByValue,
    broadcastNamesById,
    broadcastNamesByValue,
    stageBackdropNamesByValue,
    targets,
  }
}

const renamePrimitive = (
  primitive: sb3.InputPrimitive,
  targetState: TargetRenameState,
  renameState: RenameState,
) => {
  switch (primitive[0]) {
    case InputType.Variable: {
      const renamed = targetState.variableNamesById.get(primitive[2])
      if (renamed) {
        primitive[1] = renamed
      }
      return
    }
    case InputType.List: {
      const renamed = targetState.listNamesById.get(primitive[2])
      if (renamed) {
        primitive[1] = renamed
      }
      return
    }
    case InputType.Broadcast: {
      const renamed = renameState.broadcastNamesById.get(primitive[2])
      if (renamed) {
        primitive[1] = renamed
      }
      return
    }
    default:
      return
  }
}

const renameFieldValue = (
  opcode: string,
  fieldName: string,
  field: sb3.Fields,
  targetState: TargetRenameState,
  renameState: RenameState,
) => {
  const [value, id] = field

  if (fieldName === 'VARIABLE' && id) {
    const renamed = targetState.variableNamesById.get(id)
    if (renamed) {
      field[0] = renamed
    }
    return
  }

  if (fieldName === 'LIST' && id) {
    const renamed = targetState.listNamesById.get(id)
    if (renamed) {
      field[0] = renamed
    }
    return
  }

  if (fieldName === 'BROADCAST_OPTION') {
    const renamedById = id && renameState.broadcastNamesById.get(id)
    const renamedByValue = renameState.broadcastNamesByValue.get(value)
    if (renamedById ?? renamedByValue) {
      field[0] = renamedById ?? renamedByValue ?? value
    }
    return
  }

  if (opcode === 'looks_costume' && fieldName === 'COSTUME') {
    const renamed = targetState.costumeNamesByValue.get(value)
    if (renamed) {
      field[0] = renamed
    }
    return
  }

  if (
    (opcode === 'looks_backdrops' ||
      opcode === 'event_whenbackdropswitchesto') &&
    fieldName === 'BACKDROP'
  ) {
    const renamed = renameState.stageBackdropNamesByValue.get(value)
    if (renamed) {
      field[0] = renamed
    }
    return
  }

  if (opcode === 'sound_sounds_menu' && fieldName === 'SOUND_MENU') {
    const renamed = targetState.soundNamesByValue.get(value)
    if (renamed) {
      field[0] = renamed
    }
    return
  }

  if (TARGET_MENU_OPCODES.has(opcode)) {
    const renamed = renameState.spriteNamesByValue.get(value)
    if (renamed) {
      field[0] = renamed
    }
  }
}

const rewriteTargetNames = (
  target: sb3.Stage | sb3.Sprite,
  targetState: TargetRenameState,
  renameState: RenameState,
) => {
  if (!target.isStage) {
    const renamed = renameState.spriteNamesByValue.get(target.name)
    if (renamed) {
      target.name = renamed
    }
  }

  for (const [id, variable] of Object.entries(target.variables ?? {})) {
    const renamed = targetState.variableNamesById.get(id)
    if (renamed) {
      variable[0] = renamed
    }
  }

  for (const [id, list] of Object.entries(target.lists ?? {})) {
    const renamed = targetState.listNamesById.get(id)
    if (renamed) {
      list[0] = renamed
    }
  }

  for (const [id, name] of Object.entries(target.broadcasts ?? {})) {
    const renamed = renameState.broadcastNamesById.get(id)
    if (renamed) {
      target.broadcasts[id] = renamed
      renameState.broadcastNamesByValue.set(name, renamed)
    }
  }

  for (const costume of target.costumes ?? []) {
    const renamed = targetState.costumeNamesByValue.get(costume.name)
    if (renamed) {
      costume.name = renamed
    }
  }

  for (const sound of target.sounds ?? []) {
    const renamed = targetState.soundNamesByValue.get(sound.name)
    if (renamed) {
      sound.name = renamed
    }
  }
}

const rewriteMonitors = (
  project: ScratchProjectLike,
  renameState: RenameState,
) => {
  const monitors = project.monitors
  if (!Array.isArray(monitors)) {
    return
  }

  for (const monitor of monitors) {
    if (!monitor || typeof monitor !== 'object') {
      continue
    }

    const monitorId =
      'id' in monitor && typeof monitor.id === 'string' ? monitor.id : null
    const spriteName =
      'spriteName' in monitor && typeof monitor.spriteName === 'string'
        ? monitor.spriteName
        : null
    if (spriteName) {
      const renamedSprite = renameState.spriteNamesByValue.get(spriteName)
      if (renamedSprite) {
        monitor.spriteName = renamedSprite
      }
    }

    if (
      !('params' in monitor) ||
      typeof monitor.params !== 'object' ||
      !monitor.params
    ) {
      continue
    }

    const params = monitor.params as Record<string, unknown>
    if (typeof params.VARIABLE === 'string' && monitorId) {
      for (const targetState of renameState.targets) {
        const renamed = targetState.variableNamesById.get(monitorId)
        if (renamed) {
          params.VARIABLE = renamed
          break
        }
      }
    }

    if (typeof params.LIST === 'string' && monitorId) {
      for (const targetState of renameState.targets) {
        const renamed = targetState.listNamesById.get(monitorId)
        if (renamed) {
          params.LIST = renamed
          break
        }
      }
    }
  }
}

const applyRenames = (
  project: ScratchProjectLike,
  renameState: RenameState,
) => {
  for (const [index, target] of project.targets.entries()) {
    const targetState = renameState.targets[index] ?? EMPTY_TARGET_RENAME_STATE
    rewriteTargetNames(target, targetState, renameState)

    for (const block of Object.values(target.blocks ?? {})) {
      if (isBlockObject(block)) {
        for (const field of Object.entries(block.fields ?? {})) {
          renameFieldValue(
            block.opcode,
            field[0],
            field[1],
            targetState,
            renameState,
          )
        }

        for (const input of Object.values(block.inputs ?? {})) {
          const visible = input[1]
          if (typeof visible !== 'string') {
            renamePrimitive(visible, targetState, renameState)
          }
          if (input[0] === Shadow.DiffBlockShadow && input.length === 3) {
            const hidden = input[2]
            if (typeof hidden !== 'string') {
              renamePrimitive(hidden, targetState, renameState)
            }
          }
        }
      } else if (block[0] === InputType.Variable) {
        const renamed = targetState.variableNamesById.get(block[2])
        if (renamed) {
          block[1] = renamed
        }
      } else if (block[0] === InputType.List) {
        const renamed = targetState.listNamesById.get(block[2])
        if (renamed) {
          block[1] = renamed
        }
      }
    }
  }

  rewriteMonitors(project, renameState)
}

const inferVisibleShadowType = (
  reference: sb3.InputPrimitiveOrReference,
  blocks: Record<string, sb3.Block | sb3.TopLevelPrimitive>,
) => {
  if (typeof reference !== 'string') {
    return Shadow.SameBlockShadow
  }

  const block = blocks[reference]
  if (!block) {
    return Shadow.NoShadow
  }
  return isBlockObject(block) && block.shadow
    ? Shadow.SameBlockShadow
    : Shadow.NoShadow
}

const collapseHiddenInputValues = (target: sb3.Stage | sb3.Sprite) => {
  for (const block of Object.values(target.blocks ?? {})) {
    if (!isBlockObject(block) || !block.inputs) {
      continue
    }

    for (const [name, input] of Object.entries(block.inputs)) {
      if (input[0] !== Shadow.DiffBlockShadow || input.length !== 3) {
        continue
      }

      block.inputs[name] = [
        inferVisibleShadowType(input[1], target.blocks),
        input[1],
      ]
    }
  }
}

const markReachable = (
  blockId: string,
  blocks: Record<string, sb3.Block | sb3.TopLevelPrimitive>,
  reachable: Set<string>,
) => {
  if (reachable.has(blockId) || !(blockId in blocks)) {
    return
  }
  reachable.add(blockId)

  const block = blocks[blockId]
  if (!block) {
    return
  }
  if (!isBlockObject(block)) {
    return
  }

  if (block.next) {
    markReachable(block.next, blocks, reachable)
  }

  for (const input of Object.values(block.inputs ?? {})) {
    const visible = input[1]
    if (typeof visible === 'string') {
      markReachable(visible, blocks, reachable)
    }
    if (input[0] === Shadow.DiffBlockShadow && input.length === 3) {
      const hidden = input[2]
      if (typeof hidden === 'string') {
        markReachable(hidden, blocks, reachable)
      }
    }
  }
}

const pruneUnreachableBlocks = (target: sb3.Stage | sb3.Sprite) => {
  const reachable = new Set<string>()

  for (const [blockId, block] of Object.entries(target.blocks ?? {})) {
    if (isBlockObject(block) && block.topLevel) {
      markReachable(blockId, target.blocks, reachable)
    }
  }

  const nextBlocks: Record<string, sb3.Block | sb3.TopLevelPrimitive> = {}
  for (const [blockId, block] of Object.entries(target.blocks ?? {})) {
    if (!reachable.has(blockId)) {
      continue
    }
    if (!block) {
      continue
    }
    nextBlocks[blockId] = block
  }
  target.blocks = nextBlocks

  if (target.comments) {
    const nextComments = Object.fromEntries(
      Object.entries(target.comments).filter(([, comment]) => {
        return !comment.blockId || reachable.has(comment.blockId)
      }),
    )
    if (Object.keys(nextComments).length === 0) {
      delete target.comments
    } else {
      target.comments = nextComments
    }
  }
}

const stripBlockMetadata = (target: sb3.Stage | sb3.Sprite) => {
  for (const block of Object.values(target.blocks ?? {})) {
    if (!isBlockObject(block)) {
      continue
    }

    if (!block.comment) {
      delete block.comment
    }
    if (!block.mutation) {
      delete block.mutation
    }
    if (!block.inputs || Object.keys(block.inputs).length === 0) {
      delete block.inputs
    }
    if (!block.fields || Object.keys(block.fields).length === 0) {
      delete block.fields
    }
    if (block.next == null) {
      delete block.next
    }
    if (block.parent == null) {
      delete block.parent
    }
    if (!block.shadow) {
      delete block.shadow
    }
    if (!block.topLevel) {
      delete block.topLevel
      delete block.x
      delete block.y
    } else {
      if (block.x == null) {
        delete block.x
      }
      if (block.y == null) {
        delete block.y
      }
    }
  }
}

const stripProjectMetadata = (project: ScratchProjectLike) => {
  delete project.meta.agent

  for (const target of project.targets) {
    if (target.comments && Object.keys(target.comments).length === 0) {
      delete target.comments
    }
  }
}

export const minifyScratchProject = (
  project: ScratchProjectLike,
  options?: MinifyScratchProjectOptions,
): ScratchProjectLike => {
  const resolvedOptions = resolveOptions(options)
  const minified = cloneProject(project)

  const renameState = buildRenameState(minified, resolvedOptions)
  applyRenames(minified, renameState)

  for (const target of minified.targets) {
    if (resolvedOptions.pruneInputFallbacks) {
      collapseHiddenInputValues(target)
    }
    if (resolvedOptions.pruneUnreachableBlocks) {
      pruneUnreachableBlocks(target)
    }
    if (resolvedOptions.stripBlockMetadata) {
      stripBlockMetadata(target)
    }
  }

  if (resolvedOptions.stripMetaAgent) {
    stripProjectMetadata(minified)
  }

  return minified
}

export const minifyScratchProjectJson = (
  source: string | Uint8Array,
  options?: MinifyScratchProjectOptions,
) => {
  const jsonText =
    typeof source === 'string' ? source : new TextDecoder().decode(source)
  const parsed = JSON.parse(jsonText) as ScratchProjectLike
  const minified = minifyScratchProject(parsed, options)
  return JSON.stringify(minified)
}
