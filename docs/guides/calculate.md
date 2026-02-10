# Calculations

Because Hikkaku compiles TypeScript to Scratch blocks, runtime math must use block helpers.

## Static Calculations

Use normal TypeScript when the value is known at compile time.

```ts
import { moveSteps, whenFlagClicked } from 'hikkaku/blocks'

sprite.run(() => {
  whenFlagClicked(() => {
    moveSteps(10 + 5)
  })
})
```

## Dynamic Calculations

Use Hikkaku operator blocks when values depend on runtime state.

```ts
import { getVariable, moveSteps, whenFlagClicked } from 'hikkaku/blocks'
import { add } from 'hikkaku/blocks'

const stepVar = sprite.createVariable('stepVar', 0)

sprite.run(() => {
  whenFlagClicked(() => {
    moveSteps(add(getVariable(stepVar), 5))
  })
})
```

## Common Mistake

```ts
moveSteps(stepVar + 5)
```

This is invalid because `stepVar` is a variable reference, not a JavaScript number at Scratch runtime.
