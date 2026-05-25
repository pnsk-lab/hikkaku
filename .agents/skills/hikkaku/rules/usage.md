---
title: base usage
impact: HIGH
---

## Base sample code

```ts
import { Project } from 'hikkaku'
import { IMAGES } from 'hikkaku/assets'
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
  ...IMAGES.CATCHER_A,
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

export default project

import.meta.hot?.send('hikkaku:project', project.toScratch()) // for Vite
```

Stage is a background area where sprites perform actions. The stage is created automatically when you create a project. Basic usage of stage is like sprites.

```ts
const stage = project.stage // get stage
const bg1 = stage.addCostume({
  ...IMAGES.CATCHER_A,
  name: 'bg1',
})

stage.run(() => {
  whenFlagClicked(() => {
    switchCostumeTo(bg1) // switch stage costume
  })
})
```

You can also use `project.addCostume()` and `project.addSound()` as shortcuts for stage assets.


## Attention

This TypeScript code is not runnable directly, this is for compilation to Scratch project file.
This means you cannot use normal JavaScript/TypeScript features like DOM manipulation, console.log, etc.

This code is safe:
```ts
const x = Number.parseInt(await readFile('input.txt'), 10)

sprite1.run(() => {
  whenFlagClicked(() => {
    gotoXY(x, 10) // use variables
  })
})
```
The code runs on Node.js environment to generate Scratch project file.

This code is NOT safe:
```ts
sprite1.run(() => {
  whenFlagClicked(() => {
    console.log('Hello, world!') // This does not work
    document.body.style.backgroundColor = 'red' // This does not 
    fetch('https://example.com') // This does not work
    readFile('input.txt') // This does not work
    gotoXY(Math.random() * 100, 10) // This does not work, just embed a random number in project file
    gotoXY(getMouseX() > 0 ? -1 : 1, 10) // You cannot use `>` or other operators
  })
})
```

You cannot use browser or Node.js APIs inside `run()` or block handlers. These effects are running only once in compile time, not in Scratch runtime.
