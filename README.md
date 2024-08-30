# Hikkaku
[![JSR](https://jsr.io/badges/@pnsk-lab/hikkaku)](https://jsr.io/@pnsk-lab/hikkaku)

Scratch with TypeScript.

## Usage

### Install
```ts
deno add @pnsk-lab/hikkaku
```

### Config

Create config file:
```ts
// hikkaku.config.ts
import { defineConfig } from 'hikkaku/config'

export default defineConfig({
  project: import.meta.resolve('./main.ts'),
  assetsDir: `${import.meta.dirname}/assets`
})
```

### Code
```ts
import { forever } from '@pnsk-lab/hikkaku/blocks/control'
import { changeXBy } from '@pnsk-lab/hikkaku/blocks/motion'
import { getMouseX } from '@pnsk-lab/hikkaku/blocks/sensing'
import { Project } from '@pnsk-lab/hikkaku'

// Define Project
const project = new Project({
  stage: {
    costumes: [
      // Stage Assets
      {
        id: 'blank',
        data:
          'https://cdn.assets.scratch.mit.edu/internalapi/asset/cd21514d0531fdffb22204e0ec5ed84a.svg/get/',
      },
    ],
  },
})

// Create Cat
const cat = project.addSprite({
  name: 'cat',
  costumes: [
    {
      id: 'cat',
      data:
        'https://cdn.assets.scratch.mit.edu/internalapi/asset/b7853f557e4426412e64bb3da6531a99.svg/get/',
    },
  ],
})

cat.addOnFlag(() => {
  forever(() => {
    changeXBy(getMouseX())
  })
})

export default project
```

This code is compiled as
![IMG_3668](https://github.com/user-attachments/assets/176e2106-5314-4b04-b86f-4eb2b8286e0c)

### Development
If you run it, you can use development server!
```ts
import config from './hikkaku.config.ts'
import { startDev } from '@pnsk-lab/hikkaku/dev'

startDev(config)
```
![IMG_3669](https://github.com/user-attachments/assets/d94c4fab-8791-4521-a6f5-48ef21dd1b77)
In future, it may contain HMR.

