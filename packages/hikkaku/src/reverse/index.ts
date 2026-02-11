import type { ScratchProject } from 'sb3-types'

export interface ReverseResult {
  imports: string
  targetCodes: {
    [targetName: string]: string
  }
}

type ScratchTarget = ScratchProject['targets'][number]

interface ReverseVariableMonitor {
  id: string
  opcode: 'data_variable'
  mode?: 'default' | 'large' | 'slider'
  visible?: boolean
  sliderMin?: number
  sliderMax?: number
  isDiscrete?: boolean
  x?: number | null
  y?: number | null
}

interface ReverseListMonitor {
  id: string
  opcode: 'data_listcontents'
  visible?: boolean
  width?: number
  height?: number
  x?: number | null
  y?: number | null
}

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

const toCodeLiteral = (value: unknown): string => {
  const serialized = JSON.stringify(value)
  return serialized === undefined ? 'undefined' : serialized
}

const toReverseMonitors = (
  project: ScratchProject,
): {
  variable: Map<string, ReverseVariableMonitor>
  list: Map<string, ReverseListMonitor>
} => {
  const variable = new Map<string, ReverseVariableMonitor>()
  const list = new Map<string, ReverseListMonitor>()
  const maybeMonitors = (
    project as ScratchProject & {
      monitors?: unknown
    }
  ).monitors
  const monitors = Array.isArray(maybeMonitors) ? maybeMonitors : []

  for (const monitor of monitors) {
    if (!isObject(monitor)) {
      continue
    }
    const id = typeof monitor.id === 'string' ? monitor.id : ''
    const opcode = monitor.opcode
    if (!id || typeof opcode !== 'string') {
      continue
    }

    if (opcode === 'data_variable') {
      const parsed: ReverseVariableMonitor = {
        id,
        opcode: 'data_variable',
      }
      if (
        monitor.mode === 'default' ||
        monitor.mode === 'large' ||
        monitor.mode === 'slider'
      ) {
        parsed.mode = monitor.mode
      }
      if (typeof monitor.visible === 'boolean') {
        parsed.visible = monitor.visible
      }
      if (typeof monitor.sliderMin === 'number') {
        parsed.sliderMin = monitor.sliderMin
      }
      if (typeof monitor.sliderMax === 'number') {
        parsed.sliderMax = monitor.sliderMax
      }
      if (typeof monitor.isDiscrete === 'boolean') {
        parsed.isDiscrete = monitor.isDiscrete
      }
      if (monitor.x === null || typeof monitor.x === 'number') {
        parsed.x = monitor.x
      }
      if (monitor.y === null || typeof monitor.y === 'number') {
        parsed.y = monitor.y
      }
      variable.set(id, parsed)
      continue
    }

    if (opcode === 'data_listcontents') {
      const parsed: ReverseListMonitor = {
        id,
        opcode: 'data_listcontents',
      }
      if (typeof monitor.visible === 'boolean') {
        parsed.visible = monitor.visible
      }
      if (typeof monitor.width === 'number') {
        parsed.width = monitor.width
      }
      if (typeof monitor.height === 'number') {
        parsed.height = monitor.height
      }
      if (monitor.x === null || typeof monitor.x === 'number') {
        parsed.x = monitor.x
      }
      if (monitor.y === null || typeof monitor.y === 'number') {
        parsed.y = monitor.y
      }
      list.set(id, parsed)
    }
  }

  return {
    variable,
    list,
  }
}

const buildVariableOptions = (
  monitor: ReverseVariableMonitor | undefined,
  isCloudVariable: boolean,
): Record<string, unknown> | undefined => {
  const options: Record<string, unknown> = {}

  if (isCloudVariable) {
    options.isCloudVariable = true
  }

  if (monitor) {
    const monitorOptions: Record<string, unknown> = {}
    if (typeof monitor.visible === 'boolean') {
      monitorOptions.visible = monitor.visible
    }
    if (monitor.mode) {
      monitorOptions.mode = monitor.mode
    }
    if (typeof monitor.sliderMin === 'number') {
      monitorOptions.sliderMin = monitor.sliderMin
    }
    if (typeof monitor.sliderMax === 'number') {
      monitorOptions.sliderMax = monitor.sliderMax
    }
    if (typeof monitor.isDiscrete === 'boolean') {
      monitorOptions.isDiscrete = monitor.isDiscrete
    }
    if (monitor.x === null || typeof monitor.x === 'number') {
      monitorOptions.x = monitor.x
    }
    if (monitor.y === null || typeof monitor.y === 'number') {
      monitorOptions.y = monitor.y
    }
    if (Object.keys(monitorOptions).length > 0) {
      options.monitor = monitorOptions
    }
  }

  return Object.keys(options).length > 0 ? options : undefined
}

