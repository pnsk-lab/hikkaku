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

## Define a Procedure

```ts
import { Project } from 'hikkaku'
import {
  argumentReporterBoolean,
  argumentReporterStringNumber,
  callProcedure,
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
  const greet = defineProcedure(
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

  whenFlagClicked(() => {
    callProcedure(greet, {
      name: 'Ada',
      excited: true,
    })
  })
})
```

## Call a Procedure

```ts
import { callProcedure, defineProcedure, procedureLabel } from 'hikkaku/blocks'

const step = defineProcedure([procedureLabel('1step')], () => {}, true)

callProcedure(step, {})
```

Use the reference returned by `defineProcedure` when calling. This keeps
procedure names and argument IDs synchronized automatically.
