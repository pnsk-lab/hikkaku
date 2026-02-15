import { describe, expect, test, vi } from 'vite-plus/test'

import {
  compileProjectToWasm,
  compileProjectToWat,
  createHeadlessVM,
  createHeadlessVMFromProject,
  createHeadlessVMWithScratchAssets,
  createProgramModule,
  createProgramModuleFromProject,
  createRuntime,
  createVM,
  createVMFromProject,
  createVMWithScratchAssets,
  moonscratch,
  precompileProgramForRuntime,
} from './factory.ts'
import {
  CONTROL_OPERATOR_DATA_PROJECT,
  EXAMPLE_PROJECT,
  getStageVariables,
  HOST_OPCODE_FALLBACK_PROJECT,
  stepMany,
  TEXT_TO_SPEECH_TRANSLATE_PROJECT,
} from './test-projects.ts'

describe('moonscratch/js/vm/factory.ts', () => {
  test('exports createVM aliases', () => {
    expect(createVM).toBe(createHeadlessVM)
    expect(createVMFromProject).toBe(createHeadlessVMFromProject)
    expect(createVMWithScratchAssets).toBe(createHeadlessVMWithScratchAssets)
  })

  test('compiles project JSON into generated WAT metadata', () => {
    const runtime = createRuntime()
    const compiled = compileProjectToWat({
      projectJson: TEXT_TO_SPEECH_TRANSLATE_PROJECT,
    })
    expect(compiled.abiVersion).toBe(runtime.abiVersion)
    expect(compiled.manifest.abiVersion).toBe(runtime.abiVersion)
    expect(compiled.wat).toContain(';; moonscratch_program_v1')
    expect(compiled.wat).toContain(
      `;; abi_version=${String(runtime.abiVersion)}`,
    )
  })

  test('builds and loads project WASM module from generated WAT', () => {
    const compiled = compileProjectToWasm({
      projectJson: TEXT_TO_SPEECH_TRANSLATE_PROJECT,
      assets: { custom_asset: { width: 1, height: 1, rgbaBase64: 'AP8A/w==' } },
    })
    const program = createProgramModule({
      wasmBytes: compiled.wasmBytes,
      manifest: compiled.manifest,
    })
    const payload = program.readPayload()
    expect(payload.projectJson).toContain('"targets"')
    expect(payload.assetsJson).toContain('custom_asset')
  })

  test('embeds AOT command payload for eligible linear green-flag scripts', () => {
    const program = createProgramModuleFromProject({
      projectJson: EXAMPLE_PROJECT,
    })
    const payload = program.readPayload()
    expect(payload.commandsJson).toBeDefined()
    expect(payload.commandsJson).toContain('"op":"set_var_json_const"')
    expect(payload.commandsJson).toContain('"catalog"')
    const parsed = JSON.parse(payload.commandsJson ?? '{}') as {
      exec_mode?: string
      full_green_flag_starts?: unknown[]
    }
    expect(parsed.exec_mode).toBe('linear')
    expect(Array.isArray(parsed.full_green_flag_starts)).toBe(true)
    expect(parsed.full_green_flag_starts?.length ?? 0).toBeGreaterThan(0)
  })

  test('stores opcode catalog and host-tail commands for unsupported opcodes', () => {
    const program = createProgramModuleFromProject({
      projectJson: TEXT_TO_SPEECH_TRANSLATE_PROJECT,
    })
    const payload = program.readPayload()
    expect(payload.commandsJson).toBeDefined()
    expect(payload.commandsJson).toContain('"catalog"')
    expect(payload.commandsJson).toContain('"op":"host_tail"')
    expect(payload.commandsJson).toContain('translate_getViewerLanguage')
    const parsed = JSON.parse(payload.commandsJson ?? '{}') as {
      exec_mode?: string
      full_green_flag_starts?: unknown[]
    }
    expect(parsed.exec_mode).toBe('linear')
    expect(Array.isArray(parsed.full_green_flag_starts)).toBe(true)
    expect(parsed.full_green_flag_starts?.length ?? 0).toBeGreaterThan(0)
  })

  test('caches runtime precompile result per program module', () => {
    const program = createProgramModuleFromProject({
      projectJson: TEXT_TO_SPEECH_TRANSLATE_PROJECT,
    })
    const compileSpy = vi.spyOn(
      moonscratch as { vm_compile_from_json: (...args: unknown[]) => unknown },
      'vm_compile_from_json',
    )

    const first = createHeadlessVM({ program, initialNowMs: 0 })
    const second = createHeadlessVM({ program, initialNowMs: 0 })

    expect(first).toBeDefined()
    expect(second).toBeDefined()
    expect(compileSpy).toHaveBeenCalledTimes(1)
    compileSpy.mockRestore()
  })

  test('allows explicit runtime precompile before VM creation', () => {
    const runtime = createRuntime()
    const program = createProgramModuleFromProject({
      projectJson: TEXT_TO_SPEECH_TRANSLATE_PROJECT,
    })
    const compileSpy = vi.spyOn(
      moonscratch as { vm_compile_from_json: (...args: unknown[]) => unknown },
      'vm_compile_from_json',
    )

    precompileProgramForRuntime({ program, runtime })
    const vm = createHeadlessVM({ runtime, program, initialNowMs: 0 })

    expect(vm).toBeDefined()
    expect(compileSpy).toHaveBeenCalledTimes(1)
    compileSpy.mockRestore()
  })

  test('passes AOT command payload to runtime when present', () => {
    const program = createProgramModuleFromProject({
      projectJson: EXAMPLE_PROJECT,
    })
    const aotSpy = vi.spyOn(
      moonscratch as unknown as {
        vm_set_aot_commands_json: (...args: unknown[]) => unknown
      },
      'vm_set_aot_commands_json',
    )

    const vm = createHeadlessVM({ program, initialNowMs: 0 })
    vm.greenFlag()
    const frame = vm.stepFrame()

    expect(frame.stopReason).toBe('finished')
    expect(getStageVariables(vm).var_score).toBe(42)
    expect(aotSpy).toHaveBeenCalledTimes(1)
    aotSpy.mockRestore()
  })

  test('runs linear AOT logic through program wasm on green flag', () => {
    const program = createProgramModuleFromProject({
      projectJson: EXAMPLE_PROJECT,
    })
    expect(program.hasWasmExec()).toBe(true)

    const vm = createHeadlessVM({ program, initialNowMs: 0 })
    vm.greenFlag()

    expect(getStageVariables(vm).var_score).toBe(42)
    const frame = vm.stepFrame()
    expect(frame.stopReason).toBe('finished')
  })

  test('runs control/operator/data command graph through program wasm', () => {
    const program = createProgramModuleFromProject({
      projectJson: CONTROL_OPERATOR_DATA_PROJECT,
    })
    expect(program.hasWasmExec()).toBe(true)

    const vm = createHeadlessVM({ program, initialNowMs: 0 })
    vm.greenFlag()

    const vars = getStageVariables(vm)
    expect(vars.var_result).toBe(18)
    expect(vars.var_branch).toBe(1)
  })

  test('delegates unsupported opcode to moonbit host during wasm exec', () => {
    const program = createProgramModuleFromProject({
      projectJson: HOST_OPCODE_FALLBACK_PROJECT,
    })
    expect(program.hasWasmExec()).toBe(true)
    expect(program.readPayload().commandsJson).toContain('"op":"host_opcode"')

    const vm = createHeadlessVM({ program, initialNowMs: 0 })
    vm.greenFlag()
    const frame = vm.stepFrame()

    const vars = getStageVariables(vm)
    expect(vars.var_done).toBe(1)
    expect(frame.stopReason).toBe('finished')
  })

  test('creates VM from compiled program module', () => {
    const program = createProgramModuleFromProject({
      projectJson: TEXT_TO_SPEECH_TRANSLATE_PROJECT,
    })
    const vm = createHeadlessVM({
      program,
      initialNowMs: 0,
      viewerLanguage: 'ja',
    })

    vm.greenFlag()
    stepMany(vm, 6)

    const effects = vm.takeEffects()
    expect(effects.some((effect) => effect.type === 'text_to_speech')).toBe(
      true,
    )
  })

  test('reuses compiled program module across multiple VM instances', () => {
    const program = createProgramModuleFromProject({
      projectJson: TEXT_TO_SPEECH_TRANSLATE_PROJECT,
    })
    const first = createHeadlessVM({ program, initialNowMs: 0 })
    const second = createHeadlessVM({ program, initialNowMs: 0 })

    first.greenFlag()
    second.greenFlag()
    stepMany(first, 6)
    stepMany(second, 6)

    expect(getStageVariables(first)).toEqual(getStageVariables(second))
  })

  test('normalizes viewer language and translate cache in constructor options', () => {
    const program = createProgramModuleFromProject({
      projectJson: TEXT_TO_SPEECH_TRANSLATE_PROJECT,
    })
    const vm = createHeadlessVM({
      program,
      viewerLanguage: ' JA ',
      translateCache: { JA: { hello: 'こんにちは' } },
    })

    vm.greenFlag()
    stepMany(vm, 6)

    const effects = vm.takeEffects()
    expect(effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'text_to_speech',
          waitKey: 'text2speech_done_1',
          language: 'ja',
        }),
      ]),
    )
    expect(effects.some((effect) => effect.type === 'translate_request')).toBe(
      false,
    )

    vm.ackTextToSpeech('text2speech_done_1')
    stepMany(vm, 10)

    const stageVars = getStageVariables(vm)
    expect(stageVars.var_viewer).toBe('ja')
    expect(stageVars.var_trans).toBe('こんにちは')
    expect(stageVars.var_done).toBe(1)
  })

  test('loads missing costume assets from Scratch CDN', async () => {
    const fetchAsset = vi.fn(async () => ({
      ok: true,
      status: 200,
      statusText: 'OK',
      arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
    }))
    const decodeImageBytes = vi.fn(async () => ({
      width: 1,
      height: 1,
      rgbaBase64: 'AP8A/w==',
    }))

    const vm = await createHeadlessVMWithScratchAssets({
      projectJson: {
        targets: [
          {
            isStage: true,
            name: 'Stage',
            variables: {},
            lists: {},
            blocks: {},
            costumes: [
              {
                name: 'backdrop1',
                assetId: 'bg_green',
                md5ext: 'bg_green.png',
                bitmapResolution: 1,
                rotationCenterX: 0,
                rotationCenterY: 0,
              },
            ],
          },
        ],
      },
      fetchAsset,
      decodeImageBytes,
    })

    expect(vm).toBeDefined()
    expect(fetchAsset).toHaveBeenCalledWith(
      'https://cdn.scratch.mit.edu/internalapi/asset/bg_green.png/get/',
    )
    expect(decodeImageBytes).toHaveBeenCalledTimes(1)
  })
})
