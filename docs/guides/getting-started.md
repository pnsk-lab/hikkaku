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

```ts twoslash
// @twoslash-cache: {"v":1,"hash":"08c2bf152d42f209d065e900df0e3ce4e00d778cf840a218621e4c40575a62db","data":"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"}
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

```ts twoslash
// @twoslash-cache: {"v":1,"hash":"954cd8be86e94c7a64babd2167e4bc677d678aea9bdd1ef3360cb2ca485e5d93","data":"N4Igdg9gJgpgziAXAbVAFwJ4AcZJACwgDcYAnEAGhDRgA808AKAQwBsBLZuASgAIAzAK5gAxmnYQwvfOwDWs5rMGN2YdmkS8AEnIVKAaupgBJNWm6aACq0EBzVQHks4yQB01AWywRSaabsVBShA4NGZfJAB2KlYYMFs0fCiqMNJbGAZEAgClYI4wXEQABioRfHDmMTIogF8KdGxCgmJqlLpMkBYOLj4hURcpWH5VGABhSWHbRhEJ9ltNAFU4MnGwSYteJZXZ215GAGoAVl4W0lYIZiged3YvHz8hkdXJ4KgIEQQsgBVG6RhWHCkXhoCC8DyKGC8dS8GBcdhkYGgwTLXhEIwAOhmazm6LQcHclREMGccF4zF4UHYpBgYl47mAAAF8rI6WAtqRnnN3DV3CcAEYAKxpaAoJyB5L6YgkUkSzD81LQglIYFJ6nR7i++EhkoGvGpRPYJFJ5PpTNULPcnNsAFEwERubyIILhejgqFwpkACyemJxBJJRAARgATClwukOo8Cla8iMkIHSuVSJUaOREABOOoNHB4QgkchtehMNicHgUmDDaM7aY7RbLDk7Dbsq17I4nfPnS7XTzeXzlytjHavd6fEA/HB/AEIkFgiFQvywuDwoEz5GQtE0TE7XH4sCE4l4skUqnC1mM5ms5s7B1SJ1CsSinxHnXS4HleUZJUq+fqsCa7XCFKkh6jSMCGvAR6mhelo7La9pgDyt7OmIrpUO6ESIAAHNEICxPEiTxqG1DhhkeBRoO2K2LGBRIAAzImFRVGmgaHFm1CNLmpzBDQRZZIwWCkBAgKYHwV6UeiWA2PYKoAPxWFJjjONKyAALq8AAPrwwjkVAw4fHgACCpDJhgJz8KiRi8JJdiqKSq7LKhISpJkgZFD6uF+gRiA4akEZ4NZ0kIDEcaIO5ZSMamSDBmxmA5lkeatNQ7TFt0ZYyPIgQqGYmg6BlBhGKY6gbNYNlgE4Aw3HcfbpXoQRoc58aBumvr4QGPkkR0NWBNRhSHAxyZMUgnoxRx8VcYWHT8YJwkYHwuW1YYNCFWg6JxGgpAYJooSkKoVH1R68a0X1HmtUgx2+aRWRrRtPVIAAbP1KbVIgd01CppTQE0ty9n4XVKAIgkeLwADkf2CAA9BuMDA5VP28MA/ZPDsvA1ADEBA8DUMw2A7h0HDQzMIIrAPBWSOUYwwC8lZCkqpoyBU7w/h5colNSIz7PXZtIPouDcCkCI4PgqoO7Y+zKPcFTKnctwwQeBkzBIKA7RxEukh4HiIA1DUQA"}
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
