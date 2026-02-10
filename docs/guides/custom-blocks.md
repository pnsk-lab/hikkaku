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
    defineProcedure(
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
  })
})
```

## Calling Procedures

Most projects should define and call procedures in one place.

If you use low-level `callProcedure`, keep `proccode` and argument IDs synchronized with the definition.

```ts
import { callProcedure } from 'hikkaku/blocks'

const proccode = 'greet %s %b'
const argumentIds = ['arg-id-1', 'arg-id-2']

callProcedure(proccode, argumentIds, {
  'arg-id-1': 'Ada',
  'arg-id-2': true
})
```
