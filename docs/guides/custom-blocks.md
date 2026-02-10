# Custom Blocks (Procedures)

Use custom blocks to encapsulate repeated logic and optionally run it in warp mode.

## Define a Procedure

```ts
import {
  argumentReporterBoolean,
  argumentReporterStringNumber,
  callProcedure,
  defineProcedure,
  ifThen,
  procedureBoolean,
  procedureLabel,
  procedureStringOrNumber,
  say,
  whenFlagClicked
} from 'hikkaku/blocks'

sprite.run(() => {
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

  whenFlagClicked(() => {
    callProcedure(greet, {
      name: 'Ada',
      excited: true
    })
  })
})
```

## Calling Procedures

`defineProcedure` returns a procedure reference.
Use that reference with `callProcedure` so procedure name and argument IDs stay synchronized.

```ts
import { callProcedure, defineProcedure, procedureLabel } from 'hikkaku/blocks'

const step = defineProcedure([procedureLabel('1step')], () => {}, true)

callProcedure(step, {})
```

You can still override warp mode at call time:

```ts
callProcedure(step, {}, false)
```
