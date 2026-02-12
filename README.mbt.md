# nakasyou/moonscratch

Headless Scratch runtime in MoonBit.

## What is implemented

- Loads Scratch 3 `project.json` (+ optional assets metadata map)
- Runs scripts from hats (`event_whenflagclicked`, `event_whenbroadcastreceived`)
- Supports core opcodes for:
  - `event`, `control`, `data`, `operator`
  - subset of `motion`, `looks`, `sound`, `sensing`
- Emits side effects as JSON event queue (`vm_take_effects_json`)

## MoonBit API

```mbt check
///|
test {
  let vm_result = try? @moonscratch.vm_new_from_json(
    "{\"targets\":[{\"isStage\":true,\"name\":\"Stage\",\"variables\":{},\"lists\":{},\"blocks\":{}}]}",
  )
  let vm = match vm_result {
    Ok(vm) => vm
    Err(_) => fail("failed to create vm")
  }
  @moonscratch.vm_start(vm)
  let report = @moonscratch.vm_step(vm, 16)
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
import { createHeadlessVM } from './js/headless-vm.mjs'

const vm = createHeadlessVM({ projectJson, assets, options })
vm.greenFlag()
vm.step(16)
const effects = vm.takeEffects()
const snapshot = vm.snapshot()
```

## Verification

```bash
moon check
moon test
```
