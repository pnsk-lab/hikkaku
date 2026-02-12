# Getting Started

## What Hikkaku Is

Hikkaku lets you write Scratch projects in TypeScript.

Important: code inside `run()` handlers defines Scratch runtime behavior. It is compiled into Scratch blocks, not executed as normal JavaScript at runtime.

## Scaffold a New Project

Use `create-hikkaku` to generate a project from the official template (`examples/base`).

```sh
npx create-hikkaku@latest my-hikkaku-app
# or
bun create hikkaku@latest my-hikkaku-app
```

Common options:

- `-y`, `--yes`: skip prompts and use defaults
- `--pm <pm>`: force package manager (`bun`, `deno`, `npm`, `pnpm`, `yarn`)
- `--agents`, `--no-agents`: include or exclude `AGENTS.md`
- `--link-claude`, `--no-link-claude`: create or skip `CLAUDE.md -> AGENTS.md`
- `--skills`, `--no-skills`: run or skip skills setup after scaffolding
- `--ref <git-tag>`: use a specific template tag (default: `create-hikkaku@<version>`)

Example:

```sh
npx create-hikkaku@latest my-hikkaku-app -y --pm bun --skills
cd my-hikkaku-app
bun install
bun dev
```

## Manual Setup

### Install

```sh
bun add hikkaku
```

### Your First Project

```ts
import { Project } from 'hikkaku'
import { IMAGES } from 'hikkaku/assets'
import { moveSteps, whenFlagClicked } from 'hikkaku/blocks'

const project = new Project()
const cat = project.createSprite('Cat')

cat.addCostume({
  ...IMAGES.CAT_A,
  name: 'cat-a'
})

cat.run(() => {
  whenFlagClicked(() => {
    moveSteps(10)
  })
})

export default project
```

## With Vite

```ts
import hikkaku from 'hikkaku/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    hikkaku({
      entry: './src/main.ts'
    })
  ]
})
```

Run your app with Vite and open the local dev URL.

## Next Steps

1. Read [Project Basics](/guides/usage) to understand project structure and safe runtime patterns.
2. Read [Calculations](/guides/calculate) to avoid invalid JavaScript operators in runtime logic.
3. Keep [Blocks Overview](/reference/blocks/overview) open while implementing features.

or you can try hikkaku with [Playground](/playground).
