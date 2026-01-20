---
title: Variable and List Usage
impact: HIGH
---

# Variables and Lists

Variables and lists are created per target (sprite or stage) using methods on `Target`.
The returned references are then passed into data blocks from `hikkaku/blocks`.

## Create Variables

```ts
import { Project } from 'hikkaku'
import {
  changeVariableBy,
  getVariable,
  setVariableTo,
  whenFlagClicked,
} from 'hikkaku/blocks'

const project = new Project()
const sprite = project.createSprite('Sprite1')

const score = sprite.createVariable('score', 0)

sprite.run(() => {
  whenFlagClicked(() => {
    setVariableTo(score, 0)
    changeVariableBy(score, 1)
    getVariable(score)
  })
})
```

### Cloud Variables

```ts
const cloudScore = sprite.createVariable('cloudScore', 0, true)
```

## Create Lists

```ts
import { Project } from 'hikkaku'
import {
  addToList,
  deleteAllOfList,
  getItemOfList,
  lengthOfList,
  whenFlagClicked,
} from 'hikkaku/blocks'

const project = new Project()
const sprite = project.createSprite('Sprite1')

const items = sprite.createList('items', [])

sprite.run(() => {
  whenFlagClicked(() => {
    deleteAllOfList(items)
    addToList(items, 'apple')
    addToList(items, 'banana')
    getItemOfList(items, 1)
    lengthOfList(items)
  })
})
```

## Notes

* `createVariable(name, defaultValue?, isCloudVariable?)` returns a `VariableReference`.
* `createList(name, defaultValue?)` returns a `ListReference`.
* Variable and list references are scoped to the target that created them (sprite or stage).
