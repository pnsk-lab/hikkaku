---
title: base usage
impact: HIGH
---

## Base sample code

```ts
import { Project } from 'hikkaku'
import { ASSET_CAT1, ASSET_CAT2, Project } from 'hikkaku'
import {
  getMouseX,
  gotoXY,
  procedureBoolean,
  procedureLabel,
  whenFlagClicked,
  forever,
} from 'hikkaku/blocks'

const project = new Project()

const sprite1 = project.createSprite('Sprite1') // create sprite
const cat1 = sprite1.addCostume({
  name: 'cat1',
  assetId: ASSET_CAT1,
  dataFormat: 'svg',
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

export default project

import.meta.hot?.send('hikkaku:project', project.toScratch()) // for Vite
```

Stage is a background area where sprites perform actions. The stage is created automatically when you create a project. Basic usage of stage is like sprites.

```ts
const stage = project.stage // get stage
const bg1 = stage.addCostume({
  // it is same as sprite
})

bg1.run(() => {
  whenFlagClicked(() => {
    switchCostumeTo(bg1) // switch stage costume
  })
})
```