const buildListOptions = (
  monitor: ReverseListMonitor | undefined,
): Record<string, unknown> | undefined => {
  if (!monitor) {
    return undefined
  }

  const monitorOptions: Record<string, unknown> = {}
  if (typeof monitor.visible === 'boolean') {
    monitorOptions.visible = monitor.visible
  }
  if (typeof monitor.width === 'number') {
    monitorOptions.width = monitor.width
  }
  if (typeof monitor.height === 'number') {
    monitorOptions.height = monitor.height
  }
  if (monitor.x === null || typeof monitor.x === 'number') {
    monitorOptions.x = monitor.x
  }
  if (monitor.y === null || typeof monitor.y === 'number') {
    monitorOptions.y = monitor.y
  }

  if (Object.keys(monitorOptions).length === 0) {
    return undefined
  }

  return {
    monitor: monitorOptions,
  }
}

const makePatchObject = (target: ScratchTarget): Record<string, unknown> => {
  const patch: Record<string, unknown> = {}

  if (Object.keys(target.broadcasts).length > 0) {
    patch.broadcasts = target.broadcasts
  }

  if (target.comments && Object.keys(target.comments).length > 0) {
    patch.comments = target.comments
  }

  if (typeof target.volume === 'number') {
    patch.volume = target.volume
  }

  if (target.isStage) {
    if (typeof target.tempo === 'number') {
      patch.tempo = target.tempo
    }
    if (typeof target.videoTransparency === 'number') {
      patch.videoTransparency = target.videoTransparency
    }
    if (
      target.videoState === 'on' ||
      target.videoState === 'off' ||
      target.videoState === 'on-flipped'
    ) {
      patch.videoState = target.videoState
    }
    if (target.layerOrder === 0) {
      patch.layerOrder = 0
    }
  } else {
    if (typeof target.visible === 'boolean') {
      patch.visible = target.visible
    }
    if (typeof target.x === 'number') {
      patch.x = target.x
    }
    if (typeof target.y === 'number') {
      patch.y = target.y
    }
    if (typeof target.size === 'number') {
      patch.size = target.size
    }
    if (typeof target.direction === 'number') {
      patch.direction = target.direction
    }
    if (typeof target.draggable === 'boolean') {
      patch.draggable = target.draggable
    }
    if (
      target.rotationStyle === 'all around' ||
      target.rotationStyle === "don't rotate" ||
      target.rotationStyle === 'left-right'
    ) {
      patch.rotationStyle = target.rotationStyle
    }
    if (typeof target.layerOrder === 'number') {
      patch.layerOrder = target.layerOrder
    }
  }

  return patch
}

const makeUniqueKey = (
  wanted: string,
  used: Set<string>,
  fallback: string,
): string => {
  const base = wanted || fallback
  if (!used.has(base)) {
    used.add(base)
    return base
  }
  for (let i = 2; i < 9999; i += 1) {
    const next = `${base}#${i}`
    if (!used.has(next)) {
      used.add(next)
      return next
    }
  }
  const finalKey = `${fallback}-${Date.now().toString(16)}`
  used.add(finalKey)
  return finalKey
}

