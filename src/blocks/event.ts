import { BlockHelper, defineBlockFn } from './_shared.ts'

export const whenFlagClicked: BlockHelper<[], {
  type: 'hat',
  opcode: 'event_whenflagclicked'
}> = defineBlockFn({
  opcode: 'event_whenflagclicked',
  createBlock() {
    return {
      type: 'hat',
      opcode: 'event_whenflagclicked'
    }
  },
  run() {
    
  }
})
