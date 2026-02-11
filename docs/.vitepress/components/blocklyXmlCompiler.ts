export type PrimitiveValue = string | number | boolean
export type BlockInputRelation = 1 | 2 | 3
export type PrimitiveShape =
  | [4, PrimitiveValue]
  | [5, PrimitiveValue]
  | [6, PrimitiveValue]
  | [7, PrimitiveValue]
  | [8, PrimitiveValue]
  | [9, string]
  | [10, PrimitiveValue]
  | [11, string, string?]
  | [12, string, string, number?, number?]
  | [13, string, string, number?, number?]

export type InputLink = string | PrimitiveShape
export type PackedInput = [BlockInputRelation, InputLink, InputLink?]

export type PackedMutation = {
  tagName: string
  children?: PackedMutation[]
  [key: string]: unknown
}

export type PackedFieldArray = [PrimitiveValue, string?]
export type PackedFieldObject = {
  value: PrimitiveValue
  id?: string
  variableType?: string
}
export type PackedField = PackedFieldArray | PackedFieldObject

export type PackedBlock = {
  opcode: string
  inputs: Record<string, PackedInput>
  fields: Record<string, PackedField>
  shadow: boolean
  topLevel: boolean
  x?: number
  y?: number
  next: string | null
  parent: string | null
  mutation?: PackedMutation
}

export type PackedBlockMap = Record<string, PackedBlock>

type XmlLikeNode = {
  tagName: string
  attributes: NamedNodeMap
  childNodes: NodeListOf<ChildNode>
  getAttribute: (name: string) => string | null
}

type XmlTreeNode = {
  tag: string
  attrs?: Record<string, string>
  children?: Array<XmlTreeNode | string>
}

type BuilderState = {
  blocks: PackedBlockMap
  primitiveSerial: number
  walkPath: Set<string>
}

type PrimitiveTypeCode = PrimitiveShape[0]
type PrimitiveDefinition = {
  opcode: string
  fieldName: string
  variableType?: string
}

const primitiveDefinitions: Record<PrimitiveTypeCode, PrimitiveDefinition> = {
  4: { opcode: 'math_number', fieldName: 'NUM' },
  5: { opcode: 'math_positive_number', fieldName: 'NUM' },
  6: { opcode: 'math_whole_number', fieldName: 'NUM' },
  7: { opcode: 'math_integer', fieldName: 'NUM' },
  8: { opcode: 'math_angle', fieldName: 'NUM' },
  9: { opcode: 'colour_picker', fieldName: 'COLOUR' },
  10: { opcode: 'text', fieldName: 'TEXT' },
  11: {
    opcode: 'event_broadcast_menu',
    fieldName: 'BROADCAST_OPTION',
    variableType: 'broadcast_msg',
  },
  12: {
    opcode: 'data_variable',
    fieldName: 'VARIABLE',
    variableType: '',
  },
  13: {
    opcode: 'data_listcontents',
    fieldName: 'LIST',
    variableType: 'list',
  },
}

const escapeXmlText = (value: PrimitiveValue | string) =>
  String(value).replace(/[<>&'"]/g, (char) => {
    switch (char) {
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '&':
        return '&amp;'
      case "'":
        return '&apos;'
      case '"':
        return '&quot;'
      default:
        return char
    }
  })

const createTreeNode = (
  tag: string,
  attrs: Record<string, string> = {},
  children: Array<XmlTreeNode | string> = [],
): XmlTreeNode => ({
  tag,
  attrs,
  children,
})

const serializeTree = (node: XmlTreeNode): string => {
  const attrs = Object.entries(node.attrs ?? {})
    .map(([key, value]) => ` ${key}="${escapeXmlText(value)}"`)
    .join('')
  const children = (node.children ?? [])
    .map((child) =>
      typeof child === 'string' ? escapeXmlText(child) : serializeTree(child),
    )
    .join('')
  return `<${node.tag}${attrs}>${children}</${node.tag}>`
}

const unpackField = (source: PackedField): PackedFieldObject =>
  Array.isArray(source) ? { value: source[0], id: source[1] } : source

