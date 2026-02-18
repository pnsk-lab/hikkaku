import { describe, expect, test, vi } from 'vite-plus/test'
import {
  EXAMPLE_PROJECT,
  getStageVariables,
  HOST_OPCODE_FALLBACK_PROJECT,
  stepMany,
  TEXT_TO_SPEECH_TRANSLATE_PROJECT,
  WASM_MATHOP_LOOP_COUNT_ID,
  WASM_MATHOP_LOOP_PROJECT,
  WASM_ONLY_HIKKAKU_BRANCH_ID,
  WASM_ONLY_HIKKAKU_PROJECT,
  WASM_ONLY_HIKKAKU_RESULT_ID,
} from '../test/test-projects.ts'
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

const DRAW_OPCODE_PROJECT = JSON.stringify({
  targets: [
    {
      isStage: true,
      name: 'Stage',
      variables: {},
      lists: {},
      blocks: {},
    },
    {
      isStage: false,
      name: 'Sprite1',
      variables: {},
      lists: {},
      blocks: {
        hat: {
          opcode: 'event_whenflagclicked',
          next: 'pen_clear',
          parent: null,
          inputs: {},
          fields: {},
          topLevel: true,
        },
        pen_clear: {
          opcode: 'pen_clear',
          next: 'move_x',
          parent: 'hat',
          inputs: {},
          fields: {},
          topLevel: false,
        },
        move_x: {
          opcode: 'motion_changexby',
          next: 'move_y',
          parent: 'pen_clear',
          inputs: {
            DX: [1, [4, 12]],
          },
          fields: {},
          topLevel: false,
        },
        move_y: {
          opcode: 'motion_changeyby',
          next: null,
          parent: 'move_x',
          inputs: {
            DY: [1, [4, -8]],
          },
          fields: {},
          topLevel: false,
        },
      },
    },
  ],
})

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

  test('builds project WASM bytes through moonbit binding by default', () => {
    const compileWasmSpy = vi.spyOn(
      moonscratch as unknown as {
        vm_compile_project_to_wasm: (...args: unknown[]) => unknown
      },
      'vm_compile_project_to_wasm',
    )
    const compiled = compileProjectToWasm({
      projectJson: TEXT_TO_SPEECH_TRANSLATE_PROJECT,
    })
    expect(compiled.wasmBytes.byteLength).toBeGreaterThan(8)
    expect(compileWasmSpy).toHaveBeenCalledTimes(1)
    compileWasmSpy.mockRestore()
  })

  test('embeds AOT command payload for eligible linear green-flag scripts', () => {
    const program = createProgramModuleFromProject({
      projectJson: EXAMPLE_PROJECT,
    })
    const payload = program.readPayload()
    expect(payload.commandsJson).toBeDefined()
    expect(payload.commandsJson).toMatch(/"op":"set_var_(num_expr|json_const)"/)
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

  test('runs control/operator/data command graph through wasm with host-tail bridge when needed', () => {
    const program = createProgramModuleFromProject({
      projectJson: WASM_ONLY_HIKKAKU_PROJECT,
    })
    expect(program.hasWasmExec()).toBe(true)
    expect(program.readPayload().commandsJson).not.toContain(
      '"op":"host_opcode"',
    )
    expect(program.readPayload().commandsJson).toContain('"op":"host_tail"')

    const execOpcodeSpy = vi.spyOn(
      moonscratch as unknown as {
        vm_exec_opcode_once_by_pc: (...args: unknown[]) => number
      },
      'vm_exec_opcode_once_by_pc',
    )
    const execTailSpy = vi.spyOn(
      moonscratch as unknown as {
        vm_exec_script_tail_by_pc: (...args: unknown[]) => number
      },
      'vm_exec_script_tail_by_pc',
    )

    const vm = createHeadlessVM({ program, initialNowMs: 0 })
    vm.greenFlag()
    const frame = vm.stepFrame()

    const vars = getStageVariables(vm)
    expect(vars[WASM_ONLY_HIKKAKU_RESULT_ID]).toBeLooselyEqual(18)
    expect(vars[WASM_ONLY_HIKKAKU_BRANCH_ID]).toBeLooselyEqual(1)
    expect(frame.stopReason).toBe('finished')
    expect(execOpcodeSpy).toHaveBeenCalledTimes(0)
    expect(execTailSpy).toHaveBeenCalled()
    execOpcodeSpy.mockRestore()
    execTailSpy.mockRestore()
  })

  test('executes repeat-until mathop expressions through wasm without host-tail fallback', () => {
    const program = createProgramModuleFromProject({
      projectJson: WASM_MATHOP_LOOP_PROJECT,
    })
    expect(program.hasWasmExec()).toBe(true)
    expect(program.readPayload().commandsJson).not.toContain(
      '"op":"host_opcode"',
    )
    expect(program.readPayload().commandsJson).not.toContain('"op":"host_tail"')

    const vm = createHeadlessVM({ program, initialNowMs: 0 })
    vm.greenFlag()
    const frame = vm.stepFrame()

    const vars = getStageVariables(vm)
    expect(vars[WASM_MATHOP_LOOP_COUNT_ID]).toBe(3)
    expect(frame.stopReason).toBe('finished')
  })

  test('executes motion/pen draw commands through draw-opcode bridge', () => {
    const program = createProgramModuleFromProject({
      projectJson: DRAW_OPCODE_PROJECT,
    })
    const commandsJson = program.readPayload().commandsJson ?? ''
    expect(commandsJson).toContain('"op":"draw_opcode"')
    expect(commandsJson).not.toContain('"op":"host_tail"')

    const execDrawSpy = vi.spyOn(
      moonscratch as unknown as {
        vm_exec_draw_opcode: (...args: unknown[]) => number
      },
      'vm_exec_draw_opcode',
    )
    const execOpcodeSpy = vi.spyOn(
      moonscratch as unknown as {
        vm_exec_opcode_once_by_pc: (...args: unknown[]) => number
      },
      'vm_exec_opcode_once_by_pc',
    )

    const vm = createHeadlessVM({ program, initialNowMs: 0 })
    vm.greenFlag()
    const frame = vm.stepFrame()

    const sprite = vm
      .snapshot()
      .targets.find((target) => target.name === 'Sprite1')
    expect(frame.stopReason).toBe('finished')
    expect(sprite?.x).toBe(12)
    expect(sprite?.y).toBe(-8)
    expect(execDrawSpy).toHaveBeenCalled()
    expect(execOpcodeSpy).toHaveBeenCalledTimes(0)

    execDrawSpy.mockRestore()
    execOpcodeSpy.mockRestore()
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

  test('keeps VM execution state isolated even when precompiled caches are reused', () => {
    const program = createProgramModuleFromProject({
      projectJson: EXAMPLE_PROJECT,
    })
    const first = createHeadlessVM({ program, initialNowMs: 0 })
    const second = createHeadlessVM({ program, initialNowMs: 0 })

    first.greenFlag()
    stepMany(first, 2)
    first.renderFrame()

    expect(getStageVariables(first).var_score).toBe(42)
    expect(getStageVariables(second).var_score).toBe(0)

    second.renderFrame()
    expect(getStageVariables(second).var_score).toBe(0)

    second.greenFlag()
    stepMany(second, 2)
    expect(getStageVariables(second).var_score).toBe(42)
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
