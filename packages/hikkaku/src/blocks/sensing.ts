import { fromPrimitiveSource } from "../compiler/block-helper"
import { block } from "../compiler/composer"
import type { PrimitiveSource } from "../compiler/types"

export const getMouseX = () => {
  return block('sensing_mousex', {})
}
export const getMouseY = () => {
  return block('sensing_mousey', {})
}

export type CurrentMenu = 'year' | 'month' | 'date' | 'dayofweek' | 'hour' | 'minute' | 'second'
export type DragMode = 'draggable' | 'not draggable'

export const touchingObject = (target: string) => {
  return block('sensing_touchingobject', {
    fields: {
      TOUCHINGOBJECTMENU: [target, null]
    }
  })
}

export const touchingColor = (color: PrimitiveSource<string>) => {
  return block('sensing_touchingcolor', {
    inputs: {
      COLOR: fromPrimitiveSource(color)
    }
  })
}

export const colorTouchingColor = (
  color: PrimitiveSource<string>,
  targetColor: PrimitiveSource<string>
) => {
  return block('sensing_coloristouchingcolor', {
    inputs: {
      COLOR: fromPrimitiveSource(color),
      COLOR2: fromPrimitiveSource(targetColor)
    }
  })
}

export const distanceTo = (target: string) => {
  return block('sensing_distanceto', {
    fields: {
      DISTANCETOMENU: [target, null]
    }
  })
}

export const getTimer = () => {
  return block('sensing_timer', {})
}

export const resetTimer = () => {
  return block('sensing_resettimer', {})
}

export const setDragMode = (mode: DragMode) => {
  return block('sensing_setdragmode', {
    fields: {
      DRAG_MODE: [mode, null]
    }
  })
}

export const getMouseDown = () => {
  return block('sensing_mousedown', {})
}

export const getKeyPressed = (key: string) => {
  return block('sensing_keypressed', {
    fields: {
      KEY_OPTION: [key, null]
    }
  })
}

export const current = (menu: CurrentMenu) => {
  return block('sensing_current', {
    fields: {
      CURRENTMENU: [menu, null]
    }
  })
}

export const getAttributeOf = (property: string, target: string) => {
  return block('sensing_of', {
    fields: {
      PROPERTY: [property, null],
      OBJECT: [target, null]
    }
  })
}

export const daysSince2000 = () => {
  return block('sensing_dayssince2000', {})
}

export const getLoudness = () => {
  return block('sensing_loudness', {})
}

export const isLoud = () => {
  return block('sensing_loud', {})
}

export const askAndWait = (question: PrimitiveSource<string>) => {
  return block('sensing_askandwait', {
    inputs: {
      QUESTION: fromPrimitiveSource(question)
    }
  })
}

export const getAnswer = () => {
  return block('sensing_answer', {})
}

export const getUsername = () => {
  return block('sensing_username', {})
}
