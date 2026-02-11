<img src="https://raw.githubusercontent.com/pnsk-lab/hikkaku/refs/heads/feat/main/docs/assets/logo.svg" alt="Hikkaku Logo" width="128" height="128" align="right" />

# Hikkaku

[![NPM Version](https://img.shields.io/npm/v/hikkaku)](https://www.npmjs.com/package/hikkaku)

Scratch with TypeScript.

## Installation

```bash
bun add hikkaku # Bun
deno add npm:hikkaku # Deno
pnpm add hikkaku # pnpm
yarn add hikkaku # Yarn
npm install hikkaku # npm
```

## Usage

### Basic Usage

```ts
import { Project } from 'hikkaku'
import { CATCHER_A } from 'hikkaku/assets'
import {
  getMouseX,
  gotoXY,
  procedureBoolean,
  procedureLabel,
  whenFlagClicked,
  forever,
  switchCostumeTo,
} from 'hikkaku/blocks'

const project = new Project()

const sprite1 = project.createSprite('Sprite1') // create sprite
const cat1 = sprite1.addCostume({
  ...CATCHER_A,
  name: 'cat1',
}) // create costume

sprite1.run(() => {
  // event blocks (hat blocks) should be inside run() directly
  whenFlagClicked(() => {
    // this scope is for when flag clicked
    gotoXY(0, 0) // go to x:0 y:0
    switchCostumeTo(cat1) // switch costume to cat1
    forever(() => {
      gotoXY(getMouseX(), 0) // follow mouse x
    }) // control block. This can nest other blocks.
  })
  // or other event blocks
})

console.log(project.toScratch()) // get Scratch project JSON
```
By runnning this code, you will get a Scratch project JSON that you can load in Scratch editor.

### With Vite

Integrate Hikkaku with Vite to develop Scratch projects with hot-reloading.

Put `vite.config.ts` in your project root:

```ts
import hikkaku from 'hikkaku/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    hikkaku({
      entry: './src/main.ts',
    }),
  ],
})
```

Then, put your Scratch project code in `src/main.ts`:

```ts
import { Project } from 'hikkaku'
import { CAT_A } from 'hikkaku/assets'
import { moveSteps, whenFlagClicked } from 'hikkaku/blocks'

const project = new Project()

const cat = project.createSprite('cat')

cat.addCostume({
  ...CAT_A,
  name: 'cat-a',
})
cat.run(() => {
  whenFlagClicked(() => {
    moveSteps(10)
  })
})

export default project
```

`bun vite` and open `http://localhost:5173` to see your Scratch project in action!

<img width="1060" height="521" alt="image" src="https://github.com/user-attachments/assets/16cf0b28-7ceb-4dbf-9247-adea5fd48a11" />

You can HMR powered by Vite Environment API:

https://github.com/user-attachments/assets/1ff5d190-f8ee-46c4-bc78-8dbdf2879e15

### Vibe Code with skills

Hikkaku has a skills for AI Agents, so you can vibe code with AI such as Codex, Claude Code, OpenCode and etc.

```bash
bunx skills add pnsk-lab/hikkaku # Bun
deno run -NRWE --allow-run="git" --allow-sys="homedir" npm:skills add pnsk-lab/hikkaku # Deno
pnpx skills add pnsk-lab/hikkaku # pnpm
yarn dlx skills add pnsk-lab/hikkaku # Yarn
npx skills add pnsk-lab/hikkaku # npm
```

### Build project

Not support yet. To get .sb3 file, you need to download the project file using dev server, or manually convert JSON to .sb3 using external tools.
