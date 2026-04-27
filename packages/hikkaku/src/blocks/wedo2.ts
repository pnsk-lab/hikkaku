import { InputType } from 'sb3-types/enum'
import { fromPrimitiveSource, menuInput } from '../core/block-helper'
import { attachStack, block, valueBlock } from '../core/composer'
import type {
  HikkakuBool,
  HikkakuNumber,
  HikkakuString,
  PrimitiveSource,
} from '../core/types'

export type WeDo2MotorId = 'motor' | 'motor1' | 'motor2' | 'all motors'
export type WeDo2MotorDirection = 'this way' | 'that way' | 'reverse'
export type WeDo2TiltDirection = 'up' | 'down' | 'left' | 'right'
export type WeDo2TiltDirectionAny = 'up' | 'down' | 'left' | 'right' | 'any'
export type WeDo2DistanceOp = '<' | '>'

/**
 * Turns a WeDo 2.0 motor on for the given duration.
 *
 * Input: `motorId`, `duration`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param motorId See function signature for accepted input values.
 * @param duration See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { wedo2MotorOnFor } from 'hikkaku/blocks'
 *
 * wedo2MotorOnFor('motor', 1)
 * ```
 */
export const wedo2MotorOnFor = (
  motorId: PrimitiveSource<HikkakuString>,
  duration: PrimitiveSource<HikkakuNumber>,
) => {
  return block('wedo2_motorOnFor', {
    inputs: {
      MOTOR_ID: menuInput(motorId, menuOfMotorId),
      DURATION: fromPrimitiveSource(InputType.Number, duration, 1),
    },
  })
}

export const menuOfMotorId = (motorId: WeDo2MotorId = 'motor') => {
  return valueBlock<HikkakuString>('wedo2_menu_MOTOR_ID', {
    fields: {
      MOTOR_ID: [motorId, null],
    },
    isShadow: true,
  })
}

/**
 * Turns a WeDo 2.0 motor on indefinitely.
 *
 * Input: `motorId`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param motorId See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { wedo2MotorOn } from 'hikkaku/blocks'
 *
 * wedo2MotorOn('motor')
 * ```
 */
export const wedo2MotorOn = (motorId: PrimitiveSource<HikkakuString>) => {
  return block('wedo2_motorOn', {
    inputs: {
      MOTOR_ID: menuInput(motorId, menuOfMotorId),
    },
  })
}

/**
 * Turns a WeDo 2.0 motor off.
 *
 * Input: `motorId`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param motorId See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { wedo2MotorOff } from 'hikkaku/blocks'
 *
 * wedo2MotorOff('motor')
 * ```
 */
export const wedo2MotorOff = (motorId: PrimitiveSource<HikkakuString>) => {
  return block('wedo2_motorOff', {
    inputs: {
      MOTOR_ID: menuInput(motorId, menuOfMotorId),
    },
  })
}

/**
 * Sets the power of a WeDo 2.0 motor and turns it on.
 *
 * Input: `motorId`, `power`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param motorId See function signature for accepted input values.
 * @param power See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { wedo2StartMotorPower } from 'hikkaku/blocks'
 *
 * wedo2StartMotorPower('motor', 100)
 * ```
 */
export const wedo2StartMotorPower = (
  motorId: PrimitiveSource<HikkakuString>,
  power: PrimitiveSource<HikkakuNumber>,
) => {
  return block('wedo2_startMotorPower', {
    inputs: {
      MOTOR_ID: menuInput(motorId, menuOfMotorId),
      POWER: fromPrimitiveSource(InputType.Number, power, 100),
    },
  })
}

/**
 * Sets the direction of a WeDo 2.0 motor.
 *
 * Input: `motorId`, `direction`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param motorId See function signature for accepted input values.
 * @param direction See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { wedo2SetMotorDirection } from 'hikkaku/blocks'
 *
 * wedo2SetMotorDirection('motor', 'this way')
 * ```
 */
export const wedo2SetMotorDirection = (
  motorId: PrimitiveSource<HikkakuString>,
  direction: PrimitiveSource<HikkakuString>,
) => {
  return block('wedo2_setMotorDirection', {
    inputs: {
      MOTOR_ID: menuInput(motorId, menuOfMotorId),
      MOTOR_DIRECTION: menuInput(direction, menuOfMotorDirection),
    },
  })
}

export const menuOfMotorDirection = (
  direction: WeDo2MotorDirection = 'this way',
) => {
  return valueBlock<HikkakuString>('wedo2_menu_MOTOR_DIRECTION', {
    fields: {
      MOTOR_DIRECTION: [direction, null],
    },
    isShadow: true,
  })
}

/**
 * Sets the WeDo 2.0 LED light color.
 *
 * Input: `hue`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param hue See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { wedo2SetLightHue } from 'hikkaku/blocks'
 *
 * wedo2SetLightHue(50)
 * ```
 */
