import type {
  ProgramManifest,
  ProgramModule,
  ProgramPayload,
  ProgramWasmBytes,
  ProgramWasmExecHost,
  ProgramWasmExecRunner,
} from './types.ts'

const OPCODE_SET_VERSION = 2

const utf8Encoder = new TextEncoder()
const utf8Decoder = new TextDecoder()

const toUint8Array = (input: ProgramWasmBytes): Uint8Array => {
  return input instanceof Uint8Array ? input : new Uint8Array(input)
}

const encodeUtf8 = (value: string): Uint8Array => utf8Encoder.encode(value)

const decodeUtf8 = (bytes: Uint8Array): string => utf8Decoder.decode(bytes)

const toArrayBuffer = (bytes: Uint8Array): ArrayBuffer => {
  const out = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(out).set(bytes)
  return out
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
    ms_exec_draw_opcode: () => 0,
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
  const hasWasmExec =
    Number.isInteger(hasWasmExecExport) && hasWasmExecExport > 0

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
      const decodedLiteralCache = new Map<number, Map<number, string>>()
      const readCachedLiteral = (ptr: number, len: number): string => {
        const normalizedPtr = ptr | 0
        const normalizedLen = len | 0
        const byLen = decodedLiteralCache.get(normalizedPtr)
        const cached = byLen?.get(normalizedLen)
        if (cached !== undefined) {
          return cached
        }
        if (!(runnerMemory instanceof WebAssembly.Memory)) {
          return ''
        }
        const decoded = decodeUtf8(
          readMemorySlice(runnerMemory, normalizedPtr, normalizedLen),
        )
        if (byLen) {
          byLen.set(normalizedLen, decoded)
        } else {
          decodedLiteralCache.set(
            normalizedPtr,
            new Map([[normalizedLen, decoded]]),
          )
        }
        return decoded
      }
      const runnerInstance = new WebAssembly.Instance(module, {
        env: {
          ms_get_var_num: (
            targetIndex: number,
            idPtr: number,
            idLen: number,
          ) => {
            const variableId = readCachedLiteral(idPtr, idLen)
            const value = host.getVarNumber(targetIndex | 0, variableId)
            return Number.isFinite(value) ? value : 0
          },
          ms_set_var_num: (
            targetIndex: number,
            idPtr: number,
            idLen: number,
            value: number,
          ) => {
            const variableId = readCachedLiteral(idPtr, idLen)
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
            const variableId = readCachedLiteral(idPtr, idLen)
            const valueJson = readCachedLiteral(valuePtr, valueLen)
            host.setVarJson(targetIndex | 0, variableId, valueJson)
          },
          ms_mod: (left: number, right: number) => {
            if (
              !Number.isFinite(left) ||
              !Number.isFinite(right) ||
              right === 0
            ) {
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
          ms_exec_draw_opcode: (
            targetIndex: number,
            opcodePtr: number,
            opcodeLen: number,
            arg0: number,
            arg1: number,
            extra: number,
          ) => {
            const opcode = readCachedLiteral(opcodePtr, opcodeLen)
            const normalizedArg0 = Number.isFinite(arg0) ? arg0 : 0
            const normalizedArg1 = Number.isFinite(arg1) ? arg1 : 0
            return (
              host.execDrawOpcode(
                targetIndex | 0,
                opcode,
                normalizedArg0,
                normalizedArg1,
                extra | 0,
              ) | 0
            )
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
