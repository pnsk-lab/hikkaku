# VM Usage

This folder provides a headless runtime API for running Scratch projects in TypeScript.

Exports are available from `moonscratch` (the package entrypoint) and from
`packages/moonscratch/js/vm` during local development.

## Install and import

```ts
import {
  createHeadlessVM,
  createHeadlessVMWithScratchAssets,
  HeadlessVM,
} from 'moonscratch';
```

`createVM` and `createVMWithScratchAssets` are aliases of the two create functions.

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

const vm = createHeadlessVM({
  projectJson,
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
const frame = vm.stepFrame(); // default: 1 frame at 30 fps
console.log(frame.nowMs, frame.activeThreads);
```

- `stepFrame(frameCount = 1, frameMs = 1000 / 30)` advances by frames.
  - `frameCount` is the number of frames to run.
  - `frameMs` is the duration of each frame in milliseconds.
  - You can change FPS by passing `frameMs` (for 60 fps use `1000 / 60`).

## Input events

`HeadlessVM` exposes helpers to send I/O:

```ts
vm.setAnswer('Scratch');
vm.setMouseState({ x: 120, y: 80, isDown: true });
vm.setKeysDown(['space', 'arrowup']);
vm.setTouching({ Sprite1: ['_mouse_'] });
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
const snapshot = vm.snapshot();
const json = vm.snapshotJson();
const svg = vm.renderSvg();

// Types:
// snapshot: VMSnapshot
// svg: SVG string
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
- `vm.setTranslateResult(words, language, translated)`: seed translate cache.
- `vm.setTranslateCache(cache)` / `vm.clearTranslateCache()`.
