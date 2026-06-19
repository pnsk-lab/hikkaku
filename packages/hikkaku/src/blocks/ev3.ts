import { InputType } from 'sb3-types/enum'
import { fromPrimitiveSource, menuInput } from '../core/block-helper'
import { attachStack, block, valueBlock } from '../core/composer'
import type {
  HikkakuBool,
  HikkakuNumber,
  HikkakuString,
  PrimitiveSource,
} from '../core/types'

export type Ev3MotorPort = '0' | '1' | '2' | '3'
export type Ev3SensorPort = '0' | '1' | '2' | '3'

/**
 * Turns an EV3 motor clockwise for the given time.
 *
 * Input: `port`, `time`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param port See function signature for accepted input values.
 * @param time See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { ev3MotorTurnClockwise } from 'hikkaku/blocks'
 *
 * ev3MotorTurnClockwise('0', 1)
 * ```
 */
export const ev3MotorTurnClockwise = (
  port: PrimitiveSource<HikkakuString>,
  time: PrimitiveSource<HikkakuNumber>,
) => {
  return block('ev3_motorTurnClockwise', {
    inputs: {
      PORT: menuInput(port, menuOfMotorPorts),
      TIME: fromPrimitiveSource(InputType.Number, time, 1),
    },
  })
}

/**
 * Turns an EV3 motor counter-clockwise for the given time.
 *
 * Input: `port`, `time`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param port See function signature for accepted input values.
 * @param time See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { ev3MotorTurnCounterClockwise } from 'hikkaku/blocks'
 *
 * ev3MotorTurnCounterClockwise('0', 1)
 * ```
 */
export const ev3MotorTurnCounterClockwise = (
  port: PrimitiveSource<HikkakuString>,
  time: PrimitiveSource<HikkakuNumber>,
) => {
  return block('ev3_motorTurnCounterClockwise', {
    inputs: {
      PORT: menuInput(port, menuOfMotorPorts),
      TIME: fromPrimitiveSource(InputType.Number, time, 1),
    },
  })
}

export const menuOfMotorPorts = (port: Ev3MotorPort = '0') => {
  return valueBlock<HikkakuString>('ev3_menu_motorPorts', {
    fields: {
      motorPorts: [port, null],
    },
    isShadow: true,
  })
}

/**
 * Sets the power of an EV3 motor.
 *
 * Input: `port`, `power`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param port See function signature for accepted input values.
 * @param power See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { ev3MotorSetPower } from 'hikkaku/blocks'
 *
 * ev3MotorSetPower('0', 100)
 * ```
 */
export const ev3MotorSetPower = (
  port: PrimitiveSource<HikkakuString>,
  power: PrimitiveSource<HikkakuNumber>,
) => {
  return block('ev3_motorSetPower', {
    inputs: {
      PORT: menuInput(port, menuOfMotorPorts),
      POWER: fromPrimitiveSource(InputType.Number, power, 100),
    },
  })
}

/**
 * Returns the position of an EV3 motor.
 *
 * Input: `port`.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @param port See function signature for accepted input values.
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { ev3GetMotorPosition } from 'hikkaku/blocks'
 *
 * ev3GetMotorPosition('0')
 * ```
 */
export const ev3GetMotorPosition = (port: PrimitiveSource<HikkakuString>) => {
  return valueBlock<HikkakuNumber>('ev3_getMotorPosition', {
    inputs: {
      PORT: menuInput(port, menuOfMotorPorts),
    },
  })
}

/**
 * Hat block that triggers when an EV3 button is pressed.
 *
 * Input: `port`, `stack`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param port See function signature for accepted input values.
 * @param stack See function signature for accepted input values. Optional.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { ev3WhenButtonPressed } from 'hikkaku/blocks'
 *
 * ev3WhenButtonPressed('0', () => {})
 * ```
 */
