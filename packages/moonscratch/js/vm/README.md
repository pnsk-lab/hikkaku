# VM Usage

This folder provides a headless runtime API for running Scratch projects in TypeScript.

Exports are available from `moonscratch` (the package entrypoint) and from
`packages/moonscratch/js/vm` during local development.

## Install and import

```ts
import {
  createHeadlessVM,
  createHeadlessVMFromProject,
  createHeadlessVMWithScratchAssets,
  precompileProgramForRuntime,
  createProgramModuleFromProject,
  HeadlessVM,
} from 'moonscratch';
```

`createVM`, `createVMFromProject`, and `createVMWithScratchAssets` are aliases.

## Basic usage

```ts
import { createHeadlessVM } from 'moonscratch';

// Any Scratch 3.0 project JSON object or string.
const projectJson = {
  meta: { semver: '3.0.0', vm: '0.2.0', agent: 'example' },
  targets: [
    {
      isStage: true,
      name: 'Stage',
      currentCostume: 0,
      variables: {},
      lists: {},
      broadcasts: {},
      costumes: [],
      sounds: [],
      blocks: {},
    },
  ],
};

const program = createProgramModuleFromProject({ projectJson });
const vm = createHeadlessVM({
  program,
  options: {
    turbo: true,
    deterministic: true,
    seed: 123,
    compatibility_30tps: false,
  },
  viewerLanguage: 'en',
});

vm.start();     // initialize runtime state (optional in many cases)
vm.greenFlag(); // press green flag
vm.setTime(Date.now()); // update runtime clock explicitly
const frame = vm.stepFrame(); // run until rerender/finished/timeout event
console.log(frame.activeThreads);

// Reuse the compiled program module for many VM instances.
const vm2 = createHeadlessVM({ program });

// Convenience helper: compile + instantiate + create VM in one call.
const vm3 = createHeadlessVMFromProject({ projectJson });

// Optional: precompile runtime artifact once, then create VMs.
precompileProgramForRuntime({ program });
const vm4 = createHeadlessVM({ program });
```

- `stepFrame()` advances until one of three events happens.
  - `stopReason: 'rerender' | 'finished' | 'timeout'`.
- `setTime(nowMs)` updates the runtime clock used by timer/wait behavior.

## Input state

`HeadlessVM` exposes helpers to update I/O state:

```ts
vm.setAnswer('Scratch');
vm.setMouseState({ x: 120, y: 80, isDown: true });
vm.setKeysDown(['space', 'arrowup']);
vm.setTouching({ Sprite1: ['_mouse_'] });
vm.setMouseTargets({ stage: true, targets: ['Sprite1'] });
vm.setBackdrop('bg2');
vm.postIO('username', 'alice'); // value as JsonValue
vm.postIORawJson('loudness', '12');
vm.broadcast('GO');
```

## Effects

### Pull effects manually

```ts
const effects = vm.takeEffects();
for (const effect of effects) {
  if (effect.type === 'log') {
    console.log(effect.level, effect.message);
  }
}
```

### Handle effects with handlers

```ts
await vm.handleEffects({
  async translate({ words }) {
    return words === 'hello' ? 'こんにちは' : null;
  },
  async textToSpeech(effect) {
    await speak(effect.words, effect.voice);
    vm.ackTextToSpeech(effect.waitKey);
  },
  musicNote(effect) {
    playNote(effect.instrument, effect.note, effect.beats);
  },
  async musicDrum(effect) {
    playDrum(effect.drum, effect.beats);
  },
  effect(effect) {
    console.log('effect:', effect);
  },
});
```

`handleEffects` consumes the current effect queue and dispatches to provided handlers.

## Snapshot and rendering

```ts
import { createHeadlessVM, renderWithSVG, renderWithSharp, renderWithWebGL } from 'moonscratch';

const snapshot = vm.snapshot();
const json = vm.snapshotJson();
const frame = vm.renderFrame();
const svg = renderWithSVG(frame);
const png = await renderWithSharp(frame);
const webgl = renderWithWebGL(frame);

// Types:
// snapshot: VMSnapshot
// frame: RenderFrame
// svg: SVG string
// png: Buffer
// webgl: { canvas, toImageData(), toImageElement() }
```

## Assets

Use `createHeadlessVMWithScratchAssets` to load missing Scratch costume assets
automatically from CDN.

```ts
const vm = await createHeadlessVMWithScratchAssets({
  projectJson,
  scratchCdnBaseUrl: 'https://cdn.scratch.mit.edu/internalapi/asset',
  fetchAsset: (url) => fetch(url),
  decodeImageBytes: async (bytes) => {
    const image = await decodeToImage(bytes);
    return {
      width: image.width,
      height: image.height,
      rgbaBase64: image.rgbaBase64,
    };
  },
});
```

If you already have assets in memory, pass them via `assets` (`Record<string, JsonValue>`).
For missing ids, the API attempts to fetch and cache by `assetId` / `md5ext`.

## Utility methods

- `vm.raw`: underlying WASM runtime handle.
- `vm.stopAll()`: stop all running sounds/threads.
- `vm.setTime(nowMs)`: update VM clock (`sensing_timer`, waits, etc.).
- `vm.setTranslateResult(words, language, translated)`: seed translate cache.
- `vm.setTranslateCache(cache)` / `vm.clearTranslateCache()`.
