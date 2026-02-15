import type {
  ProgramManifest,
  ProgramModule,
  ProgramPayload,
  ProgramWasmExecHost,
  ProgramWasmExecRunner,
  ProgramWasmBytes,
} from './types.ts'

const PROGRAM_MARKER = 'moonscratch_program_v1'
const WASM_PAGE_SIZE = 65536
const OPCODE_SET_VERSION = 1

const utf8Encoder = new TextEncoder()
const utf8Decoder = new TextDecoder()

const toUint8Array = (input: ProgramWasmBytes): Uint8Array => {
  return input instanceof Uint8Array ? input : new Uint8Array(input)
}

const appendNumbers = (target: number[], source: ArrayLike<number>): void => {
  for (let index = 0; index < source.length; index += 1) {
    target.push(source[index] ?? 0)
  }
}

const encodeUtf8 = (value: string): Uint8Array => utf8Encoder.encode(value)

const decodeUtf8 = (bytes: Uint8Array): string => utf8Decoder.decode(bytes)

const toArrayBuffer = (bytes: Uint8Array): ArrayBuffer => {
  const out = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(out).set(bytes)
  return out
}

const encodeU32Leb = (input: number): number[] => {
  if (!Number.isInteger(input) || input < 0) {
    throw new Error(
      `ULEB128 value must be a non-negative integer: ${String(input)}`,
    )
  }
  let value = input >>> 0
  const out: number[] = []
  do {
    let byte = value & 0x7f
    value >>>= 7
    if (value !== 0) {
      byte |= 0x80
    }
    out.push(byte)
  } while (value !== 0)
  return out
}

const encodeI32Leb = (input: number): number[] => {
  if (!Number.isInteger(input)) {
    throw new Error(`i32 value must be an integer: ${String(input)}`)
  }
  if (input < -0x8000_0000 || input > 0x7fff_ffff) {
    throw new Error(`i32 value out of range: ${String(input)}`)
  }
  let value = input | 0
  const out: number[] = []
  let done = false
  while (!done) {
    let byte = value & 0x7f
    value >>= 7
    const signBit = (byte & 0x40) !== 0
    done = (value === 0 && !signBit) || (value === -1 && signBit)
    if (!done) {
      byte |= 0x80
    }
    out.push(byte)
  }
  return out
}

const encodeName = (value: string): number[] => {
  const bytes = encodeUtf8(value)
  const out: number[] = []
  appendNumbers(out, encodeU32Leb(bytes.length))
  appendNumbers(out, bytes)
  return out
}

const encodeSection = (id: number, payload: number[]): number[] => {
  const section: number[] = [id]
  appendNumbers(section, encodeU32Leb(payload.length))
  appendNumbers(section, payload)
  return section
}

const decodeBase64 = (base64: string): Uint8Array => {
  const maybeBuffer = globalThis as {
    Buffer?: { from: (input: string, encoding: string) => Uint8Array }
  }
  if (typeof maybeBuffer.Buffer?.from === 'function') {
    return new Uint8Array(maybeBuffer.Buffer.from(base64, 'base64'))
  }

  const maybeAtob = (globalThis as { atob?: (input: string) => string }).atob
  if (typeof maybeAtob === 'function') {
    const binary = maybeAtob(base64)
    const out = new Uint8Array(binary.length)
    for (let index = 0; index < binary.length; index += 1) {
      out[index] = binary.charCodeAt(index) & 0xff
    }
    return out
  }

  throw new Error('No base64 decoder found in this runtime')
}

const readMetadataLine = (wat: string, key: string): string => {
  const pattern = new RegExp(`^\\s*;;\\s*${key}=([^\\n\\r]*)$`, 'm')
  const match = pattern.exec(wat)
  if (!match || typeof match[1] !== 'string') {
    throw new Error(`Invalid generated WAT: missing metadata "${key}"`)
  }
  return match[1].trim()
}

export const parseGeneratedProgramWatMetadata = (
  wat: string,
): {
  abiVersion: number
  projectBase64: string
  assetsBase64: string
  commandsBase64: string
} => {
  if (!new RegExp(`(^|\\n)\\s*;;\\s*${PROGRAM_MARKER}\\s*(\\n|$)`).test(wat)) {
    throw new Error(
      'Unsupported WAT input: expected moonscratch generated metadata header',
    )
  }
  const abiVersionRaw = readMetadataLine(wat, 'abi_version')
  const abiVersion = Number.parseInt(abiVersionRaw, 10)
  if (!Number.isInteger(abiVersion) || abiVersion <= 0) {
    throw new Error(
      `Invalid generated WAT metadata: abi_version=${abiVersionRaw}`,
    )
  }
  return {
    abiVersion,
    projectBase64: readMetadataLine(wat, 'project_base64'),
    assetsBase64: readMetadataLine(wat, 'assets_base64'),
    commandsBase64: readMetadataLine(wat, 'commands_base64'),
  }
}

type RunnerNumExpr =
  | {
      kind: 'num'
      value: number
    }
  | {
      kind: 'var_num'
      target: number
      variableId: string
    }
  | {
      kind: 'bin_num'
      op: 'add' | 'sub' | 'mul' | 'div' | 'mod'
      left: RunnerNumExpr
      right: RunnerNumExpr
    }
  | {
      kind: 'unary_num'
      op: 'round'
      value: RunnerNumExpr
    }

