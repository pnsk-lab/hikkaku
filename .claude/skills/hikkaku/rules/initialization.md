---
title: Initialization Guidelines
impact: LOW
---

### 1. Judge the package manager

You can ask the user which package manager they want to use (npm, yarn, pnpm, bun, deno)...

### 2. Create a project

#### Using `create-hikkaku`

The recommended way to create a Hikkaku project is to use the `create-hikkaku` CLI tool.

```bash
bun create hikkaku@latest
deno run -A npm:create-hikkaku@latest
pnpm create hikkaku@latest
yarn create hikkaku@latest
npx create-hikkaku@latest
```

#### Manually setting up

1. Initialize a new project
  * Create `package.json`, `tsconfig.json`, etc.
    * example
      * npm: `npm init -y`
      * yarn: `yarn init -y`
      * pnpm: `pnpm init -y`
      * bun: `bun init -y`
      * deno: `deno init`
2. Install Hikkaku and Vite
  * `{packageManager} add hikkaku vite@8.0.0-beta.13`
3. Create `vite.config.ts` with the following content:
```ts
import { defineConfig } from 'vite'
import { hikkaku } from 'hikkaku/vite'

export default defineConfig({
  plugins: [hikkaku({ entry: 'src/main.ts' })],
})
```
4. Create `src/main.ts`

### 3. development commands

* `vite` to start development server
* `vite build` to build the project
  * The output `.sb3` file will be in `dist/` directory by default.
