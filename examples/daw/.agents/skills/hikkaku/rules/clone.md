---
title: "Clone"
description: "Clone"
impact: MEDIUM
---

Clone is a function to duplicate a sprite to create a new instance of it.
This is useful for creating multiple enemies, projectiles, or other objects in a game without manually creating each one, but it can be a bit tricky to implement correctly.

## 1) Basic Clone Implementation

Use `createClone()` to create a clone of the current sprite.
```ts
import { createClone } from 'hikkaku/blocks'

cat.run(() => {
  whenFlagClicked(() => {
    createClone() // create a clone of the cat sprite
  })
})
```

Clone will be created on the point where the original sprite is located. Clone will have the same costumes, size, direction, and other properties as the original sprite at the time of cloning.

## 2) Handling Clone Behavior

When flag is clicked, all clones are deleted, so you can't rely on the `whenFlagClicked` block to initialize clone behavior.
Instead, use the `controlStartAsClone` block to define behavior for clones.

```ts
import { createClone, controlStartAsClone, say, CREATE_CLONE_MYSELF } from 'hikkaku/blocks'

cat.run(() => {
  whenFlagClicked(() => {
    createClone(CREATE_CLONE_MYSELF) // create a clone of the cat sprite
    createClone('sprite2') // create a clone of sprite2
  })

  controlStartAsClone(() => {
    say('I am a clone!') // behavior for the clone
  })
})
```

This way, when a clone is created, it will execute the code inside the `controlStartAsClone` block, allowing you to define specific behaviors for clones separate from the original sprite.

You can use `forever` inside it.

```ts
import { createClone, controlStartAsClone, forever, moveSteps } from 'hikkaku/blocks'

cat.run(() => {
  whenFlagClicked(() => {
    createClone() // create a clone of the cat sprite
  })

  controlStartAsClone(() => {
    forever(() => {
      moveSteps(10) // clones will keep moving forward
    })
  })
})
```

Moreover, you can use multiple `controlStartAsClone` blocks to define different behaviors for clones. These blocks will run in parallel for each clone.

```ts
import { createClone, controlStartAsClone, forever, moveSteps, turnRight } from 'hikkaku/blocks'

cat.run(() => {
  whenFlagClicked(() => {
    createClone() // create a clone of the cat sprite
  })

  controlStartAsClone(() => {
    forever(() => {
      moveSteps(10) // clones will keep moving forward
    })
  })

  controlStartAsClone(() => {
    forever(() => {
      turnRight(15) // clones will keep turning right
    })
  })
})
```

## 3) Deleting Clones

You can delete a clone using the `deleteThisClone()` block.

```ts
import { createClone, controlStartAsClone, deleteThisClone, waitSeconds, moveSteps, forever } from 'hikkaku/blocks'

cat.run(() => {
  whenFlagClicked(() => {
    createClone() // create a clone of the cat sprite
  })

  controlStartAsClone(() => {
    forever(() => {
      moveSteps(10) // clones will keep moving forward
    })
  })

  controlStartAsClone(() => {
    waitSeconds(5) // wait for 5 seconds
    deleteThisClone() // delete the clone
  })

  controlStartAsClone(() => {
    waitUntil(touchingObject('_edge_'))
    deleteThisClone() // delete the clone when it touches the edge
  })
})
```

This code will create a clone of the cat sprite when the flag is clicked. The clone will move forward continuously and will be deleted after 5 seconds.

Scratch project can have up to 300 clones of a single sprite at any given time. If you try to create more than 300 clones, the additional clone creation requests will be ignored until some clones are deleted.
This count is shared among all sprites in the project.
