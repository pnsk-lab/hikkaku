import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

type BlockDoc = {
  name: string
  signature: string
  summary: string
  input?: string
  output?: string
  returns?: string
  params: { name: string; type?: string; description?: string }[]
  example?: string
}

type ExtractedEntry = {
  comment: string
  name: string
  declaration: string
}

type TargetName = 'docs' | 'skill'

type TargetConfig = {
  name: TargetName
  outputRoot: string
  categoryLink: (category: string) => string
}

const blockConfigs = [
  { file: 'control', title: 'Blocks - Control', heading: 'Control Blocks' },
  { file: 'data', title: 'Blocks - Data', heading: 'Variables & Lists' },
  { file: 'events', title: 'Blocks - Events', heading: 'Events' },
  { file: 'looks', title: 'Blocks - Looks', heading: 'Appearance' },
  { file: 'motion', title: 'Blocks - Motion', heading: 'Motion' },
  { file: 'operator', title: 'Blocks - Operators', heading: 'Operators' },
  { file: 'pen', title: 'Blocks - Pen', heading: 'Pen' },
  {
    file: 'procedures',
    title: 'Blocks - Procedures',
    heading: 'Custom Blocks',
  },
  { file: 'sensing', title: 'Blocks - Sensing', heading: 'Sensing' },
  { file: 'sound', title: 'Blocks - Sound', heading: 'Sound' },
] as const

const blockCategories = [
  'control',
  'data',
  'events',
  'looks',
  'motion',
  'operator',
  'procedures',
  'sensing',
  'sound',
  'pen',
] as const

const projectRoot = fileURLToPath(new URL('../../..', import.meta.url))
const blocksRoot = resolve(projectRoot, 'packages/hikkaku/src/blocks')

const targetConfigs: Record<TargetName, TargetConfig> = {
  docs: {
    name: 'docs',
    outputRoot: resolve(projectRoot, 'docs/reference/blocks'),
    categoryLink: (category) => `/reference/blocks/${category}`,
  },
  skill: {
    name: 'skill',
    outputRoot: resolve(projectRoot, 'packages/skill/hikkaku/rules/blocks'),
    categoryLink: (category) => `rules/blocks/${category}.md`,
  },
}

const normalize = (value: string) => value.replaceAll('\r\n', '\n')
const collapseWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim()

const cleanCommentLine = (line: string) => {
  const trimmed = line.trim()
  if (trimmed === '/**' || trimmed === '*/') {
    return ''
  }
  return line.replace(/^\s*\*\s?/, '').trimEnd()
}

const splitTopLevel = (input: string) => {
  const result: string[] = []
  let current = ''
  let paren = 0
  let bracket = 0
  let brace = 0
  let angle = 0
  let quote: '"' | "'" | '`' | null = null
  let escaped = false

  for (const ch of input) {
    if (quote) {
      current += ch
      if (escaped) {
        escaped = false
        continue
      }
      if (ch === '\\') {
        escaped = true
        continue
      }
      if (ch === quote) {
        quote = null
      }
      continue
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch
      current += ch
      continue
    }

    if (ch === '(') paren++
    else if (ch === ')') paren--
    else if (ch === '[') bracket++
    else if (ch === ']') bracket--
    else if (ch === '{') brace++
    else if (ch === '}') brace--
    else if (ch === '<') angle++
    else if (ch === '>') angle = Math.max(0, angle - 1)

    if (
      ch === ',' &&
      paren === 0 &&
      bracket === 0 &&
      brace === 0 &&
      angle === 0
    ) {
      if (current.trim()) result.push(current.trim())
      current = ''
      continue
    }

    current += ch
  }

  if (current.trim()) result.push(current.trim())
  return result
}

const hasTopLevelArrow = (input: string) => {
  let paren = 0
  let bracket = 0
  let brace = 0
  let angle = 0
  let quote: '"' | "'" | '`' | null = null
  let escaped = false

  for (let i = 0; i < input.length; i++) {
    const ch = input[i]
    if (quote) {
      if (escaped) {
        escaped = false
      } else if (ch === '\\') {
        escaped = true
      } else if (ch === quote) {
        quote = null
      }
      continue
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch
      continue
    }

    if (ch === '(') paren++
    else if (ch === ')') paren--
    else if (ch === '[') bracket++
    else if (ch === ']') bracket--
    else if (ch === '{') brace++
    else if (ch === '}') brace--
    else if (ch === '<') angle++
    else if (ch === '>') angle = Math.max(0, angle - 1)

    if (
      ch === '=' &&
      input[i + 1] === '>' &&
      paren === 0 &&
      bracket === 0 &&
      brace === 0 &&
      angle === 0
    ) {
      return true
    }
  }

  return false
}

