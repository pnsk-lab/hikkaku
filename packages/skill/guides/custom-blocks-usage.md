---
title: Custom Blocks Usage
impact: HIGH
---

# Custom Blocks (Procedures)

Custom blocks are defined with `defineProcedure` using a list of procedure parts:

* `procedureLabel(text)` for static label text
* `procedureBoolean(name)` for boolean inputs
* `procedureStringOrNumber(name)` for string/number inputs

Inside the procedure body, use argument reporter blocks to read inputs.

## Define a Procedure

```ts
import { Project } from 'hikkaku'
import {
  argumentReporterBoolean,
  argumentReporterStringNumber,
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
        ifThen(argumentReporterBoolean(excited), () => {
          say(argumentReporterStringNumber(name))
        })
      },
    )
  })
})
```

## Call a Procedure (Advanced)

`callProcedure` is a low-level helper. You must provide the exact `proccode` and
`argumentIds` used by the definition block. These are stored in the
`procedures_prototype` mutation for that custom block.

A `proccode` is built by joining the procedure parts with spaces:

* `procedureLabel(text)` -> `text`
* `procedureBoolean(name)` -> `%b`
* `procedureStringOrNumber(name)` -> `%s`

Example of a `proccode` for the definition above:

```ts
const proccode = 'greet %s %b'
```

Use the same `argumentIds` order as the non-label parts.

```ts
import { callProcedure } from 'hikkaku/blocks'

const argumentIds = ['arg-id-1', 'arg-id-2']

callProcedure(proccode, argumentIds, {
  'arg-id-1': 'Ada',
  'arg-id-2': true,
})
```

If you need to call custom blocks frequently, keep the `proccode` and
`argumentIds` together in a shared helper so the definition and calls match.
