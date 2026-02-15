# nakasyou/moonscratch

Headless Scratch runtime in MoonBit.

## What is implemented

- Loads Scratch 3 `project.json` (+ optional assets metadata map)
- Can fill missing costume assets from `cdn.scratch.mit.edu` (async API)
- Runs scripts from hats (`event_whenflagclicked`, `event_whenbroadcastreceived`)
- Supports core opcodes for:
  - `event`, `control`, `data`, `operator`
  - subset of `motion`, `looks`, `sound`, `sensing`
- Emits side effects as JSON event queue (`vm_take_effects_json`)

## MoonBit API

```mbt check
///|
test {
  let precompiled_result = try? @moonscratch.vm_compile_from_json(
    "{\"targets\":[{\"isStage\":true,\"name\":\"Stage\",\"variables\":{},\"lists\":{},\"blocks\":{}}]}",
  )
  let precompiled = match precompiled_result {
    Ok(value) => value
    Err(_) => fail("failed to precompile project")
  }
  let vm_result = try? @moonscratch.vm_new_from_compiled(precompiled)
  let vm = match vm_result {
    Ok(value) => value
    Err(_) => fail("failed to create vm")
  }
  @moonscratch.vm_start(vm)
  @moonscratch.vm_set_time(vm, 33)
  let report = @moonscratch.vm_step_frame(vm)
  let snapshot_json = @moonscratch.vm_snapshot_json(vm)
  inspect(report.active_threads >= 0, content="true")
  inspect(snapshot_json.contains("targets"), content="true")
}
```

## JavaScript setup

Build JS artifacts:

```bash
moon build --target js
```

Use the JS wrapper:

```bash
node js/example.mjs
```

Wrapper file: `js/headless-vm.mjs`

```js
import {
  createHeadlessVM,
  createProgramModuleFromProject,
  createHeadlessVMWithScratchAssets,
} from './js/headless-vm.mjs'

const program = createProgramModuleFromProject({ projectJson, assets })
const vm = createHeadlessVM({ program, options })
vm.greenFlag()
vm.setTime(Date.now())
vm.stepFrame()
const effects = vm.takeEffects()
const snapshot = vm.snapshot()

const vmWithScratchAssets = await createHeadlessVMWithScratchAssets({
  projectJson,
  assets,
  options,
})
```

## Verification

```bash
moon check
moon test
```