type ParsedParam = { name: string; type?: string }

const parseParamSegment = (segment: string): ParsedParam | null => {
  const match = segment.match(
    /^(?:\.\.\.)?([A-Za-z_][A-Za-z0-9_]*)(?:\?)?\s*(?::\s*([\s\S]+))?$/,
  )
  if (!match) return null

  const name = match[1]
  if (!name) return null

  return {
    name,
    type: match[2] ? collapseWhitespace(match[2]) : undefined,
  }
}

const parseParamsFromDeclaration = (
  declaration: string,
): { signature: string; params: ParsedParam[] } => {
  const equalIndex = declaration.indexOf('=')
  if (equalIndex === -1) {
    return { signature: '', params: [] }
  }

  const paramStart = declaration.indexOf('(', equalIndex)
  if (paramStart === -1) {
    return { signature: '', params: [] }
  }

  let depth = 1
  let paramEnd = -1
  let quote: '"' | "'" | '`' | null = null
  let escaped = false

  for (let i = paramStart + 1; i < declaration.length; i++) {
    const ch = declaration[i]
    if (quote) {
      if (escaped) {
        escaped = false
      } else if (ch === '\\') {
        escaped = true
      } else if (ch === quote) {
        quote = null
      }
      continue
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch
      continue
    }

    if (ch === '(') depth++
    else if (ch === ')') {
      depth--
      if (depth === 0) {
        paramEnd = i
        break
      }
    }
  }

  if (paramEnd === -1) {
    return { signature: '', params: [] }
  }

  const paramText = declaration.slice(paramStart + 1, paramEnd)
  const segments = splitTopLevel(paramText)

  const params = segments
    .map(parseParamSegment)
    .filter((value): value is ParsedParam => value !== null)

  return {
    signature: params.map((param) => param.name).join(', '),
    params,
  }
}

const extractEntries = (source: string): ExtractedEntry[] => {
  const lines = normalize(source).split('\n')
  const entries: ExtractedEntry[] = []

  for (let i = 0; i < lines.length; i++) {
    if (!lines[i]?.trim().startsWith('/**')) continue

    const commentLines: string[] = []
    let commentEnd = i
    for (; commentEnd < lines.length; commentEnd++) {
      commentLines.push(lines[commentEnd] ?? '')
      if ((lines[commentEnd] ?? '').includes('*/')) break
    }

    let exportLine = commentEnd + 1
    while (exportLine < lines.length && !(lines[exportLine] ?? '').trim()) {
      exportLine++
    }

    const start = lines[exportLine] ?? ''
    const match = start.match(/^export const\s+([A-Za-z0-9_]+)\s*=\s*(.*)$/)
    if (!match) {
      i = commentEnd
      continue
    }

    const name = match[1]
    if (!name) {
      i = commentEnd
      continue
    }
    const declarationLines = [start]

    if (!hasTopLevelArrow(start)) {
      let j = exportLine + 1
      for (; j < lines.length; j++) {
        declarationLines.push(lines[j] ?? '')
        if (hasTopLevelArrow(declarationLines.join('\n'))) break
        if ((lines[j] ?? '').startsWith('export const ')) break
      }
    }

    entries.push({
      comment: commentLines.join('\n'),
      name,
      declaration: declarationLines.join('\n'),
    })

    i = exportLine
  }

  return entries
}

