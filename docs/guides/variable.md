# Variables and Lists

Variables and lists are created per target (sprite or stage) and then used in data blocks.

## Variables

```ts
import { changeVariableBy, getVariable, setVariableTo, whenFlagClicked } from 'hikkaku/blocks'

const score = sprite.createVariable('score', 0)

sprite.run(() => {
  whenFlagClicked(() => {
    setVariableTo(score, 0)
    changeVariableBy(score, 1)
    getVariable(score)
  })
})
```

Cloud variable:

```ts
const cloudScore = sprite.createVariable('cloudScore', 0, true)
```

## Lists

```ts
import { addToList, deleteAllOfList, getItemOfList, lengthOfList, whenFlagClicked } from 'hikkaku/blocks'

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

## Scope

- Variables/lists belong to the target that created them.
- Stage-created values are shared globally.
- Sprite-created values are local to that sprite and its clones.
