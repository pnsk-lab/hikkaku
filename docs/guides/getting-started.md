# Getting Started

## What Hikkaku Is

Hikkaku lets you write Scratch projects in TypeScript.

Important: code inside `run()` handlers defines Scratch runtime behavior. It is compiled into Scratch blocks, not executed as normal JavaScript at runtime.

## Install

```sh
bun add hikkaku
```

## Your First Project

```ts
import { Project } from 'hikkaku'
import { CAT_A } from 'hikkaku/assets'
import { moveSteps, whenFlagClicked } from 'hikkaku/blocks'

const project = new Project()
const cat = project.createSprite('Cat')

cat.addCostume({
  ...CAT_A,
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
