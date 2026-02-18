import { describe, expect, test } from 'vite-plus/test'
import { createBlocks } from '../core/composer'
import { say } from './looks'
import {
  callProcedure,
  defineProcedure,
  procedureLabel,
  procedureStringOrNumber,
} from './procedures'

describe('blocks/procedures', () => {
  test('defines and calls procedures', () => {
    const blocks = createBlocks(() => {
      const greet = defineProcedure(
        [procedureLabel('greet'), procedureStringOrNumber('name')],
        ({ name }) => {
          say(name.getter())
          return undefined
        },
      )
      callProcedure(greet, [
        { reference: greet.reference.arguments.name, value: 'Ada' },
      ])
    })

    const opcodes = Object.values(blocks).map((b) => b.opcode)
    expect(opcodes).toContain('procedures_definition')
    expect(opcodes).toContain('procedures_call')
    expect(opcodes).toContain('argument_reporter_string_number')
  })
})