const buildImportsCode = (): string => {
  return [
    "import { Project, block, substack, valueBlock } from 'hikkaku'",
    "import type { Block, Fields, Input, ScratchProject, TopLevelPrimitive } from 'sb3-types'",
    "import { Shadow } from 'sb3-types/enum'",
    '',
    "type __ScratchBlockEntry = ScratchProject['targets'][number]['blocks'][string]",
    'type __Primitive = [number, string | number, string?, number?, number?]',
    '',
    'const __isBlockObject = (value: __ScratchBlockEntry | undefined): value is Block => {',
    "  return typeof value === 'object' && value !== null && !Array.isArray(value) && 'opcode' in value",
    '}',
    '',
    'const __isTopLevelPrimitive = (',
    '  value: __ScratchBlockEntry | undefined,',
    '): value is TopLevelPrimitive => {',
    '  return Array.isArray(value) && (value[0] === 12 || value[0] === 13) && value.length > 3',
    '}',
    '',
    'const __remapPrimitive = (',
    '  primitive: __Primitive,',
    '  remapAssetId: (id: string) => string,',
    '): __Primitive => {',
    '  const cloned = [...primitive] as __Primitive',
    "  if ((cloned[0] === 12 || cloned[0] === 13) && typeof cloned[2] === 'string') {",
    '    cloned[2] = remapAssetId(cloned[2])',
    '  }',
    '  return cloned',
    '}',
    '',
    'interface __NormalizedBlock {',
    '  opcode: string',
    '  inputs: Record<string, Input>',
    '  fields: Record<string, Fields>',
    '  shadow: boolean',
    '  topLevel: boolean',
    '  x: number',
    '  y: number',
    '  next: string | null',
    "  mutation?: Block['mutation']",
    '}',
    '',
    'const __primitiveToBlock = (',
    '  primitive: __Primitive,',
    '  remapAssetId: (id: string) => string,',
    '  isShadow: boolean,',
    '): __NormalizedBlock => {',
    '  const primitiveType = primitive[0]',
    "  const rawValue = primitive[1] ?? ''",
    "  const rawId = typeof primitive[2] === 'string' ? primitive[2] : null",
    "  const value = typeof rawValue === 'string' ? rawValue : String(rawValue)",
    '  const id =',
    '    primitiveType === 12 || primitiveType === 13',
    '      ? (rawId ? remapAssetId(rawId) : null)',
    '      : rawId',
    '  const topLevel = (primitiveType === 12 || primitiveType === 13) && primitive.length > 3',
    "  const x = topLevel && typeof primitive[3] === 'number' ? primitive[3] : 0",
    "  const y = topLevel && typeof primitive[4] === 'number' ? primitive[4] : 0",
    '',
    '  switch (primitiveType) {',
    '    case 4:',
    '      return {',
    "        opcode: 'math_number',",
    '        fields: { NUM: [value, null] },',
    '        inputs: {},',
    '        shadow: isShadow,',
    '        topLevel,',
    '        x,',
    '        y,',
    '        next: null,',
    '      }',
    '    case 5:',
    '      return {',
    "        opcode: 'math_positive_number',",
    '        fields: { NUM: [value, null] },',
    '        inputs: {},',
    '        shadow: isShadow,',
    '        topLevel,',
    '        x,',
    '        y,',
    '        next: null,',
    '      }',
    '    case 6:',
    '      return {',
    "        opcode: 'math_whole_number',",
    '        fields: { NUM: [value, null] },',
    '        inputs: {},',
    '        shadow: isShadow,',
    '        topLevel,',
    '        x,',
    '        y,',
    '        next: null,',
    '      }',
    '    case 7:',
    '      return {',
    "        opcode: 'math_integer',",
    '        fields: { NUM: [value, null] },',
    '        inputs: {},',
    '        shadow: isShadow,',
    '        topLevel,',
    '        x,',
    '        y,',
    '        next: null,',
    '      }',
    '    case 8:',
    '      return {',
    "        opcode: 'math_angle',",
    '        fields: { NUM: [value, null] },',
    '        inputs: {},',
    '        shadow: isShadow,',
    '        topLevel,',
    '        x,',
    '        y,',
    '        next: null,',
    '      }',
    '    case 9:',
    '      return {',
    "        opcode: 'colour_picker',",
    '        fields: { COLOUR: [value, null] },',
    '        inputs: {},',
    '        shadow: isShadow,',
    '        topLevel,',
    '        x,',
    '        y,',
    '        next: null,',
    '      }',
    '    case 10:',
    '      return {',
    "        opcode: 'text',",
    '        fields: { TEXT: [value, null] },',
    '        inputs: {},',
    '        shadow: isShadow,',
    '        topLevel,',
    '        x,',
    '        y,',
    '        next: null,',
    '      }',
    '    case 11:',
    '      return {',
    "        opcode: 'event_broadcast_menu',",
    '        fields: { BROADCAST_OPTION: [value, id] },',
    '        inputs: {},',
    '        shadow: isShadow,',
    '        topLevel,',
    '        x,',
    '        y,',
    '        next: null,',
    '      }',
    '    case 12:',
    '      return {',
    "        opcode: 'data_variable',",
    '        fields: { VARIABLE: [value, id] },',
    '        inputs: {},',
    '        shadow: isShadow,',
    '        topLevel,',
    '        x,',
    '        y,',
    '        next: null,',
    '      }',
    '    case 13:',
    '      return {',
    "        opcode: 'data_listcontents',",
    '        fields: { LIST: [value, id] },',
    '        inputs: {},',
    '        shadow: isShadow,',
    '        topLevel,',
    '        x,',
    '        y,',
    '        next: null,',
    '      }',
    '    default:',
    '      return {',
    "        opcode: 'text',",
    '        fields: { TEXT: [value, null] },',
    '        inputs: {},',
    '        shadow: isShadow,',
    '        topLevel,',
    '        x,',
    '        y,',
    '        next: null,',
    '      }',
    '  }',
    '}',
    '',
    'const __normalizeBlock = (',
    '  raw: __ScratchBlockEntry,',
    '  remapAssetId: (id: string) => string,',
    '  asValue: boolean,',
    '): __NormalizedBlock => {',
    '  if (Array.isArray(raw)) {',
    '    return __primitiveToBlock(raw as __Primitive, remapAssetId, asValue)',
    '  }',
    '',
    '  const fields: Record<string, Fields> = {}',
    '  for (const [fieldName, rawField] of Object.entries(raw.fields ?? {})) {',
    '    if (!Array.isArray(rawField)) {',
    '      continue',
    '    }',
    "    const value = typeof rawField[0] === 'string' ? rawField[0] : String(rawField[0] ?? '')",
    '    const rawId = rawField.length > 1 ? rawField[1] : null',
    '    let id: string | null = null',
    "    if (typeof rawId === 'string') {",
    "      id = fieldName === 'VARIABLE' || fieldName === 'LIST' ? remapAssetId(rawId) : rawId",
    '    }',
    '    fields[fieldName] = [value, id]',
    '  }',
    '',
    '  const inputs: Record<string, Input> = {}',
    '  for (const [inputName, rawInput] of Object.entries(raw.inputs ?? {})) {',
    '    if (!Array.isArray(rawInput)) {',
    '      continue',
    '    }',
    '    inputs[inputName] = rawInput as Input',
    '  }',
    '',
    '  return {',
    '    opcode: raw.opcode,',
    '    inputs,',
    '    fields,',
    '    shadow: Boolean(raw.shadow),',
    '    topLevel: Boolean(raw.topLevel),',
    "    x: typeof raw.x === 'number' ? raw.x : 0,",
    "    y: typeof raw.y === 'number' ? raw.y : 0,",
    "    next: typeof raw.next === 'string' ? raw.next : null,",
    '    mutation: raw.mutation,',
    '  }',
    '}',
    '',
    'const __restoreScratchBlocks = (',
    '  rawBlocks: Record<string, __ScratchBlockEntry>,',
    '  remapAssetId: (id: string) => string,',
    '): void => {',
    '  const emitted = new Map<string, { id: string }>()',
    '  const visiting = new Set<string>()',
    '  const emittedStack = new Set<string>()',
    '',
    '  const emitStack = (firstBlockId: string): void => {',
    '    let cursor: string | null = firstBlockId',
    '    const stackVisited = new Set<string>()',
    "    while (typeof cursor === 'string' && !stackVisited.has(cursor)) {",
    '      stackVisited.add(cursor)',
    '      emittedStack.add(cursor)',
    '      emitById(cursor, false)',
    '      const raw = rawBlocks[cursor]',
    '      if (!__isBlockObject(raw)) {',
    '        break',
    '      }',
    "      cursor = typeof raw.next === 'string' ? raw.next : null",
    '    }',
    '  }',
    '',
    '  const resolveInputDescriptor = (descriptor: Input[1]): Input[1] => {',
    "    if (typeof descriptor === 'string') {",
    '      return emitById(descriptor, true).id',
    '    }',
    '    if (Array.isArray(descriptor)) {',
    '      return __remapPrimitive(descriptor as __Primitive, remapAssetId) as unknown as Input[1]',
    '    }',
    '    return descriptor',
    '  }',
    '',
    '  const emitById = (blockId: string, asValue: boolean): { id: string } => {',
    '    const existing = emitted.get(blockId)',
    '    if (existing) {',
    '      return existing',
    '    }',
    '',
    '    const raw = rawBlocks[blockId]',
    '    if (!raw) {',
    "      const fallback = valueBlock('text', {",
    '        fields: { TEXT: [blockId, null] },',
    '        isShadow: true,',
    '      })',
    '      emitted.set(blockId, fallback)',
    '      return fallback',
    '    }',
    '',
    '    if (visiting.has(blockId)) {',
    "      const fallback = valueBlock('text', {",
    '        fields: { TEXT: [blockId, null] },',
    '        isShadow: true,',
    '      })',
    '      emitted.set(blockId, fallback)',
    '      return fallback',
    '    }',
    '',
    '    visiting.add(blockId)',
    '    const normalized = __normalizeBlock(raw, remapAssetId, asValue)',
    '    const inputs: Record<string, Input> = {}',
    '',
    '    for (const [inputName, inputValue] of Object.entries(normalized.inputs)) {',
    '      const mode = inputValue[0] === 3 ? 3 : inputValue[0] === 2 ? 2 : 1',
    '      const first = inputValue[1]',
    '',
    "      if (inputName.startsWith('SUBSTACK') && typeof first === 'string') {",
    '        const substackId = substack(() => {',
    '          emitStack(first)',
    '        })',
    '        if (substackId) {',
    '          inputs[inputName] = [Shadow.NoShadow, substackId]',
    '        }',
    '        continue',
    '      }',
    '',
    '      const firstResolved = resolveInputDescriptor(first)',
    '      if (mode === 3) {',
    '        const rawThird = inputValue[2]',
    '        if (rawThird !== undefined) {',
    '          const thirdResolved = resolveInputDescriptor(rawThird)',
    '          inputs[inputName] = [3, firstResolved, thirdResolved]',
    '        } else {',
    '          inputs[inputName] = [2, firstResolved]',
    '        }',
    '      } else {',
    '        inputs[inputName] = [mode, firstResolved]',
    '      }',
    '    }',
    '',
    '    const init: {',
    '      inputs?: Record<string, Input>',
    '      fields?: Record<string, Fields>',
    '      topLevel?: boolean',
    "      mutation?: Block['mutation']",
    '      isShadow?: boolean',
    '    } = {}',
    '',
    '    if (Object.keys(inputs).length > 0) {',
    '      init.inputs = inputs',
    '    }',
    '    if (Object.keys(normalized.fields).length > 0) {',
    '      init.fields = normalized.fields',
    '    }',
    '    if (normalized.topLevel) {',
    '      init.topLevel = true',
    '    }',
    '    if (normalized.mutation) {',
    '      init.mutation = normalized.mutation',
    '    }',
    '    if (normalized.shadow) {',
    '      init.isShadow = true',
    '    }',
    '',
    '    const useValueBlock = asValue && !normalized.topLevel',
    '    const created = useValueBlock',
    '      ? valueBlock(normalized.opcode, init)',
    '      : block(normalized.opcode, init)',
    '',
    '    emitted.set(blockId, created)',
    '    visiting.delete(blockId)',
    '    return created',
    '  }',
    '',
    '  const getPosition = (blockId: string): [number, number] => {',
    '    const raw = rawBlocks[blockId]',
    '    if (__isBlockObject(raw)) {',
    "      return [typeof raw.x === 'number' ? raw.x : 0, typeof raw.y === 'number' ? raw.y : 0]",
    '    }',
    '    if (__isTopLevelPrimitive(raw)) {',
    "      const x = typeof raw[3] === 'number' ? raw[3] : 0",
    "      const y = typeof raw[4] === 'number' ? raw[4] : 0",
    '      return [x, y]',
    '    }',
    '    return [0, 0]',
    '  }',
    '',
    '  const topLevelIds = Object.keys(rawBlocks)',
    '    .filter((blockId) => {',
    '      const raw = rawBlocks[blockId]',
    '      return (__isBlockObject(raw) && raw.topLevel === true) || __isTopLevelPrimitive(raw)',
    '    })',
    '    .sort((a, b) => {',
    '      const [ax, ay] = getPosition(a)',
    '      const [bx, by] = getPosition(b)',
    '      if (ay !== by) {',
    '        return ay - by',
    '      }',
    '      return ax - bx',
    '    })',
    '',
    '  for (const topLevelId of topLevelIds) {',
    '    if (emitted.has(topLevelId) || emittedStack.has(topLevelId)) {',
    '      continue',
    '    }',
    '    const raw = rawBlocks[topLevelId]',
    '    if (__isTopLevelPrimitive(raw)) {',
    '      emitById(topLevelId, false)',
    '      continue',
    '    }',
    '    emitStack(topLevelId)',
    '  }',
    '',
    '  for (const [blockId, raw] of Object.entries(rawBlocks)) {',
    '    if (emitted.has(blockId) || emittedStack.has(blockId)) {',
    '      continue',
    '    }',
    '    if (__isBlockObject(raw) && raw.parent == null) {',
    '      emitStack(blockId)',
    '      continue',
    '    }',
    '    if (__isTopLevelPrimitive(raw)) {',
    '      emitById(blockId, false)',
    '    }',
    '  }',
    '}',
    '',
    'const project = new Project()',
  ].join('\n')
}

