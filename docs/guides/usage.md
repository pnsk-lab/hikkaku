# Project Basics

## Mental Model

Hikkaku is a compile-time DSL for Scratch.

- Code outside `run()` executes in your JavaScript environment (build time).
- Code inside `run()` and block handlers defines Scratch runtime behavior.
- Do not use browser or Node APIs inside runtime handlers.

## Minimal Project Structure

```ts
import { Project } from 'hikkaku'
import { CATCHER_A } from 'hikkaku/assets'
import { forever, getMouseX, gotoXY, switchCostumeTo, whenFlagClicked } from 'hikkaku/blocks'

const project = new Project()
const player = project.createSprite('Player')
const costume = player.addCostume({
  ...CATCHER_A,
  name: 'player-a'
})

player.run(() => {
  whenFlagClicked(() => {
    gotoXY(0, 0)
    switchCostumeTo(costume)

    forever(() => {
      gotoXY(getMouseX(), 0)
    })
  })
})

export default project
```

## Stage Usage

The stage is created automatically.

```ts
const stage = project.stage
```

You can add costumes and scripts to the stage just like sprites.

## Safe and Unsafe Patterns

Safe: resolve values at compile time, then embed them in blocks.

```ts
const startX = 24

player.run(() => {
  whenFlagClicked(() => {
    gotoXY(startX, 0)
  })
})
```

Unsafe: runtime handlers calling JavaScript APIs.

```ts
player.run(() => {
  whenFlagClicked(() => {
    console.log('This is not Scratch runtime logic')
    fetch('https://example.com')
  })
})
```
