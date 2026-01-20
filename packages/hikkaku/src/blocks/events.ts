import { fromPrimitiveSource } from "../compiler/block-helper"
import { block } from "../compiler/composer"
import type { PrimitiveSource } from "../compiler/types"

export const whenFlagClicked = (stack?: () => void) => {
  const res = block('event_whenflagclicked', {
    topLevel: true
  })
  stack?.()
  return res
}

export const whenKeyPressed = (key: string, stack?: () => void) => {
  const res = block('event_whenkeypressed', {
    topLevel: true,
    fields: {
      KEY_OPTION: [key, null]
    }
  })
  stack?.()
  return res
}

export const whenThisSpriteClicked = (stack?: () => void) => {
  const res = block('event_whenthisspriteclicked', {
    topLevel: true
  })
  stack?.()
  return res
}

export const whenStageClicked = (stack?: () => void) => {
  const res = block('event_whenstageclicked', {
    topLevel: true
  })
  stack?.()
  return res
}

export const whenBackdropSwitchesTo = (backdrop: string, stack?: () => void) => {
  const res = block('event_whenbackdropswitchesto', {
    topLevel: true,
    fields: {
      BACKDROP: [backdrop, null]
    }
  })
  stack?.()
  return res
}

export const whenBroadcastReceived = (broadcast: string, stack?: () => void) => {
  const res = block('event_whenbroadcastreceived', {
    topLevel: true,
    fields: {
      BROADCAST_OPTION: [broadcast, null]
    }
  })
  stack?.()
  return res
}

export const whenTouchingObject = (target: string, stack?: () => void) => {
  const res = block('event_whentouchingobject', {
    topLevel: true,
    fields: {
      TOUCHINGOBJECTMENU: [target, null]
    }
  })
  stack?.()
  return res
}

export const whenGreaterThan = (
  menu: string,
  value: PrimitiveSource<number>,
  stack?: () => void
) => {
  const res = block('event_whengreaterthan', {
    topLevel: true,
    inputs: {
      VALUE: fromPrimitiveSource(value)
    },
    fields: {
      WHENGREATERTHANMENU: [menu, null]
    }
  })
  stack?.()
  return res
}

export const broadcast = (message: PrimitiveSource<string>) => {
  return block('event_broadcast', {
    inputs: {
      BROADCAST_INPUT: fromPrimitiveSource(message)
    }
  })
}

export const broadcastAndWait = (message: PrimitiveSource<string>) => {
  return block('event_broadcastandwait', {
    inputs: {
      BROADCAST_INPUT: fromPrimitiveSource(message)
    }
  })
}