const parseDoc = (entry: ExtractedEntry): BlockDoc => {
  const lines = normalize(entry.comment).split('\n').map(cleanCommentLine)

  const { signature, params: signatureParams } = parseParamsFromDeclaration(
    entry.declaration,
  )

  let summary = ''
  let input: string | undefined
  let output: string | undefined
  let returns: string | undefined
  let example: string | undefined

  const paramMap = new Map<string, { type?: string; description?: string }>()
  for (const param of signatureParams) {
    paramMap.set(param.name, { type: param.type })
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]?.trim() ?? ''
    if (!line) continue

    if (
      !summary &&
      !line.startsWith('@') &&
      !line.startsWith('Input:') &&
      !line.startsWith('Output:')
    ) {
      summary = line
      continue
    }

    if (line.startsWith('Input:')) {
      input = line.slice('Input:'.length).trim().replace(/\.$/, '')
      continue
    }

    if (line.startsWith('Output:')) {
      output = line.slice('Output:'.length).trim().replace(/\.$/, '')
      continue
    }

    if (line.startsWith('@param ')) {
      const content = line.slice('@param '.length).trim()
      const [paramName, ...rest] = content.split(' ')
      const detail = rest.join(' ').trim()
      if (!paramName) continue

      const existing = paramMap.get(paramName) ?? {}
      const typed = detail.match(/^([^.]*)\.\s*(.*)$/)
      if (typed) {
        const parsedType = typed[1]?.trim()
        const parsedDesc = typed[2]?.trim()
        paramMap.set(paramName, {
          type: parsedType || existing.type,
          description: parsedDesc || existing.description,
        })
      } else {
        const sameAsType = existing.type && detail === existing.type
        paramMap.set(paramName, {
          type: existing.type,
          description: sameAsType
            ? existing.description
            : detail || existing.description,
        })
      }
      continue
    }

    if (line.startsWith('@returns ')) {
      returns = line.slice('@returns '.length).trim().replace(/\.$/, '')
      continue
    }

    if (line === '@example') {
      const codeLines: string[] = []
      let inCode = false
      for (let j = i + 1; j < lines.length; j++) {
        const candidate = lines[j]?.trim() ?? ''
        if (candidate.startsWith('```')) {
          if (!inCode) {
            inCode = true
            continue
          }
          break
        }
        if (inCode) {
          codeLines.push(candidate)
        }
      }
      if (codeLines.length > 0) {
        example = codeLines.join('\n').trimEnd()
      }
    }
  }

  const params = Array.from(paramMap.entries()).map(([name, meta]) => ({
    name,
    type: meta.type,
    description: meta.description,
  }))

  return {
    name: entry.name,
    signature,
    summary: summary || `${entry.name} helper.`,
    input,
    output,
    returns,
    params,
    example,
  }
}

const buildGeneratedNote = () => [
  '<!-- AUTO-GENERATED FILE. Do not edit manually.',
  'Edit packages/hikkaku/src/blocks and packages/skill/scripts/build-blocks.ts instead. -->',
  '',
]

const buildMarkdown = (
  title: string,
  heading: string,
  docs: BlockDoc[],
): string => {
  const lines: string[] = []

  lines.push('---')
  lines.push(`title: ${title}`)
  lines.push('impact: HIGH')
  lines.push('---')
  lines.push('')
  lines.push(...buildGeneratedNote())
  lines.push(`# ${heading}`)
  lines.push('')

  for (const doc of docs) {
    lines.push(`## ${doc.name}(${doc.signature})`)
    lines.push('')
    lines.push(doc.summary)
    lines.push('')

    if (doc.input) {
      lines.push(`Input: ${doc.input}.`)
      lines.push('')
    }

    if (doc.output) {
      lines.push(`Output: ${doc.output}.`)
      lines.push('')
    } else if (doc.returns) {
      lines.push(`Output: ${doc.returns}.`)
      lines.push('')
    }

    for (const param of doc.params) {
      const type = param.type ?? 'unknown'
      const detail = param.description ? ` - ${param.description}` : ''
      lines.push(`* \`${param.name}: ${type}\`${detail}`)
    }

    if (doc.params.length > 0) {
      lines.push('')
    }

    if (doc.example) {
      lines.push('Example:')
      lines.push('```ts')
      lines.push(doc.example)
      lines.push('```')
      lines.push('')
    }
  }

  return `${lines.join('\n').trimEnd()}\n`
}