export const reverse = (project: ScratchProject): ReverseResult => {
  const monitors = toReverseMonitors(project)
  const targetCodes: Record<string, string> = {}
  const usedKeys = new Set<string>()

  for (
    let targetIndex = 0;
    targetIndex < project.targets.length;
    targetIndex++
  ) {
    const target = project.targets[targetIndex]
    if (!target) {
      continue
    }

    const targetVar = `__target${targetIndex}`
    const assetMapVar = `__assetMap${targetIndex}`
    const lines: string[] = []

    if (target.isStage) {
      lines.push(`const ${targetVar} = project.stage`)
    } else {
      lines.push(
        `const ${targetVar} = project.createSprite(${toCodeLiteral(target.name)})`,
      )
    }

    lines.push(`${targetVar}.currentCostume = ${target.currentCostume}`)
    lines.push(`const ${assetMapVar} = new Map<string, string>()`)

    for (let i = 0; i < target.costumes.length; i += 1) {
      const costume = target.costumes[i]
      if (!costume) {
        continue
      }
      lines.push(`${targetVar}.addCostume(${toCodeLiteral(costume)})`)
    }

    for (let i = 0; i < target.sounds.length; i += 1) {
      const sound = target.sounds[i]
      if (!sound) {
        continue
      }
      lines.push(`${targetVar}.addSound(${toCodeLiteral(sound)})`)
    }

    const variableEntries = Object.entries(target.variables)
    for (let i = 0; i < variableEntries.length; i += 1) {
      const [oldId, variable] = variableEntries[i] ?? []
      if (!oldId || !variable) {
        continue
      }

      const variableVar = `__variable${targetIndex}_${i}`
      const variableName = variable[0]
      const defaultValue = variable[1]
      const isCloudVariable = variable[2] === true
      const options = buildVariableOptions(
        monitors.variable.get(oldId),
        isCloudVariable,
      )

      if (options) {
        lines.push(
          `const ${variableVar} = ${targetVar}.createVariable(${toCodeLiteral(variableName)}, ${toCodeLiteral(defaultValue)}, ${toCodeLiteral(options)})`,
        )
      } else {
        lines.push(
          `const ${variableVar} = ${targetVar}.createVariable(${toCodeLiteral(variableName)}, ${toCodeLiteral(defaultValue)})`,
        )
      }
      lines.push(
        `${assetMapVar}.set(${toCodeLiteral(oldId)}, ${variableVar}.id)`,
      )
    }

    const listEntries = Object.entries(target.lists)
    for (let i = 0; i < listEntries.length; i += 1) {
      const [oldId, list] = listEntries[i] ?? []
      if (!oldId || !list) {
        continue
      }

      const listVar = `__list${targetIndex}_${i}`
      const listName = list[0]
      const defaultValue = list[1]
      const options = buildListOptions(monitors.list.get(oldId))

      if (options) {
        lines.push(
          `const ${listVar} = ${targetVar}.createList(${toCodeLiteral(listName)}, ${toCodeLiteral(defaultValue)}, ${toCodeLiteral(options)})`,
        )
      } else {
        lines.push(
          `const ${listVar} = ${targetVar}.createList(${toCodeLiteral(listName)}, ${toCodeLiteral(defaultValue)})`,
        )
      }
      lines.push(`${assetMapVar}.set(${toCodeLiteral(oldId)}, ${listVar}.id)`)
    }

    if (Object.keys(target.blocks).length > 0) {
      lines.push(`${targetVar}.run(() => {`)
      lines.push(
        `  __restoreScratchBlocks(${toCodeLiteral(target.blocks)}, (id) => ${assetMapVar}.get(id) ?? id)`,
      )
      lines.push('})')
    }

    const patchObject = makePatchObject(target)
    if (Object.keys(patchObject).length > 0) {
      const patchVar = `__targetPatch${targetIndex}`
      lines.push('')
      lines.push(
        '// Optional patch data for fields that Project/Target does not expose directly.',
      )
      lines.push(`const ${patchVar} = ${toCodeLiteral(patchObject)}`)
      lines.push(
        `// apply after toScratch(): Object.assign(project.toScratch().targets[${targetIndex}], ${patchVar})`,
      )
    }

    const key = makeUniqueKey(target.name, usedKeys, `target-${targetIndex}`)
    targetCodes[key] = lines.join('\n')
  }

  return {
    imports: buildImportsCode(),
    targetCodes,
  }
}