type RunnerBoolExpr =
  | {
      kind: 'bool'
      value: boolean
    }
  | {
      kind: 'cmp_num'
      op: 'lt' | 'gt' | 'eq' | 'ne'
      left: RunnerNumExpr
      right: RunnerNumExpr
    }
  | {
      kind: 'bin_bool'
      op: 'and' | 'or'
      left: RunnerBoolExpr
      right: RunnerBoolExpr
    }
  | {
      kind: 'not'
      value: RunnerBoolExpr
    }

type RunnerCommand =
  | {
      kind: 'set_num_expr'
      target: number
      variableId: string
      expr: RunnerNumExpr
    }
  | {
      kind: 'set_json_const'
      target: number
      variableId: string
      valueJson: string
    }
  | {
      kind: 'change_num_expr'
      target: number
      variableId: string
      expr: RunnerNumExpr
    }
  | {
      kind: 'if'
      cond: RunnerBoolExpr
      thenCommands: RunnerCommand[]
    }
  | {
      kind: 'if_else'
      cond: RunnerBoolExpr
      thenCommands: RunnerCommand[]
      elseCommands: RunnerCommand[]
    }
  | {
      kind: 'repeat'
      times: RunnerNumExpr
      body: RunnerCommand[]
    }
  | {
      kind: 'repeat_until'
      cond: RunnerBoolExpr
      body: RunnerCommand[]
    }
  | {
      kind: 'while'
      cond: RunnerBoolExpr
      body: RunnerCommand[]
    }
  | {
      kind: 'host_opcode'
      target: number
      pc: number
    }
  | {
      kind: 'host_tail'
      target: number
      startPc: number
    }

type RunnerLiteralRef = {
  ptr: number
  len: number
}

const IMPORT_GET_VAR_NUM_INDEX = 0
const IMPORT_SET_VAR_NUM_INDEX = 1
const IMPORT_SET_VAR_JSON_INDEX = 2
const IMPORT_MOD_INDEX = 3
const IMPORT_EXEC_OPCODE_INDEX = 4
const IMPORT_EXEC_TAIL_INDEX = 5
const LOOP_COUNTER_LOCAL = 0
const LOOP_GUARD_LOCAL = 1
const LOOP_GUARD_MAX = 10000

const encodeF64Immediate = (input: number): number[] => {
  if (!Number.isFinite(input)) {
    throw new Error(`f64 constant must be finite: ${String(input)}`)
  }
  const buffer = new ArrayBuffer(8)
  new DataView(buffer).setFloat64(0, input, true)
  return Array.from(new Uint8Array(buffer))
}

const pushI32Const = (target: number[], input: number): void => {
  target.push(0x41)
  appendNumbers(target, encodeI32Leb(input))
}

const pushF64Const = (target: number[], input: number): void => {
  target.push(0x44)
  appendNumbers(target, encodeF64Immediate(input))
}

const pushCall = (target: number[], functionIndex: number): void => {
  target.push(0x10)
  appendNumbers(target, encodeU32Leb(functionIndex))
}

const pushLocalGet = (target: number[], localIndex: number): void => {
  target.push(0x20)
  appendNumbers(target, encodeU32Leb(localIndex))
}

const pushLocalSet = (target: number[], localIndex: number): void => {
  target.push(0x21)
  appendNumbers(target, encodeU32Leb(localIndex))
}

const pushBr = (target: number[], depth: number): void => {
  target.push(0x0c)
  appendNumbers(target, encodeU32Leb(depth))
}