const buildOverviewMarkdown = (target: TargetConfig): string => {
  const lines: string[] = []

  lines.push('---')
  lines.push('title: Blocks Overview')
  lines.push('impact: HIGH')
  lines.push('---')
  lines.push('')
  lines.push(...buildGeneratedNote())
  lines.push('# List of Available Blocks')
  lines.push('')
  lines.push(
    'This document explains the function names, arguments, and behavior of exported helpers.',
  )
  lines.push('Each function maps closely to a Scratch 3.0 block.')
  lines.push('')
  lines.push('Example:')
  lines.push('')
  lines.push('```ts')
  lines.push("import { add, gotoXY } from 'hikkaku/blocks'")
  lines.push('```')
  lines.push('')
  lines.push('## Common Concepts')
  lines.push('')
  lines.push(
    '- `PrimitiveSource<T>`: literal values, variable reporters, or value blocks',
  )
  lines.push('- `block(...)`: creates a statement block')
  lines.push('- `valueBlock(...)`: creates a reporter block')
  lines.push(
    '- `substack(handler)`: captures nested block stacks for C-shaped blocks',
  )
  lines.push('')
  lines.push('## Block Categories')
  lines.push('')

  for (const category of blockCategories) {
    const title = category[0]?.toUpperCase() + category.slice(1)
    lines.push(`- [${title}](${target.categoryLink(category)})`)
  }

  return `${lines.join('\n').trimEnd()}\n`
}

const parseArgs = () => {
  let target: 'all' | TargetName = 'all'
  let check = false

  for (const arg of process.argv.slice(2)) {
    if (arg === '--check') {
      check = true
      continue
    }
    if (arg.startsWith('--target=')) {
      const value = arg.slice('--target='.length)
      if (value === 'all' || value === 'docs' || value === 'skill') {
        target = value
        continue
      }
      throw new Error(`Invalid --target value: ${value}`)
    }
    throw new Error(`Unknown argument: ${arg}`)
  }

  return { target, check }
}

const writeOrCheck = (outputPath: string, content: string, check: boolean) => {
  const current = (() => {
    try {
      return readFileSync(outputPath, 'utf8')
    } catch {
      return ''
    }
  })()

  if (current === content) {
    return { changed: false }
  }

  if (check) {
    return { changed: true }
  }

  mkdirSync(dirname(outputPath), { recursive: true })
  writeFileSync(outputPath, content, 'utf8')
  return { changed: true }
}

const buildCategoryForTarget = (
  target: TargetConfig,
  config: (typeof blockConfigs)[number],
  options: { check: boolean },
) => {
  const sourcePath = resolve(blocksRoot, `${config.file}.ts`)
  const outputPath = resolve(target.outputRoot, `${config.file}.md`)
  const source = readFileSync(sourcePath, 'utf8')

  const entries = extractEntries(source)
  const docs = entries.map(parseDoc)
  const markdown = buildMarkdown(config.title, config.heading, docs)
  const result = writeOrCheck(outputPath, markdown, options.check)

  return { outputPath, count: docs.length, changed: result.changed }
}

const buildOverviewForTarget = (
  target: TargetConfig,
  options: { check: boolean },
) => {
  const outputPath = resolve(target.outputRoot, 'overview.md')
  const markdown = buildOverviewMarkdown(target)
  const result = writeOrCheck(outputPath, markdown, options.check)
  return { outputPath, changed: result.changed }
}

const run = () => {
  const args = parseArgs()
  const targets: TargetConfig[] =
    args.target === 'all'
      ? Object.values(targetConfigs)
      : [targetConfigs[args.target]]

  let changedCount = 0

  for (const target of targets) {
    for (const config of blockConfigs) {
      const result = buildCategoryForTarget(target, config, {
        check: args.check,
      })
      if (result.changed) changedCount++
      console.log(
        `${args.check ? 'checked' : 'updated'}: ${result.outputPath} (${result.count} entries)${
          result.changed ? ' *changed' : ''
        }`,
      )
    }

    const overviewResult = buildOverviewForTarget(target, { check: args.check })
    if (overviewResult.changed) changedCount++
    console.log(
      `${args.check ? 'checked' : 'updated'}: ${overviewResult.outputPath}${
        overviewResult.changed ? ' *changed' : ''
      }`,
    )
  }

  if (args.check && changedCount > 0) {
    throw new Error(
      `Generated block references are out of date (${changedCount} files)`,
    )
  }
}

run()
