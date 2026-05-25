---
title: Custom Blocks Usage
impact: MEDIUM
---

# Custom Blocks (Procedures)

Custom blocks are defined with `defineProcedure` using a list of procedure parts:

* `procedureLabel(text)` for static label text
* `procedureBoolean(name)` for boolean inputs
* `procedureStringOrNumber(name)` for string/number inputs

Inside the procedure body, use argument reporter blocks to read inputs.
`defineProcedure` argument references also provide `.getter()` as a shorthand.

## Define a Procedure

```ts
import { Project } from 'hikkaku'
import {
  defineProcedure,
  procedureBoolean,
  procedureLabel,
  procedureStringOrNumber,
  whenFlagClicked,
  ifThen,
  say,
} from 'hikkaku/blocks'

const project = new Project()
const sprite = project.createSprite('Sprite1')

sprite.run(() => {
  whenFlagClicked(() => {
    defineProcedure(
      [
        procedureLabel('greet'),
        procedureStringOrNumber('name'),
        procedureBoolean('excited'),
      ],
      ({ name, excited }) => {
        ifThen(excited.getter(), () => {
          say(name.getter())
        })
      },
    )
  })
})
```

## Call a Procedure

`callProcedure` supports a safer reference-based style. `defineProcedure` returns
a `reference` object that includes the procedure code and each argument reference.

```ts
import { callProcedure } from 'hikkaku/blocks'

const greet = defineProcedure([
  procedureLabel('greet'),
  procedureStringOrNumber('name'),
  procedureBoolean('excited'),
])

callProcedure(greet, [
  { reference: greet.reference.arguments.name, value: 'Ada' },
  { reference: greet.reference.arguments.excited, value: true },
])
```

You can also pass an object keyed by argument ID:

```ts
callProcedure(greet, {
  [greet.reference.arguments.name.id]: 'Ada',
  [greet.reference.arguments.excited.id]: true,
})
```

Low-level invocation with explicit `proccode` / `argumentIds` still works for interop scenarios, but prefer references when possible to avoid mismatches.
