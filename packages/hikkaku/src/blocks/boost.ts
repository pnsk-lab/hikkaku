import { InputType } from 'sb3-types/enum'
import { fromPrimitiveSource, menuInput } from '../core/block-helper'
import { attachStack, block, valueBlock } from '../core/composer'
import type {
  HikkakuBool,
  HikkakuNumber,
  HikkakuString,
  PrimitiveSource,
} from '../core/types'

export type BoostMotorId = 'A' | 'B' | 'C' | 'D' | 'AB' | 'ABCD'
export type BoostMotorReporterId = 'A' | 'B' | 'C' | 'D'
export type BoostMotorDirection = 'forward' | 'backward' | 'reverse'
export type BoostColor =
  | 'red'
  | 'blue'
  | 'green'
  | 'yellow'
  | 'white'
  | 'black'
  | 'any'
export type BoostTiltDirection = 'up' | 'down' | 'left' | 'right'
export type BoostTiltDirectionAny = 'up' | 'down' | 'left' | 'right' | 'any'

/**
 * Turns a Boost motor on for the given duration.
 *
 * Input: `motorId`, `duration`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param motorId See function signature for accepted input values.
 * @param duration See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { boostMotorOnFor } from 'hikkaku/blocks'
 *
 * boostMotorOnFor('A', 1)
 * ```
 */
export const boostMotorOnFor = (
  motorId: PrimitiveSource<HikkakuString>,
  duration: PrimitiveSource<HikkakuNumber>,
) => {
  return block('boost_motorOnFor', {
    inputs: {
      MOTOR_ID: menuInput(motorId, menuOfMotorId),
      DURATION: fromPrimitiveSource(InputType.Number, duration, 1),
    },
  })
}

export const menuOfMotorId = (motorId: BoostMotorId = 'A') => {
  return valueBlock<HikkakuString>('boost_menu_MOTOR_ID', {
    fields: {
      MOTOR_ID: [motorId, null],
    },
    isShadow: true,
  })
}

/**
 * Turns a Boost motor on for the given number of rotations.
 *
 * Input: `motorId`, `rotation`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param motorId See function signature for accepted input values.
 * @param rotation See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { boostMotorOnForRotation } from 'hikkaku/blocks'
 *
 * boostMotorOnForRotation('A', 1)
 * ```
 */
export const boostMotorOnForRotation = (
  motorId: PrimitiveSource<HikkakuString>,
  rotation: PrimitiveSource<HikkakuNumber>,
) => {
  return block('boost_motorOnForRotation', {
    inputs: {
      MOTOR_ID: menuInput(motorId, menuOfMotorId),
      ROTATION: fromPrimitiveSource(InputType.Number, rotation, 1),
    },
  })
}

/**
 * Turns a Boost motor on indefinitely.
 *
 * Input: `motorId`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param motorId See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { boostMotorOn } from 'hikkaku/blocks'
 *
 * boostMotorOn('A')
 * ```
 */
export const boostMotorOn = (motorId: PrimitiveSource<HikkakuString>) => {
  return block('boost_motorOn', {
    inputs: {
      MOTOR_ID: menuInput(motorId, menuOfMotorId),
    },
  })
}

/**
 * Turns a Boost motor off.
 *
 * Input: `motorId`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param motorId See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { boostMotorOff } from 'hikkaku/blocks'
 *
 * boostMotorOff('A')
 * ```
 */
export const boostMotorOff = (motorId: PrimitiveSource<HikkakuString>) => {
  return block('boost_motorOff', {
    inputs: {
      MOTOR_ID: menuInput(motorId, menuOfMotorId),
    },
  })
}

/**
 * Sets the power of a Boost motor.
 *
 * Input: `motorId`, `power`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param motorId See function signature for accepted input values.
 * @param power See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { boostSetMotorPower } from 'hikkaku/blocks'
 *
 * boostSetMotorPower('ABCD', 100)
 * ```
 */
export const boostSetMotorPower = (
  motorId: PrimitiveSource<HikkakuString>,
  power: PrimitiveSource<HikkakuNumber>,
) => {
  return block('boost_setMotorPower', {
    inputs: {
      MOTOR_ID: menuInput(motorId, menuOfMotorId),
      POWER: fromPrimitiveSource(InputType.Number, power, 100),
    },
  })
}

/**
 * Sets the direction of a Boost motor.
 *
 * Input: `motorId`, `direction`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param motorId See function signature for accepted input values.
 * @param direction See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { boostSetMotorDirection } from 'hikkaku/blocks'
 *
 * boostSetMotorDirection('A', 'forward')
 * ```
 */
export const boostSetMotorDirection = (
  motorId: PrimitiveSource<HikkakuString>,
  direction: PrimitiveSource<HikkakuString>,
) => {
  return block('boost_setMotorDirection', {
    inputs: {
      MOTOR_ID: menuInput(motorId, menuOfMotorId),
      MOTOR_DIRECTION: menuInput(direction, menuOfMotorDirection),
    },
  })
}

