import { BlockHelper, defineBlockFn } from './mod.ts'

export const whenFlagClicked: BlockHelper<[], {
  type: 'hat',
  opcode: 'event_whenflagclicked'
}> = defineBlockFn({
  id: 'event.whenflagclicked',
  createBlock() {
    return {
      type: 'hat',
      opcode: 'event_whenflagclicked'
    }
  },
  run() {
    
  }
})