const descriptorEquals = (
  a: InputLink | undefined,
  b: InputLink | undefined,
) => {
  if (a === undefined || b === undefined) return false
  return JSON.stringify(a) === JSON.stringify(b)
}

const appendMutationBranch = (mutation: PackedMutation): XmlTreeNode => {
  const attrs: Record<string, string> = {}

  for (const [key, raw] of Object.entries(mutation)) {
    if (key === 'tagName' || key === 'children') continue
    if (key === 'blockInfo') {
      attrs[key] = JSON.stringify(raw)
      continue
    }
    attrs[key] = typeof raw === 'string' ? raw : JSON.stringify(raw ?? '')
  }

  return createTreeNode(
    mutation.tagName,
    attrs,
    (mutation.children ?? []).map((child) => appendMutationBranch(child)),
  )
}

const isStatementInputName = (inputName: string) =>
  /^SUBSTACK\d*$/.test(inputName)

const createPrimitiveBlockNode = (
  ownerId: string,
  inputName: string,
  shape: PrimitiveShape,
  useShadowTag: boolean,
  state: BuilderState,
): XmlTreeNode | null => {
  const primitiveType = shape[0]
  const definition = primitiveDefinitions[primitiveType]
  if (!definition) return null

  state.primitiveSerial += 1
  const attrs: Record<string, string> = {
    id: `p_${ownerId}_${inputName}_${state.primitiveSerial}`,
    type: definition.opcode,
  }

  if (
    (primitiveType === 12 || primitiveType === 13) &&
    typeof shape[3] === 'number' &&
    typeof shape[4] === 'number'
  ) {
    attrs.x = String(shape[3])
    attrs.y = String(shape[4])
  }

  const fieldAttrs: Record<string, string> = { name: definition.fieldName }
  if (typeof shape[2] === 'string') {
    fieldAttrs.id = shape[2]
  }
  if (typeof definition.variableType === 'string') {
    fieldAttrs.variabletype = definition.variableType
  }

  const field = createTreeNode('field', fieldAttrs, [String(shape[1])])
  return createTreeNode(useShadowTag ? 'shadow' : 'block', attrs, [field])
}

const buildBlockNode = (
  blockId: string,
  state: BuilderState,
  forceShadowTag = false,
): XmlTreeNode | null => {
  const source = state.blocks[blockId]
  if (!source) return null
  if (state.walkPath.has(blockId)) return null
  state.walkPath.add(blockId)

  const nodeAttrs: Record<string, string> = {
    id: blockId,
    type: source.opcode,
  }
  if (source.topLevel) {
    nodeAttrs.x = String(source.x ?? 0)
    nodeAttrs.y = String(source.y ?? 0)
  }

  const nodeChildren: Array<XmlTreeNode> = []
  if (source.mutation) {
    nodeChildren.push(appendMutationBranch(source.mutation))
  }

  for (const [fieldName, fieldSource] of Object.entries(source.fields)) {
    const field = unpackField(fieldSource)
    const fieldAttrs: Record<string, string> = { name: fieldName }
    if (typeof field.id === 'string') {
      fieldAttrs.id = field.id
    }
    if (typeof field.variableType === 'string') {
      fieldAttrs.variabletype = field.variableType
    }
    nodeChildren.push(
      createTreeNode('field', fieldAttrs, [String(field.value)]),
    )
  }

  for (const [inputName, packedInput] of Object.entries(source.inputs)) {
    const relation = packedInput[0]
    const primary = packedInput[1]
    const fallback = packedInput[2]
    const inputChildren: Array<XmlTreeNode> = []

    const attachLink = (link: InputLink, asShadow: boolean) => {
      if (Array.isArray(link)) {
        const primitiveNode = createPrimitiveBlockNode(
          blockId,
          inputName,
          link as PrimitiveShape,
          asShadow,
          state,
        )
        if (primitiveNode) inputChildren.push(primitiveNode)
        return
      }

      const childNode = buildBlockNode(link, state, asShadow)
      if (childNode) inputChildren.push(childNode)
    }

    if (relation === 1) {
      if (Array.isArray(primary)) {
        attachLink(primary, true)
      } else {
        attachLink(primary, false)
      }
    } else if (relation === 2) {
      attachLink(primary, false)
    } else if (relation === 3) {
      attachLink(primary, false)
      if (fallback && !descriptorEquals(primary, fallback)) {
        attachLink(fallback, true)
      }
    }

    if (inputChildren.length > 0) {
      nodeChildren.push(
        createTreeNode(
          isStatementInputName(inputName) ? 'statement' : 'value',
          { name: inputName },
          inputChildren,
        ),
      )
    }
  }

  if (source.next) {
    const nextNode = buildBlockNode(source.next, state, false)
    if (nextNode) {
      nodeChildren.push(createTreeNode('next', {}, [nextNode]))
    }
  }

  state.walkPath.delete(blockId)
  const tag = forceShadowTag ? 'shadow' : source.shadow ? 'shadow' : 'block'
  return createTreeNode(tag, nodeAttrs, nodeChildren)
}