export const menuOfMotorDirection = (
  direction: BoostMotorDirection = 'forward',
) => {
  return valueBlock<HikkakuString>('boost_menu_MOTOR_DIRECTION', {
    fields: {
      MOTOR_DIRECTION: [direction, null],
    },
    isShadow: true,
  })
}

/**
 * Returns the position of a Boost motor.
 *
 * Input: `motorId`.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @param motorId See function signature for accepted input values.
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { boostGetMotorPosition } from 'hikkaku/blocks'
 *
 * boostGetMotorPosition('A')
 * ```
 */
export const boostGetMotorPosition = (
  motorId: PrimitiveSource<HikkakuString>,
) => {
  return valueBlock<HikkakuNumber>('boost_getMotorPosition', {
    inputs: {
      MOTOR_REPORTER_ID: menuInput(motorId, menuOfMotorReporterId),
    },
  })
}

export const menuOfMotorReporterId = (
  motorId: BoostMotorReporterId = 'A',
) => {
  return valueBlock<HikkakuString>('boost_menu_MOTOR_REPORTER_ID', {
    fields: {
      MOTOR_REPORTER_ID: [motorId, null],
    },
    isShadow: true,
  })
}

/**
 * Hat block that triggers when Boost sensor sees a specific color.
 *
 * Input: `color`, `stack`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param color See function signature for accepted input values.
 * @param stack See function signature for accepted input values. Optional.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { boostWhenColor } from 'hikkaku/blocks'
 *
 * boostWhenColor('red', () => {})
 * ```
 */
export const boostWhenColor = (
  color: PrimitiveSource<HikkakuString>,
  stack?: () => void,
) => {
  const res = block('boost_whenColor', {
    topLevel: true,
    inputs: {
      COLOR: menuInput(color, menuOfColor),
    },
  })
  attachStack(res.id, stack)
  return res
}

export const menuOfColor = (color: BoostColor = 'any') => {
  return valueBlock<HikkakuString>('boost_menu_COLOR', {
    fields: {
      COLOR: [color, null],
    },
    isShadow: true,
  })
}

/**
 * Boolean check for whether Boost sensor sees a specific color.
 *
 * Input: `color`.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @param color See function signature for accepted input values.
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { boostSeeingColor } from 'hikkaku/blocks'
 *
 * boostSeeingColor('red')
 * ```
 */
export const boostSeeingColor = (color: PrimitiveSource<HikkakuString>) => {
  return valueBlock<HikkakuBool>('boost_seeingColor', {
    inputs: {
      COLOR: menuInput(color, menuOfColor),
    },
  })
}

/**
 * Hat block that triggers when Boost is tilted.
 *
 * Input: `tiltDirection`, `stack`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param tiltDirection See function signature for accepted input values.
 * @param stack See function signature for accepted input values. Optional.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { boostWhenTilted } from 'hikkaku/blocks'
 *
 * boostWhenTilted('any', () => {})
 * ```
 */
export const boostWhenTilted = (
  tiltDirection: PrimitiveSource<HikkakuString>,
  stack?: () => void,
) => {
  const res = block('boost_whenTilted', {
    topLevel: true,
    inputs: {
      TILT_DIRECTION_ANY: menuInput(tiltDirection, menuOfTiltDirectionAny),
    },
  })
  attachStack(res.id, stack)
  return res
}

export const menuOfTiltDirectionAny = (
  direction: BoostTiltDirectionAny = 'any',
) => {
  return valueBlock<HikkakuString>('boost_menu_TILT_DIRECTION_ANY', {
    fields: {
      TILT_DIRECTION_ANY: [direction, null],
    },
    isShadow: true,
  })
}

/**
 * Returns the tilt angle of the Boost sensor.
 *
 * Input: `tiltDirection`.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @param tiltDirection See function signature for accepted input values.
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { boostGetTiltAngle } from 'hikkaku/blocks'
 *
 * boostGetTiltAngle('up')
 * ```
 */
export const boostGetTiltAngle = (
  tiltDirection: PrimitiveSource<HikkakuString>,
) => {
  return valueBlock<HikkakuNumber>('boost_getTiltAngle', {
    inputs: {
      TILT_DIRECTION: menuInput(tiltDirection, menuOfTiltDirection),
    },
  })
}

export const menuOfTiltDirection = (direction: BoostTiltDirection = 'up') => {
  return valueBlock<HikkakuString>('boost_menu_TILT_DIRECTION', {
    fields: {
      TILT_DIRECTION: [direction, null],
    },
    isShadow: true,
  })
}

/**
 * Sets the Boost LED light color.
 *
 * Input: `hue`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param hue See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { boostSetLightHue } from 'hikkaku/blocks'
 *
 * boostSetLightHue(50)
 * ```
 */
export const boostSetLightHue = (hue: PrimitiveSource<HikkakuNumber>) => {
  return block('boost_setLightHue', {
    inputs: {
      HUE: fromPrimitiveSource(InputType.Number, hue, 50),
    },
  })
}
