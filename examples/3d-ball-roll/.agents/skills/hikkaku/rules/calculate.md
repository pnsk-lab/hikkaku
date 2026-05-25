---
name: "calculating in hikkaku"
description: "Guidelines for performing calculations and using operators in Hikkaku."
impact: HIGH
---

Hikkaku uses pre-compile architecture, so all calculations must be done using Hikkaku blocks.

## Static calculations

For calculations that can be determined at compile time, use JavaScript/TypeScript expressions.

```ts
import {
    moveSteps,
    whenFlagClicked,
} from 'hikkaku/blocks'

sprite.run(() => {
    whenFlagClicked(() => {
        moveSteps(10 + 5) // OK: static calculation
    })
})
```

## Dynamic calculations

For calculations that depend on runtime values, use Hikkaku operator blocks.

```ts
import {
    moveSteps,
    whenFlagClicked,
    getVariable,
    add,
} from 'hikkaku/blocks'

sprite.run(() => {
    const stepVar = sprite.createVariable('stepVar', 0)

    whenFlagClicked(() => {
        moveSteps(
            add(
                getVariable(stepVar),
                5
            )
        ) // OK: dynamic calculation using Hikkaku blocks

        moveSteps(stepVar + 5) // NOT OK: cannot use JS operators. `stepVar` is a variable reference, not a number.
    })
})
```