export const ev3WhenButtonPressed = (
  port: PrimitiveSource<HikkakuString>,
  stack?: () => void,
) => {
  const res = block('ev3_whenButtonPressed', {
    topLevel: true,
    inputs: {
      PORT: menuInput(port, menuOfSensorPorts),
    },
  })
  attachStack(res.id, stack)
  return res
}

export const menuOfSensorPorts = (port: Ev3SensorPort = '0') => {
  return valueBlock<HikkakuString>('ev3_menu_sensorPorts', {
    fields: {
      sensorPorts: [port, null],
    },
    isShadow: true,
  })
}

/**
 * Hat block that triggers when distance is less than a threshold.
 *
 * Input: `distance`, `stack`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param distance See function signature for accepted input values.
 * @param stack See function signature for accepted input values. Optional.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { ev3WhenDistanceLessThan } from 'hikkaku/blocks'
 *
 * ev3WhenDistanceLessThan(5, () => {})
 * ```
 */
export const ev3WhenDistanceLessThan = (
  distance: PrimitiveSource<HikkakuNumber>,
  stack?: () => void,
) => {
  const res = block('ev3_whenDistanceLessThan', {
    topLevel: true,
    inputs: {
      DISTANCE: fromPrimitiveSource(InputType.Number, distance, 5),
    },
  })
  attachStack(res.id, stack)
  return res
}

/**
 * Hat block that triggers when brightness is less than a threshold.
 *
 * Input: `distance`, `stack`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param distance See function signature for accepted input values.
 * @param stack See function signature for accepted input values. Optional.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { ev3WhenBrightnessLessThan } from 'hikkaku/blocks'
 *
 * ev3WhenBrightnessLessThan(50, () => {})
 * ```
 */
export const ev3WhenBrightnessLessThan = (
  distance: PrimitiveSource<HikkakuNumber>,
  stack?: () => void,
) => {
  const res = block('ev3_whenBrightnessLessThan', {
    topLevel: true,
    inputs: {
      DISTANCE: fromPrimitiveSource(InputType.Number, distance, 50),
    },
  })
  attachStack(res.id, stack)
  return res
}

/**
 * Boolean check for whether an EV3 button is pressed.
 *
 * Input: `port`.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @param port See function signature for accepted input values.
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { ev3ButtonPressed } from 'hikkaku/blocks'
 *
 * ev3ButtonPressed('0')
 * ```
 */
export const ev3ButtonPressed = (port: PrimitiveSource<HikkakuString>) => {
  return valueBlock<HikkakuBool>('ev3_buttonPressed', {
    inputs: {
      PORT: menuInput(port, menuOfSensorPorts),
    },
  })
}

/**
 * Returns the EV3 distance sensor value.
 *
 * Input: none.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { ev3GetDistance } from 'hikkaku/blocks'
 *
 * ev3GetDistance()
 * ```
 */
export const ev3GetDistance = () => {
  return valueBlock<HikkakuNumber>('ev3_getDistance', {})
}

/**
 * Returns the EV3 brightness sensor value.
 *
 * Input: none.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { ev3GetBrightness } from 'hikkaku/blocks'
 *
 * ev3GetBrightness()
 * ```
 */
export const ev3GetBrightness = () => {
  return valueBlock<HikkakuNumber>('ev3_getBrightness', {})
}

/**
 * Beeps a note on EV3 for some time.
 *
 * Input: `note`, `time`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param note See function signature for accepted input values.
 * @param time See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { ev3Beep } from 'hikkaku/blocks'
 *
 * ev3Beep(60, 0.5)
 * ```
 */
export const ev3Beep = (
  note: PrimitiveSource<HikkakuNumber>,
  time: PrimitiveSource<HikkakuNumber>,
) => {
  return block('ev3_beep', {
    inputs: {
      NOTE: fromPrimitiveSource(InputType.Number, note, 60),
      TIME: fromPrimitiveSource(InputType.Number, time, 0.5),
    },
  })
}