const pushBrIf = (target: number[], depth: number): void => {
  target.push(0x0d)
  appendNumbers(target, encodeU32Leb(depth))
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

const toFiniteNumber = (value: unknown): number | null => {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

const toNonNegativeInt = (input: unknown): number | null => {
  if (typeof input !== 'number' || !Number.isFinite(input)) {
    return null
  }
  const out = Math.trunc(input)
  return out >= 0 ? out : null
}

const parseRunnerNumExpr = (
  raw: unknown,
  depth = 0,
): RunnerNumExpr | null => {
  if (depth > 64 || !isRecord(raw)) {
    return null
  }
  const kind = raw.kind
  if (kind === 'num') {
    const value = toFiniteNumber(raw.value)
    return value === null ? null : { kind: 'num', value }
  }
  if (kind === 'var_num') {
    const target = toNonNegativeInt(raw.target)
    const variableId = typeof raw.id === 'string' ? raw.id : ''
    if (target === null || variableId.length === 0) {
      return null
    }
    return { kind: 'var_num', target, variableId }
  }
  if (kind === 'bin_num') {
    const op = raw.op
    if (
      op !== 'add' &&
      op !== 'sub' &&
      op !== 'mul' &&
      op !== 'div' &&
      op !== 'mod'
    ) {
      return null
    }
    const left = parseRunnerNumExpr(raw.left, depth + 1)
    const right = parseRunnerNumExpr(raw.right, depth + 1)
    if (!left || !right) {
      return null
    }
    return { kind: 'bin_num', op, left, right }
  }
  if (kind === 'unary_num') {
    const op = raw.op
    if (op !== 'round') {
      return null
    }
    const value = parseRunnerNumExpr(raw.value, depth + 1)
    if (!value) {
      return null
    }
    return { kind: 'unary_num', op, value }
  }
  return null
}

const parseRunnerBoolExpr = (
  raw: unknown,
  depth = 0,
): RunnerBoolExpr | null => {
  if (depth > 64 || !isRecord(raw)) {
    return null
  }
  const kind = raw.kind
  if (kind === 'bool') {
    if (typeof raw.value !== 'boolean') {
      return null
    }
    return { kind: 'bool', value: raw.value }
  }
  if (kind === 'cmp_num') {
    const op = raw.op
    if (op !== 'lt' && op !== 'gt' && op !== 'eq' && op !== 'ne') {
      return null
    }
    const left = parseRunnerNumExpr(raw.left, depth + 1)
    const right = parseRunnerNumExpr(raw.right, depth + 1)
    if (!left || !right) {
      return null
    }
    return { kind: 'cmp_num', op, left, right }
  }
  if (kind === 'bin_bool') {
    const op = raw.op
    if (op !== 'and' && op !== 'or') {
      return null
    }
    const left = parseRunnerBoolExpr(raw.left, depth + 1)
    const right = parseRunnerBoolExpr(raw.right, depth + 1)
    if (!left || !right) {
      return null
    }
    return { kind: 'bin_bool', op, left, right }
  }
  if (kind === 'not') {
    const value = parseRunnerBoolExpr(raw.value, depth + 1)
    if (!value) {
      return null
    }
    return { kind: 'not', value }
  }
  return null
}

const parseRunnerCommandArray = (
  raw: unknown,
  depth: number,
): RunnerCommand[] | null => {
  if (!Array.isArray(raw)) {
    return null
  }
  const out: RunnerCommand[] = []
  for (const item of raw) {
    const parsed = parseRunnerCommand(item, depth + 1)
    if (!parsed) {
      return null
    }
    out.push(parsed)
  }
  return out
}

const parseRunnerCommand = (
  raw: unknown,
  depth = 0,
): RunnerCommand | null => {
  if (depth > 64 || !isRecord(raw)) {
    return null
  }
  const op = typeof raw.op === 'string' ? raw.op : ''
  const target = toNonNegativeInt(raw.target)
  const variableId = typeof raw.id === 'string' ? raw.id : ''

  if (op === 'set_var' || op === 'set_var_num_expr' || op === 'set_var_json_const') {
    if (target === null || variableId.length === 0) {
      return null
    }
    if (op === 'set_var_num_expr') {
      const expr = parseRunnerNumExpr(raw.expr, depth + 1)
      if (!expr) {
        return null
      }
      return { kind: 'set_num_expr', target, variableId, expr }
    }
    if (op === 'set_var_json_const') {
      let valueJson = 'null'
      try {
        valueJson = JSON.stringify(raw.value ?? null)
      } catch {
        valueJson = 'null'
      }
      return { kind: 'set_json_const', target, variableId, valueJson }
    }
    if (typeof raw.value === 'number' && Number.isFinite(raw.value)) {
      return {
        kind: 'set_num_expr',
        target,
        variableId,
        expr: { kind: 'num', value: raw.value },
      }
    }
    let valueJson = 'null'
    try {
      valueJson = JSON.stringify(raw.value ?? null)
    } catch {
      valueJson = 'null'
    }
    return { kind: 'set_json_const', target, variableId, valueJson }
  }

  if (op === 'change_var' || op === 'change_var_num_expr') {
    if (target === null || variableId.length === 0) {
      return null
    }
    if (op === 'change_var_num_expr') {
      const expr = parseRunnerNumExpr(raw.expr, depth + 1)
      if (!expr) {
        return null
      }
      return { kind: 'change_num_expr', target, variableId, expr }
    }
    const delta =
      typeof raw.delta === 'number' && Number.isFinite(raw.delta)
        ? raw.delta
        : 0
    return {
      kind: 'change_num_expr',
      target,
      variableId,
      expr: { kind: 'num', value: delta },
    }
  }

  if (op === 'if') {
    const cond = parseRunnerBoolExpr(raw.cond, depth + 1)
    const thenCommands = parseRunnerCommandArray(raw.then, depth + 1)
    if (!cond || !thenCommands) {
      return null
    }
    return { kind: 'if', cond, thenCommands }
  }

  if (op === 'if_else') {
    const cond = parseRunnerBoolExpr(raw.cond, depth + 1)
    const thenCommands = parseRunnerCommandArray(raw.then, depth + 1)
    const elseCommands = parseRunnerCommandArray(raw.else, depth + 1)
    if (!cond || !thenCommands || !elseCommands) {
      return null
    }
    return { kind: 'if_else', cond, thenCommands, elseCommands }
  }

  if (op === 'repeat') {
    const times = parseRunnerNumExpr(raw.times, depth + 1)
    const body = parseRunnerCommandArray(raw.body, depth + 1)
    if (!times || !body) {
      return null
    }
    return { kind: 'repeat', times, body }
  }

  if (op === 'repeat_until') {
    const cond = parseRunnerBoolExpr(raw.cond, depth + 1)
    const body = parseRunnerCommandArray(raw.body, depth + 1)
    if (!cond || !body) {
      return null
    }
    return { kind: 'repeat_until', cond, body }
  }

  if (op === 'while') {
    const cond = parseRunnerBoolExpr(raw.cond, depth + 1)
    const body = parseRunnerCommandArray(raw.body, depth + 1)
    if (!cond || !body) {
      return null
    }
    return { kind: 'while', cond, body }
  }

  if (op === 'host_tail') {
    const startPc = toNonNegativeInt(raw.pc)
    if (target === null || startPc === null) {
      return null
    }
    return { kind: 'host_tail', target, startPc }
  }

  if (op === 'host_opcode') {
    const pc = toNonNegativeInt(raw.pc)
    if (target === null || pc === null) {
      return null
    }
    return { kind: 'host_opcode', target, pc }
  }

  return null
}

const parseRunnerCommands = (commandsBase64: string): RunnerCommand[] => {
  if (!commandsBase64 || commandsBase64.trim().length === 0) {
    return []
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(decodeUtf8(decodeBase64(commandsBase64)))
  } catch {
    return []
  }
  const commandsRaw = Array.isArray(parsed)
    ? parsed
    : isRecord(parsed) && Array.isArray(parsed.exec)
      ? parsed.exec
      : []
  const parsedCommands = parseRunnerCommandArray(commandsRaw, 0)
  return parsedCommands ?? []
}

const collectNumExprLiterals = (
  expr: RunnerNumExpr,
  registerId: (id: string) => void,
): void => {
  switch (expr.kind) {
    case 'num':
      return
    case 'var_num':
      registerId(expr.variableId)
      return
    case 'bin_num':
      collectNumExprLiterals(expr.left, registerId)
      collectNumExprLiterals(expr.right, registerId)
      return
    case 'unary_num':
      collectNumExprLiterals(expr.value, registerId)
      return
  }
}

const collectBoolExprLiterals = (
  expr: RunnerBoolExpr,
  registerId: (id: string) => void,
): void => {
  switch (expr.kind) {
    case 'bool':
      return
    case 'cmp_num':
      collectNumExprLiterals(expr.left, registerId)
      collectNumExprLiterals(expr.right, registerId)
      return
    case 'bin_bool':
      collectBoolExprLiterals(expr.left, registerId)
      collectBoolExprLiterals(expr.right, registerId)
      return
    case 'not':
      collectBoolExprLiterals(expr.value, registerId)
      return
  }
}

const collectCommandLiterals = (
  command: RunnerCommand,
  registerId: (id: string) => void,
  registerJson: (valueJson: string) => void,
): void => {
  switch (command.kind) {
    case 'set_num_expr':
      registerId(command.variableId)
      collectNumExprLiterals(command.expr, registerId)
      return
    case 'set_json_const':
      registerId(command.variableId)
      registerJson(command.valueJson)
      return
    case 'change_num_expr':
      registerId(command.variableId)
      collectNumExprLiterals(command.expr, registerId)
      return
    case 'if':
      collectBoolExprLiterals(command.cond, registerId)
      for (const child of command.thenCommands) {
        collectCommandLiterals(child, registerId, registerJson)
      }
      return
    case 'if_else':
      collectBoolExprLiterals(command.cond, registerId)
      for (const child of command.thenCommands) {
        collectCommandLiterals(child, registerId, registerJson)
      }
      for (const child of command.elseCommands) {
        collectCommandLiterals(child, registerId, registerJson)
      }
      return
    case 'repeat':
      collectNumExprLiterals(command.times, registerId)
      for (const child of command.body) {
        collectCommandLiterals(child, registerId, registerJson)
      }
      return
    case 'repeat_until':
      collectBoolExprLiterals(command.cond, registerId)
      for (const child of command.body) {
        collectCommandLiterals(child, registerId, registerJson)
      }
      return
    case 'while':
      collectBoolExprLiterals(command.cond, registerId)
      for (const child of command.body) {
        collectCommandLiterals(child, registerId, registerJson)
      }
      return
    case 'host_opcode':
      return
    case 'host_tail':
      return
  }
}

const buildRunnerLiteralPool = (
  commands: RunnerCommand[],
  basePtr: number,
): {
  bytes: Uint8Array
  refs: Map<string, RunnerLiteralRef>
} => {
  const refs = new Map<string, RunnerLiteralRef>()
  const bytes: number[] = []
  const registerLiteral = (key: string, literal: string): void => {
    if (refs.has(key)) {
      return
    }
    const encoded = encodeUtf8(literal)
    const ref = {
      ptr: basePtr + bytes.length,
      len: encoded.length,
    }
    refs.set(key, ref)
    appendNumbers(bytes, encoded)
  }

  for (const command of commands) {
    collectCommandLiterals(
      command,
      (id) => registerLiteral(`id:${id}`, id),
      (valueJson) => registerLiteral(`json:${valueJson}`, valueJson),
    )
  }

  return {
    bytes: new Uint8Array(bytes),
    refs,
  }
}

const buildRunnerExecBody = (
  commands: RunnerCommand[],
  refs: Map<string, RunnerLiteralRef>,
): number[] => {
  const emitNumExpr = (expr: RunnerNumExpr, out: number[]): boolean => {
    switch (expr.kind) {
      case 'num':
        pushF64Const(out, expr.value)
        return true
      case 'var_num': {
        const idRef = refs.get(`id:${expr.variableId}`)
        if (!idRef) {
          return false
        }
        pushI32Const(out, expr.target)
        pushI32Const(out, idRef.ptr)
        pushI32Const(out, idRef.len)
        pushCall(out, IMPORT_GET_VAR_NUM_INDEX)
        return true
      }
      case 'bin_num':
        if (!emitNumExpr(expr.left, out) || !emitNumExpr(expr.right, out)) {
          return false
        }
        if (expr.op === 'add') {
          out.push(0xa0)
        } else if (expr.op === 'sub') {
          out.push(0xa1)
        } else if (expr.op === 'mul') {
          out.push(0xa2)
        } else if (expr.op === 'div') {
          out.push(0xa3)
        } else {
          pushCall(out, IMPORT_MOD_INDEX)
        }
        return true
      case 'unary_num':
        if (!emitNumExpr(expr.value, out)) {
          return false
        }
        out.push(0x9e)
        return true
    }
  }

  const emitBoolExpr = (expr: RunnerBoolExpr, out: number[]): boolean => {
    switch (expr.kind) {
      case 'bool':
        pushI32Const(out, expr.value ? 1 : 0)
        return true
      case 'cmp_num':
        if (!emitNumExpr(expr.left, out) || !emitNumExpr(expr.right, out)) {
          return false
        }
        if (expr.op === 'lt') {
          out.push(0x63)
        } else if (expr.op === 'gt') {
          out.push(0x64)
        } else if (expr.op === 'eq') {
          out.push(0x61)
        } else {
          out.push(0x61, 0x45)
        }
        return true
      case 'bin_bool':
        if (!emitBoolExpr(expr.left, out) || !emitBoolExpr(expr.right, out)) {
          return false
        }
        out.push(expr.op === 'and' ? 0x71 : 0x72)
        return true
      case 'not':
        if (!emitBoolExpr(expr.value, out)) {
          return false
        }
        out.push(0x45)
        return true
    }
  }

  const emitRunnerCommands = (list: RunnerCommand[], out: number[]): boolean => {
    for (const command of list) {
      if (command.kind === 'set_num_expr') {
        const idRef = refs.get(`id:${command.variableId}`)
        if (!idRef) {
          return false
        }
        pushI32Const(out, command.target)
        pushI32Const(out, idRef.ptr)
        pushI32Const(out, idRef.len)
        if (!emitNumExpr(command.expr, out)) {
          return false
        }
        pushCall(out, IMPORT_SET_VAR_NUM_INDEX)
        continue
      }
      if (command.kind === 'set_json_const') {
        const idRef = refs.get(`id:${command.variableId}`)
        const jsonRef = refs.get(`json:${command.valueJson}`)
        if (!idRef || !jsonRef) {
          return false
        }
        pushI32Const(out, command.target)
        pushI32Const(out, idRef.ptr)
        pushI32Const(out, idRef.len)
        pushI32Const(out, jsonRef.ptr)
        pushI32Const(out, jsonRef.len)
        pushCall(out, IMPORT_SET_VAR_JSON_INDEX)
        continue
      }
      if (command.kind === 'change_num_expr') {
        const idRef = refs.get(`id:${command.variableId}`)
        if (!idRef) {
          return false
        }
        pushI32Const(out, command.target)
        pushI32Const(out, idRef.ptr)
        pushI32Const(out, idRef.len)
        pushI32Const(out, command.target)
        pushI32Const(out, idRef.ptr)
        pushI32Const(out, idRef.len)
        pushCall(out, IMPORT_GET_VAR_NUM_INDEX)
        if (!emitNumExpr(command.expr, out)) {
          return false
        }
        out.push(0xa0)
        pushCall(out, IMPORT_SET_VAR_NUM_INDEX)
        continue
      }
      if (command.kind === 'if') {
        if (!emitBoolExpr(command.cond, out)) {
          return false
        }
        out.push(0x04, 0x40)
        if (!emitRunnerCommands(command.thenCommands, out)) {
          return false
        }
        out.push(0x0b)
        continue
      }
      if (command.kind === 'if_else') {
        if (!emitBoolExpr(command.cond, out)) {
          return false
        }
        out.push(0x04, 0x40)
        if (!emitRunnerCommands(command.thenCommands, out)) {
          return false
        }
        out.push(0x05)
        if (!emitRunnerCommands(command.elseCommands, out)) {
          return false
        }
        out.push(0x0b)
        continue
      }
      if (command.kind === 'repeat') {
        if (!emitNumExpr(command.times, out)) {
          return false
        }
        pushLocalSet(out, LOOP_COUNTER_LOCAL)
        pushI32Const(out, LOOP_GUARD_MAX)
        pushLocalSet(out, LOOP_GUARD_LOCAL)
        out.push(0x02, 0x40, 0x03, 0x40)
        pushLocalGet(out, LOOP_GUARD_LOCAL)
        out.push(0x45)
        pushBrIf(out, 1)
        pushLocalGet(out, LOOP_COUNTER_LOCAL)
        pushF64Const(out, 0)
        out.push(0x65)
        pushBrIf(out, 1)
        if (!emitRunnerCommands(command.body, out)) {
          return false
        }
        pushLocalGet(out, LOOP_COUNTER_LOCAL)
        pushF64Const(out, 1)
        out.push(0xa1)
        pushLocalSet(out, LOOP_COUNTER_LOCAL)
        pushLocalGet(out, LOOP_GUARD_LOCAL)
        pushI32Const(out, 1)
        out.push(0x6b)
        pushLocalSet(out, LOOP_GUARD_LOCAL)
        pushBr(out, 0)
        out.push(0x0b, 0x0b)
        continue
      }
      if (command.kind === 'repeat_until' || command.kind === 'while') {
        pushI32Const(out, LOOP_GUARD_MAX)
        pushLocalSet(out, LOOP_GUARD_LOCAL)
        out.push(0x02, 0x40, 0x03, 0x40)
        pushLocalGet(out, LOOP_GUARD_LOCAL)
        out.push(0x45)
        pushBrIf(out, 1)
        if (!emitBoolExpr(command.cond, out)) {
          return false
        }
        if (command.kind === 'repeat_until') {
          pushBrIf(out, 1)
        } else {
          out.push(0x45)
          pushBrIf(out, 1)
        }
        if (!emitRunnerCommands(command.body, out)) {
          return false
        }
        pushLocalGet(out, LOOP_GUARD_LOCAL)
        pushI32Const(out, 1)
        out.push(0x6b)
        pushLocalSet(out, LOOP_GUARD_LOCAL)
        pushBr(out, 0)
        out.push(0x0b, 0x0b)
        continue
      }
      if (command.kind === 'host_tail') {
        pushI32Const(out, command.target)
        pushI32Const(out, command.startPc)
        pushCall(out, IMPORT_EXEC_TAIL_INDEX)
        out.push(0x1a)
        continue
      }
      if (command.kind === 'host_opcode') {
        pushI32Const(out, command.target)
        pushI32Const(out, command.pc)
        pushCall(out, IMPORT_EXEC_OPCODE_INDEX)
        out.push(0x1a)
        continue
      }
    }
    return true
  }

  const body: number[] = [0x02, 0x01, 0x7c, 0x01, 0x7f]
  if (!emitRunnerCommands(commands, body)) {
    pushI32Const(body, 0)
    body.push(0x0b)
    return body
  }
  pushI32Const(body, commands.length)
  body.push(0x0b)
  return body
}

export const buildProgramWasmBinary = ({
  abiVersion,
  projectBase64,
  assetsBase64,
  commandsBase64,
}: {
  abiVersion: number
  projectBase64: string
  assetsBase64: string
  commandsBase64: string
}): Uint8Array => {
  const projectBytes = encodeUtf8(projectBase64)
  const assetsBytes = encodeUtf8(assetsBase64)
  const commandsBytes = encodeUtf8(commandsBase64)
  const runnerCommands = parseRunnerCommands(commandsBase64)
  const projectLen = projectBytes.length
  const assetsPtr = projectLen
  const assetsLen = assetsBytes.length
  const commandsPtr = assetsPtr + assetsLen
  const commandsLen = commandsBytes.length
  const runnerLiteralPoolPtr = commandsPtr + commandsLen
  const runnerLiteralPool = buildRunnerLiteralPool(
    runnerCommands,
    runnerLiteralPoolPtr,
  )
  const totalBytes =
    projectLen + assetsLen + commandsLen + runnerLiteralPool.bytes.length
  const memoryPages = Math.max(1, Math.ceil(totalBytes / WASM_PAGE_SIZE))
  const hasExecRunner = runnerCommands.length > 0 ? 1 : 0

  const moduleBytes: number[] = [0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]

  const typeSection = encodeSection(1, [
    0x06,
    0x60,
    0x00,
    0x01,
    0x7f,
    0x60,
    0x03,
    0x7f,
    0x7f,
    0x7f,
    0x01,
    0x7c,
    0x60,
    0x04,
    0x7f,
    0x7f,
    0x7f,
    0x7c,
    0x00,
    0x60,
    0x05,
    0x7f,
    0x7f,
    0x7f,
    0x7f,
    0x7f,
    0x00,
    0x60,
    0x02,
    0x7c,
    0x7c,
    0x01,
    0x7c,
    0x60,
    0x02,
    0x7f,
    0x7f,
    0x01,
    0x7f,
  ])
  appendNumbers(moduleBytes, typeSection)

  const importPayload: number[] = []
  const imports: Array<{ module: string; name: string; typeIndex: number }> = [
    { module: 'env', name: 'ms_get_var_num', typeIndex: 1 },
    { module: 'env', name: 'ms_set_var_num', typeIndex: 2 },
    { module: 'env', name: 'ms_set_var_json', typeIndex: 3 },
    { module: 'env', name: 'ms_mod', typeIndex: 4 },
    { module: 'env', name: 'ms_exec_opcode', typeIndex: 5 },
    { module: 'env', name: 'ms_exec_tail', typeIndex: 5 },
  ]
  appendNumbers(importPayload, encodeU32Leb(imports.length))
  for (const item of imports) {
    appendNumbers(importPayload, encodeName(item.module))
    appendNumbers(importPayload, encodeName(item.name))
    importPayload.push(0x00)
    appendNumbers(importPayload, encodeU32Leb(item.typeIndex))
  }
  appendNumbers(moduleBytes, encodeSection(2, importPayload))

  const functionTypeIndices = [0, 0, 0, 0, 0, 0, 0, 0, 0]
  const functionPayload: number[] = []
  appendNumbers(functionPayload, encodeU32Leb(functionTypeIndices.length))
  appendNumbers(functionPayload, functionTypeIndices)
  const functionSection = encodeSection(3, functionPayload)
  appendNumbers(moduleBytes, functionSection)

  const memorySection = encodeSection(5, [
    0x01,
    0x00,
    ...encodeU32Leb(memoryPages),
  ])
  appendNumbers(moduleBytes, memorySection)

  const functionImportCount = imports.length
  const definedFunctionBase = functionImportCount
  const exportsPayload: number[] = []
  const exports: Array<{ name: string; kind: number; index: number }> = [
    { name: 'memory', kind: 0x02, index: 0 },
    { name: 'ms_abi_version', kind: 0x00, index: definedFunctionBase + 0 },
    { name: 'ms_project_ptr', kind: 0x00, index: definedFunctionBase + 1 },
    { name: 'ms_project_len', kind: 0x00, index: definedFunctionBase + 2 },
    { name: 'ms_assets_ptr', kind: 0x00, index: definedFunctionBase + 3 },
    { name: 'ms_assets_len', kind: 0x00, index: definedFunctionBase + 4 },
    { name: 'ms_commands_ptr', kind: 0x00, index: definedFunctionBase + 5 },
    { name: 'ms_commands_len', kind: 0x00, index: definedFunctionBase + 6 },
    { name: 'ms_has_exec_runner', kind: 0x00, index: definedFunctionBase + 7 },
    {
      name: 'ms_exec_green_flag',
      kind: 0x00,
      index: definedFunctionBase + 8,
    },
  ]
  appendNumbers(exportsPayload, encodeU32Leb(exports.length))
  for (const item of exports) {
    appendNumbers(exportsPayload, encodeName(item.name))
    exportsPayload.push(item.kind)
    appendNumbers(exportsPayload, encodeU32Leb(item.index))
  }
  appendNumbers(moduleBytes, encodeSection(7, exportsPayload))

  const functionConsts = [
    abiVersion,
    0,
    projectLen,
    assetsPtr,
    assetsLen,
    commandsPtr,
    commandsLen,
    hasExecRunner,
  ]
  const codePayload: number[] = []
  appendNumbers(codePayload, encodeU32Leb(functionConsts.length + 1))
  for (const value of functionConsts) {
    const body = [0x00, 0x41]
    appendNumbers(body, encodeI32Leb(value))
    body.push(0x0b)
    appendNumbers(codePayload, encodeU32Leb(body.length))
    appendNumbers(codePayload, body)
  }
  const execBody = buildRunnerExecBody(runnerCommands, runnerLiteralPool.refs)
  appendNumbers(codePayload, encodeU32Leb(execBody.length))
  appendNumbers(codePayload, execBody)
  appendNumbers(moduleBytes, encodeSection(10, codePayload))

  const dataPayload: number[] = []
  const segments: Array<{ offset: number; bytes: Uint8Array }> = [
    { offset: 0, bytes: projectBytes },
    { offset: assetsPtr, bytes: assetsBytes },
    { offset: commandsPtr, bytes: commandsBytes },
  ]
  if (runnerLiteralPool.bytes.length > 0) {
    segments.push({
      offset: runnerLiteralPoolPtr,
      bytes: runnerLiteralPool.bytes,
    })
  }
  appendNumbers(dataPayload, encodeU32Leb(segments.length))
  for (const segment of segments) {
    dataPayload.push(0x00, 0x41)
    appendNumbers(dataPayload, encodeI32Leb(segment.offset))
    dataPayload.push(0x0b)
    appendNumbers(dataPayload, encodeU32Leb(segment.bytes.length))
    appendNumbers(dataPayload, segment.bytes)
  }
  appendNumbers(moduleBytes, encodeSection(11, dataPayload))

  return new Uint8Array(moduleBytes)
}

export const defaultWatToWasm = (wat: string): Uint8Array => {
  const metadata = parseGeneratedProgramWatMetadata(wat)
  return buildProgramWasmBinary(metadata)
}

const readExportedI32 = (
  exports: Record<string, unknown>,
  name: string,
): number => {
  const raw = exports[name]
  if (typeof raw !== 'function') {
    throw new Error(`Program WASM export "${name}" is missing`)
  }
  const value = (raw as () => number)()
  if (!Number.isInteger(value)) {
    throw new Error(`Program WASM export "${name}" did not return an integer`)
  }
  return value
}

const readMemorySlice = (
  memory: WebAssembly.Memory,
  ptr: number,
  len: number,
): Uint8Array => {
  if (ptr < 0 || len < 0) {
    throw new Error('Program WASM returned a negative pointer/length')
  }
  const buffer = memory.buffer
  const end = ptr + len
  if (end > buffer.byteLength) {
    throw new Error('Program WASM payload pointer is out of bounds')
  }
  return new Uint8Array(buffer, ptr, len)
}

const defaultProgramImports = {
  env: {
    ms_get_var_num: () => 0,
    ms_set_var_num: () => {},
    ms_set_var_json: () => {},
    ms_mod: (left: number, right: number) => {
      if (!Number.isFinite(left) || !Number.isFinite(right) || right === 0) {
        return 0
      }
      const raw = left % right
      if (raw === 0) {
        return 0
      }
      if ((raw < 0 && right > 0) || (raw > 0 && right < 0)) {
        return raw + right
      }
      return raw
    },
    ms_exec_opcode: () => 0,
    ms_exec_tail: () => 0,
  },
}

const fnv1aHex = (input: string): string => {
  let hash = 0x811c9dc5
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

const deriveManifest = (
  abiVersion: number,
  payload: ProgramPayload,
): ProgramManifest => {
  const projectByteLength = encodeUtf8(payload.projectJson).length
  const assetsByteLength = encodeUtf8(payload.assetsJson).length
  return {
    abiVersion,
    opcodeSetVersion: OPCODE_SET_VERSION,
    projectByteLength,
    assetsByteLength,
    buildFingerprint: fnv1aHex(
      `abi=${String(abiVersion)}|project=${payload.projectJson}|assets=${payload.assetsJson}`,
    ),
  }
}

export const instantiateProgramModule = (
  wasmBytes: ProgramWasmBytes,
  manifest?: ProgramManifest,
): ProgramModule => {
  const bytes = toUint8Array(wasmBytes)
  const module = new WebAssembly.Module(toArrayBuffer(bytes))
  const instance = new WebAssembly.Instance(module, defaultProgramImports)
  const exports = instance.exports as Record<string, unknown>
  const memory = exports.memory
  if (!(memory instanceof WebAssembly.Memory)) {
    throw new Error('Program WASM export "memory" is missing')
  }

  const abiVersion = readExportedI32(exports, 'ms_abi_version')
  const projectPtr = readExportedI32(exports, 'ms_project_ptr')
  const projectLen = readExportedI32(exports, 'ms_project_len')
  const assetsPtr = readExportedI32(exports, 'ms_assets_ptr')
  const assetsLen = readExportedI32(exports, 'ms_assets_len')
  const commandsPtr = readExportedI32(exports, 'ms_commands_ptr')
  const commandsLen = readExportedI32(exports, 'ms_commands_len')

  const projectBase64 = decodeUtf8(
    readMemorySlice(memory, projectPtr, projectLen),
  )
  const assetsBase64 = decodeUtf8(readMemorySlice(memory, assetsPtr, assetsLen))
  const payload: ProgramPayload = {
    projectJson: decodeUtf8(decodeBase64(projectBase64)),
    assetsJson: decodeUtf8(decodeBase64(assetsBase64)),
  }
  if (commandsLen > 0) {
    const commandsBase64 = decodeUtf8(
      readMemorySlice(memory, commandsPtr, commandsLen),
    )
    payload.commandsJson = decodeUtf8(decodeBase64(commandsBase64))
  }

  if (manifest && manifest.abiVersion !== abiVersion) {
    throw new Error(
      `Program manifest ABI ${String(manifest.abiVersion)} does not match module ABI ${String(abiVersion)}`,
    )
  }

  const hasWasmExecExport =
    typeof exports.ms_has_exec_runner === 'function'
      ? (exports.ms_has_exec_runner as () => number)()
      : 0
  const hasWasmExec = Number.isInteger(hasWasmExecExport) && hasWasmExecExport > 0

  return {
    raw: instance,
    abiVersion,
    manifest: manifest ?? deriveManifest(abiVersion, payload),
    readPayload: () => payload,
    hasWasmExec: () => hasWasmExec,
    createWasmExecRunner: (
      host: ProgramWasmExecHost,
    ): ProgramWasmExecRunner | null => {
      if (!hasWasmExec) {
        return null
      }

      let runnerMemory: WebAssembly.Memory | null = null
      const runnerInstance = new WebAssembly.Instance(module, {
        env: {
          ms_get_var_num: (targetIndex: number, idPtr: number, idLen: number) => {
            if (!(runnerMemory instanceof WebAssembly.Memory)) {
              return 0
            }
            const variableId = decodeUtf8(
              readMemorySlice(runnerMemory, idPtr | 0, idLen | 0),
            )
            const value = host.getVarNumber(targetIndex | 0, variableId)
            return Number.isFinite(value) ? value : 0
          },
          ms_set_var_num: (
            targetIndex: number,
            idPtr: number,
            idLen: number,
            value: number,
          ) => {
            if (!(runnerMemory instanceof WebAssembly.Memory)) {
              return
            }
            const variableId = decodeUtf8(
              readMemorySlice(runnerMemory, idPtr | 0, idLen | 0),
            )
            host.setVarNumber(
              targetIndex | 0,
              variableId,
              Number.isFinite(value) ? value : 0,
            )
          },
          ms_set_var_json: (
            targetIndex: number,
            idPtr: number,
            idLen: number,
            valuePtr: number,
            valueLen: number,
          ) => {
            if (!(runnerMemory instanceof WebAssembly.Memory)) {
              return
            }
            const variableId = decodeUtf8(
              readMemorySlice(runnerMemory, idPtr | 0, idLen | 0),
            )
            const valueJson = decodeUtf8(
              readMemorySlice(runnerMemory, valuePtr | 0, valueLen | 0),
            )
            host.setVarJson(targetIndex | 0, variableId, valueJson)
          },
          ms_mod: (left: number, right: number) => {
            if (!Number.isFinite(left) || !Number.isFinite(right) || right === 0) {
              return 0
            }
            const raw = left % right
            if (raw === 0) {
              return 0
            }
            if ((raw < 0 && right > 0) || (raw > 0 && right < 0)) {
              return raw + right
            }
            return raw
          },
          ms_exec_opcode: (targetIndex: number, pc: number) => {
            return host.execHostOpcode(targetIndex | 0, pc | 0) | 0
          },
          ms_exec_tail: (targetIndex: number, startPc: number) => {
            return host.execHostTail(targetIndex | 0, startPc | 0) | 0
          },
        },
      })
      const runnerExports = runnerInstance.exports as Record<string, unknown>
      const runnerMemoryExport = runnerExports.memory
      const runnerExecExport = runnerExports.ms_exec_green_flag
      if (!(runnerMemoryExport instanceof WebAssembly.Memory)) {
        return null
      }
      if (typeof runnerExecExport !== 'function') {
        return null
      }
      runnerMemory = runnerMemoryExport

      return () => {
        const result = (runnerExecExport as () => number)()
        if (!Number.isInteger(result) || result < 0) {
          throw new Error(
            `Program WASM runner returned invalid op count: ${String(result)}`,
          )
        }
        return result
      }
    },
  }
}
