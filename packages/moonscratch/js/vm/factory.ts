import { moonscratch } from './bindings.ts'
import { HeadlessVM } from './headless-vm.ts'
import type { MoonResult } from './internal-types.ts'
import {
  toOptionalJsonString,
  toProjectJsonString,
  unwrapResult,
} from './json.ts'
import { toOptionsJson } from './options.ts'
import { instantiateProgramModule } from './program-wasm.ts'
import { resolveMissingScratchAssets } from './scratch-assets.ts'
import type {
  CompileProjectToWasmOptions,
  CompileProjectToWasmResult,
  CompileProjectToWatOptions,
  CompileProjectToWatResult,
  CreateHeadlessVMFromProjectOptions,
  CreateHeadlessVMOptions,
  CreateHeadlessVMWithScratchAssetsOptions,
  CreateProgramModuleFromProjectOptions,
  CreateProgramModuleOptions,
  JsonValue,
  PrecompileProgramForRuntimeOptions,
  ProgramManifest,
  ProgramModule,
  RuntimeHandle,
} from './types.ts'

type BoundMoonscratchFactory = {
  vm_compile_from_json?: (
    projectJson: string,
    assetsJson?: string,
  ) => MoonResult<unknown, unknown>
  vm_compile_project_to_wat?: (
    projectJson: string,
    assetsJson?: string,
  ) => MoonResult<string, unknown>
  vm_compile_project_to_wasm?: (
    projectJson: string,
    assetsJson?: string,
  ) => MoonResult<string, unknown>
  vm_abi_version?: () => number
  vm_set_aot_commands_json?: (
    vmHandle: unknown,
    commandsJson: string,
  ) => MoonResult<unknown, unknown>
  vm_get_variable_number_by_id?: (
    vmHandle: unknown,
    targetIndex: number,
    variableId: string,
  ) => number
  vm_set_variable_number_by_id?: (
    vmHandle: unknown,
    targetIndex: number,
    variableId: string,
    value: number,
  ) => void
  vm_set_variable_json_by_id?: (
    vmHandle: unknown,
    targetIndex: number,
    variableId: string,
    valueJson: string,
  ) => void
  vm_exec_script_tail_by_pc?: (
    vmHandle: unknown,
    targetIndex: number,
    startPc: number,
  ) => number
  vm_exec_opcode_once_by_pc?: (
    vmHandle: unknown,
    targetIndex: number,
    pc: number,
  ) => number
  vm_exec_draw_opcode?: (
    vmHandle: unknown,
    targetIndex: number,
    opcode: string,
    arg0: number,
    arg1: number,
    extra: number,
  ) => number
  vm_new_from_compiled?: (
    precompiled: unknown,
    optionsJson?: string,
  ) => MoonResult<unknown, unknown>
}

const OPCODE_SET_VERSION = 2
const runtimePrecompiledCacheSymbol = Symbol(
  'moonscratch.runtime_precompiled_cache',
)

type ProgramModuleInternal = ProgramModule & {
  [runtimePrecompiledCacheSymbol]?: WeakMap<object, unknown>
}

const hasAnyAssetEntry = (assets: Record<string, JsonValue>): boolean => {
  for (const _key in assets) {
    return true
  }
  return false
}

const toAssetsJson = (
  assets: string | Record<string, JsonValue> | undefined,
): string | undefined => {
  return assets === undefined ||
    (typeof assets !== 'string' && !hasAnyAssetEntry(assets))
    ? undefined
    : toOptionalJsonString(assets, 'assets')
}

const requireBinding = (): BoundMoonscratchFactory => {
  return moonscratch as unknown as BoundMoonscratchFactory
}

const requireAbiVersion = (binding: BoundMoonscratchFactory): number => {
  if (typeof binding.vm_abi_version !== 'function') {
    throw new Error(
      'vm_abi_version is unavailable in this build. Please rebuild moonscratch JS bindings.',
    )
  }
  const abiVersion = binding.vm_abi_version()
  if (!Number.isInteger(abiVersion) || abiVersion <= 0) {
    throw new Error(
      `vm_abi_version returned an invalid value: ${String(abiVersion)}`,
    )
  }
  return abiVersion
}

const encodeUtf8Length = (value: string): number =>
  new TextEncoder().encode(value).length

