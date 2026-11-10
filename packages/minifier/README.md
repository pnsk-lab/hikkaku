# @hikkaku/minifier

Minify Scratch 3 `project.json` files by removing unreachable block data and shortening display names used by Scratch UI metadata.

## Install

```sh
bun add @hikkaku/minifier
```

## Core API

```ts
import { minifyScratchProject, minifyScratchProjectJson } from '@hikkaku/minifier'

const minifiedProject = minifyScratchProject(project)
const minifiedJson = minifyScratchProjectJson(JSON.stringify(project))
```

## Vite plugin

```ts
import { defineConfig } from 'vite'
import { scratchProjectMinifier } from '@hikkaku/minifier/vite'

export default defineConfig({
  plugins: [scratchProjectMinifier()],
})
```

By default the Vite plugin rewrites emitted `project.json` assets.

## What it removes

- Unreachable blocks, shadow blocks, and top-level variable/list reporter primitives.
- Hidden fallback values behind obscured inputs like `[a + b]` when only `a` is actually used.
- Empty block metadata such as `next: null`, `parent: null`, `shadow: false`, and empty `inputs` / `fields`.
- The verbose `meta.agent` field.

## What it renames

- Variables
- Lists
- Broadcast messages
- Costume names
- Sound names
- Sprite names

## Caveat

Costume, sound, and sprite names are referenced by Scratch as strings in several menu blocks. This package rewrites the common static menu references, but it cannot prove or rewrite dynamically constructed strings. If your project switches costumes, sounds, or sprites by assembling strings at runtime, disable those renames.