export const wedo2SetLightHue = (hue: PrimitiveSource<HikkakuNumber>) => {
  return block('wedo2_setLightHue', {
    inputs: {
      HUE: fromPrimitiveSource(InputType.Number, hue, 50),
    },
  })
}

/**
 * Plays a note on WeDo 2.0 for some time.
 *
 * Input: `note`, `duration`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param note See function signature for accepted input values.
 * @param duration See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { wedo2PlayNoteFor } from 'hikkaku/blocks'
 *
 * wedo2PlayNoteFor(60, 0.5)
 * ```
 */
export const wedo2PlayNoteFor = (
  note: PrimitiveSource<HikkakuNumber>,
  duration: PrimitiveSource<HikkakuNumber>,
) => {
  return block('wedo2_playNoteFor', {
    inputs: {
      NOTE: fromPrimitiveSource(InputType.Number, note, 60),
      DURATION: fromPrimitiveSource(InputType.Number, duration, 0.5),
    },
  })
}

/**
 * Hat block that triggers based on distance.
 *
 * Input: `op`, `reference`, `stack`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param op See function signature for accepted input values.
 * @param reference See function signature for accepted input values.
 * @param stack See function signature for accepted input values. Optional.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { wedo2WhenDistance } from 'hikkaku/blocks'
 *
 * wedo2WhenDistance('<', 50, () => {})
 * ```
 */
export const wedo2WhenDistance = (
  op: PrimitiveSource<HikkakuString>,
  reference: PrimitiveSource<HikkakuNumber>,
  stack?: () => void,
) => {
  const res = block('wedo2_whenDistance', {
    topLevel: true,
    inputs: {
      OP: menuInput(op, menuOfOp),
      REFERENCE: fromPrimitiveSource(InputType.Number, reference, 50),
    },
  })
  attachStack(res.id, stack)
  return res
}

export const menuOfOp = (op: WeDo2DistanceOp = '<') => {
  return valueBlock<HikkakuString>('wedo2_menu_OP', {
    fields: {
      OP: [op, null],
    },
    isShadow: true,
  })
}

/**
 * Hat block that triggers when WeDo 2.0 is tilted.
 *
 * Input: `tiltDirection`, `stack`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param tiltDirection See function signature for accepted input values.
 * @param stack See function signature for accepted input values. Optional.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { wedo2WhenTilted } from 'hikkaku/blocks'
 *
 * wedo2WhenTilted('any', () => {})
 * ```
 */
export const wedo2WhenTilted = (
  tiltDirection: PrimitiveSource<HikkakuString>,
  stack?: () => void,
) => {
  const res = block('wedo2_whenTilted', {
    topLevel: true,
    inputs: {
      TILT_DIRECTION_ANY: menuInput(tiltDirection, menuOfTiltDirectionAny),
    },
  })
  attachStack(res.id, stack)
  return res
}

export const menuOfTiltDirectionAny = (
  direction: WeDo2TiltDirectionAny = 'any',
) => {
  return valueBlock<HikkakuString>('wedo2_menu_TILT_DIRECTION_ANY', {
    fields: {
      TILT_DIRECTION_ANY: [direction, null],
    },
    isShadow: true,
  })
}

/**
 * Returns the WeDo 2.0 distance sensor value.
 *
 * Input: none.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { wedo2GetDistance } from 'hikkaku/blocks'
 *
 * wedo2GetDistance()
 * ```
 */
export const wedo2GetDistance = () => {
  return valueBlock<HikkakuNumber>('wedo2_getDistance', {})
}

/**
 * Boolean check for whether WeDo 2.0 is tilted.
 *
 * Input: `tiltDirection`.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @param tiltDirection See function signature for accepted input values.
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { wedo2IsTilted } from 'hikkaku/blocks'
 *
 * wedo2IsTilted('any')
 * ```
 */
export const wedo2IsTilted = (tiltDirection: PrimitiveSource<HikkakuString>) => {
  return valueBlock<HikkakuBool>('wedo2_isTilted', {
    inputs: {
      TILT_DIRECTION_ANY: menuInput(tiltDirection, menuOfTiltDirectionAny),
    },
  })
}

/**
 * Returns the tilt angle of the WeDo 2.0 sensor.
 *
 * Input: `tiltDirection`.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @param tiltDirection See function signature for accepted input values.
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { wedo2GetTiltAngle } from 'hikkaku/blocks'
 *
 * wedo2GetTiltAngle('up')
 * ```
 */
export const wedo2GetTiltAngle = (
  tiltDirection: PrimitiveSource<HikkakuString>,
) => {
  return valueBlock<HikkakuNumber>('wedo2_getTiltAngle', {
    inputs: {
      TILT_DIRECTION: menuInput(tiltDirection, menuOfTiltDirection),
    },
  })
}

export const menuOfTiltDirection = (direction: WeDo2TiltDirection = 'up') => {
  return valueBlock<HikkakuString>('wedo2_menu_TILT_DIRECTION', {
    fields: {
      TILT_DIRECTION: [direction, null],
    },
    isShadow: true,
  })
}