export const compilePackedBlocksToXml = (blocks: PackedBlockMap): string => {
  const state: BuilderState = {
    blocks,
    primitiveSerial: 0,
    walkPath: new Set(),
  }

  const topLevelIds = Object.entries(blocks)
    .filter(([, block]) => block.topLevel)
    .sort((a, b) => {
      const ay = a[1].y ?? 0
      const by = b[1].y ?? 0
      if (ay !== by) return ay - by
      const ax = a[1].x ?? 0
      const bx = b[1].x ?? 0
      if (ax !== bx) return ax - bx
      return a[0].localeCompare(b[0])
    })
    .map(([id]) => id)

  const workspaceNode = createTreeNode('xml', {
    xmlns: 'http://www.w3.org/1999/xhtml',
  })
  workspaceNode.children = [createTreeNode('variables')]

  for (const topLevelId of topLevelIds) {
    const blockNode = buildBlockNode(topLevelId, state, false)
    if (blockNode) {
      workspaceNode.children.push(blockNode)
    }
  }

  return serializeTree(workspaceNode)
}

const readMutationFromBlockElement = (blockNode: XmlLikeNode) => {
  for (const child of Array.from(blockNode.childNodes)) {
    if (
      child.nodeType === Node.ELEMENT_NODE &&
      (child as Element).tagName.toLowerCase() === 'mutation'
    ) {
      return child as Element
    }
  }
  return null
}

export const stripUnsupportedNextNodes = (
  xmlRoot: Element,
  createProbeBlock: (opcode: string) => {
    nextConnection: unknown
    domToMutation?: (xmlElement: Element) => void
    dispose: (...args: unknown[]) => void
  },
) => {
  const blockNodes = xmlRoot.querySelectorAll('block,shadow')
  for (const node of Array.from(blockNodes)) {
    const opcode = node.getAttribute('type')
    if (!opcode) continue

    let probeBlock:
      | {
          nextConnection: unknown
          domToMutation?: (xmlElement: Element) => void
          dispose: (...args: unknown[]) => void
        }
      | undefined

    try {
      probeBlock = createProbeBlock(opcode)
      const mutation = readMutationFromBlockElement(
        node as unknown as XmlLikeNode,
      )
      if (mutation && typeof probeBlock.domToMutation === 'function') {
        probeBlock.domToMutation(mutation)
      }
      if (!probeBlock.nextConnection) {
        for (const child of Array.from(node.childNodes)) {
          if (
            child.nodeType === Node.ELEMENT_NODE &&
            (child as Element).tagName.toLowerCase() === 'next'
          ) {
            node.removeChild(child)
          }
        }
      }
    } catch {
      for (const child of Array.from(node.childNodes)) {
        if (
          child.nodeType === Node.ELEMENT_NODE &&
          (child as Element).tagName.toLowerCase() === 'next'
        ) {
          node.removeChild(child)
        }
      }
    } finally {
      if (probeBlock) {
        probeBlock.dispose(false, true)
      }
    }
  }
}
