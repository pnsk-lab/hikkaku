# Custom Blocks (Procedures)

Use custom blocks to encapsulate repeated logic and optionally run it in warp mode.

## Define a Procedure

```ts
import {
  argumentReporterBoolean,
  argumentReporterStringNumber,
  defineProcedure,
  ifThen,
  procedureBoolean,
  procedureLabel,
  procedureStringOrNumber,
  say,
  whenFlagClicked
} from 'hikkaku/blocks'

sprite.run(() => {
  whenFlagClicked(() => {
    const greet = defineProcedure(
      [
        procedureLabel('greet'),
        procedureStringOrNumber('name'),
        procedureBoolean('excited')
      ],
      ({ name, excited }) => {
        ifThen(argumentReporterBoolean(excited), () => {
          say(argumentReporterStringNumber(name))
        })
      }
    )

    callProcedure(greet, [
      { reference: greet.reference.arguments.name, value: 'Ada' },
      { reference: greet.reference.arguments.excited, value: true }
    ])
  })
})
```

## Calling Procedures

Most projects should define and call procedures in one place.

`callProcedure` supports both low-level ID-based calls and safer reference-based calls from `defineProcedure`.

```ts
import { callProcedure, defineProcedure, procedureLabel, procedureStringOrNumber } from 'hikkaku/blocks'

const greet = defineProcedure([
  procedureLabel('greet'),
  procedureStringOrNumber('name')
])

// Recommended: reference-based invocation.
callProcedure(greet, [
  { reference: greet.reference.arguments.name, value: 'Ada' }
])

// Low-level: still available when you need to interop with existing code.
callProcedure('greet %s', ['arg-id-1'], {
  'arg-id-1': 'Ada'
})
```
