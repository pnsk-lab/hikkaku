# @hikkaku/testing

`@hikkaku/testing` provides utilities for running Scratch projects created with `hikkaku` via
`moonscratch`, with APIs designed for easy assertions in Vitest-style tests.

## Install

```bash
bun install @hikkaku/testing
```

## API

- `toScratchProject(project)`  
  Converts a Hikkaku `Project`, a Scratch JSON object, or a Scratch JSON string into a `ScratchProject`.
- `createProjectHarness(project, options)`  
  Creates a VM and returns a `TestHarness`. Use `setup` to inject initial events, and `autoStart` to automatically call `greenFlag`.
- `runProjectUntilIdle(project, options)`  
  Creates a harness, runs `greenFlag`, executes `runUntilIdle`, and returns the result.
- `runProjectFrames(project, frameCount, options)`  
  Runs `runFrames` for a specific number of frames.
- `snapshotTarget`, `snapshotVariable`  
  Harness helpers for extracting snapshot target data and variable values.
- `createHeadlessVMFromProject`, `createHeadlessVMWithScratchAssets`  
  Re-exported MoonScratch helpers for advanced usage.

## Example (Vitest)

```ts
import { Project } from 'hikkaku'
import { setVariableTo, whenFlagClicked } from 'hikkaku/blocks'
import { describe, expect, test } from 'vitest'
import {
  getSnapshotVariable,
  runProjectUntilIdle,
} from '@hikkaku/testing'

describe('sample project', () => {
  test('runs hikkaku project and updates variable', async () => {
    const project = new Project()
    const score = project.stage.createVariable('score', 0)

    project.stage.run(() => {
      whenFlagClicked(() => {
        setVariableTo(score, 42)
      })
    })

    const result = await runProjectUntilIdle(project, {
      maxFrames: 5,
    })
    const liveScore = getSnapshotVariable(result.snapshot, score)

    expect(liveScore).toBeDefined()
    expect(liveScore).toBe(42)
  })
})
```

## Options

- `withScratchAssets: boolean`  
  Set to `true` to use `createHeadlessVMWithScratchAssets` (for projects with assets that require CDN resolution).
- `setup(ctx)`  
  Runs right after harness creation; useful for injecting events before `greenFlag`.
- `autoStart: boolean`  
  If `false`, you must call `harness.start()` manually.
- `maxFrames`  
  Maximum frame limit passed to `runUntilIdle` in `runProjectUntilIdle`.