const fnv1aHex = (input: string): string => {
  let hash = 0x811c9dc5
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

const createManifest = ({
  abiVersion,
  projectJson,
  assetsJson,
}: {
  abiVersion: number
  projectJson: string
  assetsJson: string
}): ProgramManifest => {
  return {
    abiVersion,
    opcodeSetVersion: OPCODE_SET_VERSION,
    projectByteLength: encodeUtf8Length(projectJson),
    assetsByteLength: encodeUtf8Length(assetsJson),
    buildFingerprint: fnv1aHex(
      `abi=${String(abiVersion)}|project=${projectJson}|assets=${assetsJson}`,
    ),
  }
}

export const createRuntime = (): RuntimeHandle => {
  const binding = requireBinding()
  const abiVersion = requireAbiVersion(binding)
  return {
    raw: binding,
    abiVersion,
  }
}

export const compileProjectToWat = ({
  projectJson,
  assets,
}: CompileProjectToWatOptions): CompileProjectToWatResult => {
  const binding = requireBinding()
  if (typeof binding.vm_compile_project_to_wat !== 'function') {
    throw new Error(
      'vm_compile_project_to_wat is unavailable in this build. Please rebuild moonscratch JS bindings.',
    )
  }

  const normalizedProjectJson = toProjectJsonString(projectJson)
  const normalizedAssetsJson = toAssetsJson(assets)
  const abiVersion = requireAbiVersion(binding)
  const wat = unwrapResult(
    binding.vm_compile_project_to_wat(
      normalizedProjectJson,
      normalizedAssetsJson,
    ),
    'vm_compile_project_to_wat failed',
  )
  return {
    wat,
    abiVersion,
    manifest: createManifest({
      abiVersion,
      projectJson: normalizedProjectJson,
      assetsJson: normalizedAssetsJson ?? '{}',
    }),
  }
}

const toUint8Array = (value: Uint8Array | ArrayBuffer): Uint8Array => {
  return value instanceof Uint8Array ? value : new Uint8Array(value)
}

const decodeBase64ToUint8Array = (base64: string): Uint8Array => {
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

export const compileProjectToWasm = ({
  watToWasm,
  ...rest
}: CompileProjectToWasmOptions): CompileProjectToWasmResult => {
  const compiled = compileProjectToWat(rest)
  let wasm: Uint8Array
  if (watToWasm) {
    wasm = toUint8Array(watToWasm(compiled.wat))
  } else {
    const binding = requireBinding()
    if (typeof binding.vm_compile_project_to_wasm !== 'function') {
      throw new Error(
        'vm_compile_project_to_wasm is unavailable in this build. Please rebuild moonscratch JS bindings.',
      )
    }
    const wasmBase64 = unwrapResult(
      binding.vm_compile_project_to_wasm(
        toProjectJsonString(rest.projectJson),
        toAssetsJson(rest.assets),
      ),
      'vm_compile_project_to_wasm failed',
    )
    wasm = decodeBase64ToUint8Array(wasmBase64)
  }
  return {
    ...compiled,
    wasmBytes: wasm,
  }
}

export const createProgramModule = ({
  wasmBytes,
  manifest,
}: CreateProgramModuleOptions): ProgramModule => {
  return instantiateProgramModule(wasmBytes, manifest)
}

export const createProgramModuleFromProject = (
  options: CreateProgramModuleFromProjectOptions,
): ProgramModule => {
  const compiled = compileProjectToWasm(options)
  return createProgramModule({
    wasmBytes: compiled.wasmBytes,
    manifest: compiled.manifest,
  })
}

const requireRuntimeBinding = (
  runtime?: RuntimeHandle,
): BoundMoonscratchFactory => {
  return (
    (runtime?.raw as BoundMoonscratchFactory | undefined) ?? requireBinding()
  )
}

const runtimePrecompiledCache = (
  program: ProgramModule,
): WeakMap<object, unknown> => {
  const internal = program as ProgramModuleInternal
  if (!internal[runtimePrecompiledCacheSymbol]) {
    internal[runtimePrecompiledCacheSymbol] = new WeakMap<object, unknown>()
  }
  return internal[runtimePrecompiledCacheSymbol]
}

const compileProgramForRuntime = (
  program: ProgramModule,
  binding: BoundMoonscratchFactory,
): unknown => {
  if (typeof binding.vm_compile_from_json !== 'function') {
    throw new Error(
      'vm_compile_from_json is unavailable in this build. Please rebuild moonscratch JS bindings.',
    )
  }

  const runtimeKey = binding as object
  const cache = runtimePrecompiledCache(program)
  const cached = cache.get(runtimeKey)
  if (cached !== undefined) {
    return cached
  }
  const payload = program.readPayload()
  const compiled = unwrapResult(
    binding.vm_compile_from_json(payload.projectJson, payload.assetsJson),
    'vm_compile_from_json failed',
  )
  cache.set(runtimeKey, compiled)
  return compiled
}

const withCommandsExecMode = (
  commandsJson: string,
  execMode: string,
): string | null => {
  try {
    const parsed = JSON.parse(commandsJson) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null
    }
    const next = {
      ...(parsed as Record<string, unknown>),
      exec_mode: execMode,
    }
    return JSON.stringify(next)
  } catch {
    return null
  }
}

const commandContainsHostTail = (entry: unknown, depth = 0): boolean => {
  if (depth > 64 || !entry || typeof entry !== 'object') {
    return false
  }
  const command = entry as {
    op?: unknown
    then?: unknown
    else?: unknown
    body?: unknown
  }
  if (command.op === 'host_tail') {
    return true
  }
  if (command.op === 'if' && Array.isArray(command.then)) {
    return command.then.some((child) =>
      commandContainsHostTail(child, depth + 1),
    )
  }
  if (command.op === 'if_else') {
    const thenHasTail =
      Array.isArray(command.then) &&
      command.then.some((child) => commandContainsHostTail(child, depth + 1))
    const elseHasTail =
      Array.isArray(command.else) &&
      command.else.some((child) => commandContainsHostTail(child, depth + 1))
    return thenHasTail || elseHasTail
  }
  if (
    (command.op === 'repeat' ||
      command.op === 'repeat_until' ||
      command.op === 'while') &&
    Array.isArray(command.body)
  ) {
    return command.body.some((child) =>
      commandContainsHostTail(child, depth + 1),
    )
  }
  return false
}

const commandsIncludeHostTail = (commandsJson: string): boolean => {
  try {
    const parsed = JSON.parse(commandsJson) as unknown
    const exec = Array.isArray(parsed)
      ? parsed
      : parsed &&
          typeof parsed === 'object' &&
          Array.isArray((parsed as { exec?: unknown }).exec)
        ? (parsed as { exec: unknown[] }).exec
        : []
    return exec.some((entry) => commandContainsHostTail(entry))
  } catch {
    return false
  }
}

const hasWasmHostBridgeApi = (binding: BoundMoonscratchFactory): boolean => {
  return (
    typeof binding.vm_get_variable_number_by_id === 'function' &&
    typeof binding.vm_set_variable_number_by_id === 'function' &&
    typeof binding.vm_set_variable_json_by_id === 'function' &&
    typeof binding.vm_exec_opcode_once_by_pc === 'function' &&
    typeof binding.vm_exec_script_tail_by_pc === 'function' &&
    typeof binding.vm_exec_draw_opcode === 'function'
  )
}

export const precompileProgramForRuntime = ({
  program,
  runtime,
}: PrecompileProgramForRuntimeOptions): void => {
  const binding = requireRuntimeBinding(runtime)
  const runtimeAbi = requireAbiVersion(binding)
  if (program.abiVersion !== runtimeAbi) {
    throw new Error(
      `Program ABI ${String(program.abiVersion)} does not match runtime ABI ${String(runtimeAbi)}`,
    )
  }
  void compileProgramForRuntime(program, binding)
}

export const createHeadlessVM = ({
  runtime,
  program,
  options,
  initialNowMs,
  viewerLanguage,
  translateCache,
}: CreateHeadlessVMOptions): HeadlessVM => {
  const binding = requireRuntimeBinding(runtime)
  if (typeof binding.vm_new_from_compiled !== 'function') {
    throw new Error(
      'vm_new_from_compiled is unavailable in this build. Please rebuild moonscratch JS bindings.',
    )
  }

  const runtimeAbi = requireAbiVersion(binding)
  if (program.abiVersion !== runtimeAbi) {
    throw new Error(
      `Program ABI ${String(program.abiVersion)} does not match runtime ABI ${String(runtimeAbi)}`,
    )
  }

  const precompiled = compileProgramForRuntime(program, binding)
  const vm = unwrapResult(
    binding.vm_new_from_compiled(precompiled, toOptionsJson(options)),
    'vm_new_from_compiled failed',
  )
  let afterGreenFlag: (() => void) | undefined
  let beforeStepFrame: (() => void) | undefined
  const payload = program.readPayload()
  if (payload.commandsJson && payload.commandsJson.trim().length > 0) {
    if (typeof binding.vm_set_aot_commands_json !== 'function') {
      throw new Error(
        'vm_set_aot_commands_json is unavailable in this build. Please rebuild moonscratch JS bindings.',
      )
    }
    const hasHostTail = commandsIncludeHostTail(payload.commandsJson)
    let commandsJsonForRuntime = payload.commandsJson
    if (program.hasWasmExec() && hasWasmHostBridgeApi(binding)) {
      const commandsJsonWasmOnly = withCommandsExecMode(
        payload.commandsJson,
        'wasm_only',
      )
      if (commandsJsonWasmOnly !== null) {
        const runner = program.createWasmExecRunner({
          getVarNumber: (targetIndex, variableId) => {
            return (
              binding.vm_get_variable_number_by_id?.(
                vm,
                targetIndex,
                variableId,
              ) ?? 0
            )
          },
          setVarNumber: (targetIndex, variableId, value) => {
            binding.vm_set_variable_number_by_id?.(
              vm,
              targetIndex,
              variableId,
              value,
            )
          },
          setVarJson: (targetIndex, variableId, valueJson) => {
            binding.vm_set_variable_json_by_id?.(
              vm,
              targetIndex,
              variableId,
              valueJson,
            )
          },
          execHostTail: (targetIndex, startPc) => {
            return (
              binding.vm_exec_script_tail_by_pc?.(vm, targetIndex, startPc) ?? 0
            )
          },
          execHostOpcode: (targetIndex, pc) => {
            return binding.vm_exec_opcode_once_by_pc?.(vm, targetIndex, pc) ?? 0
          },
          execDrawOpcode: (targetIndex, opcode, arg0, arg1, extra) => {
            return (
              binding.vm_exec_draw_opcode?.(
                vm,
                targetIndex,
                opcode,
                arg0,
                arg1,
                extra,
              ) ?? 0
            )
          },
        })
        if (runner) {
          commandsJsonForRuntime = commandsJsonWasmOnly
          if (hasHostTail) {
            let pendingRunner = false
            afterGreenFlag = () => {
              pendingRunner = true
            }
            beforeStepFrame = () => {
              if (!pendingRunner) {
                return
              }
              pendingRunner = false
              void runner()
            }
          } else {
            afterGreenFlag = () => {
              void runner()
            }
          }
        }
      }
    }
    unwrapResult(
      binding.vm_set_aot_commands_json(vm, commandsJsonForRuntime),
      'vm_set_aot_commands_json failed',
    )
  }

  const runtimeVm = new HeadlessVM(vm, {
    afterGreenFlag,
    beforeStepFrame,
  })
  runtimeVm.setTime(initialNowMs ?? Date.now())
  if (viewerLanguage !== undefined) {
    runtimeVm.setViewerLanguage(viewerLanguage)
  }
  if (translateCache !== undefined) {
    runtimeVm.setTranslateCache(translateCache)
  }
  return runtimeVm
}

export const createVM = createHeadlessVM

export const createHeadlessVMFromProject = ({
  projectJson,
  assets,
  watToWasm,
  runtime,
  options,
  initialNowMs,
  viewerLanguage,
  translateCache,
}: CreateHeadlessVMFromProjectOptions): HeadlessVM => {
  const program = createProgramModuleFromProject({
    projectJson,
    assets,
    watToWasm,
  })
  return createHeadlessVM({
    runtime,
    program,
    options,
    initialNowMs,
    viewerLanguage,
    translateCache,
  })
}

export const createVMFromProject = createHeadlessVMFromProject

export const createHeadlessVMWithScratchAssets = async ({
  projectJson,
  assets = {},
  scratchCdnBaseUrl,
  fetchAsset,
  decodeImageBytes,
  watToWasm,
  runtime,
  options,
  initialNowMs,
  viewerLanguage,
  translateCache,
}: CreateHeadlessVMWithScratchAssetsOptions): Promise<HeadlessVM> => {
  const resolvedAssets = await resolveMissingScratchAssets({
    projectJson,
    assets,
    scratchCdnBaseUrl,
    fetchAsset,
    decodeImageBytes,
  })

  return createHeadlessVMFromProject({
    projectJson,
    assets: resolvedAssets,
    watToWasm,
    runtime,
    options,
    initialNowMs,
    viewerLanguage,
    translateCache,
  })
}

export const createVMWithScratchAssets = createHeadlessVMWithScratchAssets

export { moonscratch }
