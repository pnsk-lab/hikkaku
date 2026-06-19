import { InputType } from 'sb3-types/enum'
import { menuInput } from '../core/block-helper'
import { attachStack, block, valueBlock } from '../core/composer'
import type {
  HikkakuBool,
  HikkakuNumber,
  HikkakuString,
  PrimitiveSource,
} from '../core/types'

export type GdxForGesture = 'shaken' | 'startedFalling' | 'turnedFaceUp' | 'turnedFaceDown'
export type GdxForPushPull = 'pushed' | 'pulled'
export type GdxForAxis = 'x' | 'y' | 'z'
export type GdxForTilt = 'front' | 'back' | 'left' | 'right'
export type GdxForTiltAny = 'front' | 'back' | 'left' | 'right' | 'any'

/**
 * Hat block that triggers when a GDX-FOR gesture is detected.
 *
 * Input: `gesture`, `stack`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param gesture See function signature for accepted input values.
 * @param stack See function signature for accepted input values. Optional.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { gdxforWhenGesture } from 'hikkaku/blocks'
 *
 * gdxforWhenGesture('shaken', () => {})
 * ```
 */
export const gdxforWhenGesture = (
  gesture: PrimitiveSource<HikkakuString>,
  stack?: () => void,
) => {
  const res = block('gdxfor_whenGesture', {
    topLevel: true,
    inputs: {
      GESTURE: menuInput(gesture, gdxforMenuOfGestures),
    },
  })
  attachStack(res.id, stack)
  return res
}

export const gdxforMenuOfGestures = (gesture: GdxForGesture = 'shaken') => {
  return valueBlock<HikkakuString>('gdxfor_menu_gestureOptions', {
    fields: {
      gestureOptions: [gesture, null],
    },
    isShadow: true,
  })
}

/**
 * Hat block that triggers when force sensor is pushed or pulled.
 *
 * Input: `pushPull`, `stack`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param pushPull See function signature for accepted input values.
 * @param stack See function signature for accepted input values. Optional.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { gdxforWhenForcePushedOrPulled } from 'hikkaku/blocks'
 *
 * gdxforWhenForcePushedOrPulled('pushed', () => {})
 * ```
 */
export const gdxforWhenForcePushedOrPulled = (
  pushPull: PrimitiveSource<HikkakuString>,
  stack?: () => void,
) => {
  const res = block('gdxfor_whenForcePushedOrPulled', {
    topLevel: true,
    inputs: {
      PUSH_PULL: menuInput(pushPull, gdxforMenuOfPushPull),
    },
  })
  attachStack(res.id, stack)
  return res
}

export const gdxforMenuOfPushPull = (pushPull: GdxForPushPull = 'pushed') => {
  return valueBlock<HikkakuString>('gdxfor_menu_pushPullOptions', {
    fields: {
      pushPullOptions: [pushPull, null],
    },
    isShadow: true,
  })
}

/**
 * Returns the GDX-FOR force sensor value.
 *
 * Input: none.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { gdxforGetForce } from 'hikkaku/blocks'
 *
 * gdxforGetForce()
 * ```
 */
export const gdxforGetForce = () => {
  return valueBlock<HikkakuNumber>('gdxfor_getForce', {})
}

/**
 * Hat block that triggers when GDX-FOR is tilted.
 *
 * Input: `tilt`, `stack`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param tilt See function signature for accepted input values.
 * @param stack See function signature for accepted input values. Optional.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { gdxforWhenTilted } from 'hikkaku/blocks'
 *
 * gdxforWhenTilted('any', () => {})
 * ```
 */
export const gdxforWhenTilted = (
  tilt: PrimitiveSource<HikkakuString>,
  stack?: () => void,
) => {
  const res = block('gdxfor_whenTilted', {
    topLevel: true,
    inputs: {
      TILT: menuInput(tilt, gdxforMenuOfTiltAny),
  return res
}

export const gdxforMenuOfTiltAny = (tilt: GdxForTiltAny = 'any') => {
  return valueBlock<HikkakuString>('gdxfor_menu_tiltAnyOptions', {
    fields: {
      tiltAnyOptions: [tilt, null],
    },
    isShadow: true,
  })
}

/**
 * Boolean check for whether GDX-FOR is tilted.
 *
 * Input: `tilt`.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @param tilt See function signature for accepted input values.
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { gdxforIsTilted } from 'hikkaku/blocks'
 *
 * gdxforIsTilted('any')
 * ```
 */
export const gdxforIsTilted = (tilt: PrimitiveSource<HikkakuString>) => {
  return valueBlock<HikkakuBool>('gdxfor_isTilted', {
    inputs: {
      TILT: menuInput(tilt, gdxforMenuOfTiltAny), of the GDX-FOR sensor.
 *
 * Input: `tilt`.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @param tilt See function signature for accepted input values.
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { gdxforGetTilt } from 'hikkaku/blocks'
 *
 * gdxforGetTilt('front')
 * ```
 */
export const gdxforGetTilt = (tilt: PrimitiveSource<HikkakuString>) => {
  return valueBlock<HikkakuNumber>('gdxfor_getTilt', {
    inputs: {
      TILT: menuInput(tilt, gdxforMenuOfTilt),
    },
  })
}

export const gdxforMenuOfTilt = (tilt: GdxForTilt = 'front') => {
  return valueBlock<HikkakuString>('gdxfor_menu_tiltOptions', {
    fields: {
      tiltOptions: [tilt, null],
    },
    isShadow: true,
  })
}

/**
 * Boolean check for whether GDX-FOR is free falling.
 *
 * Input: none.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { gdxforIsFreeFalling } from 'hikkaku/blocks'
 *
 * gdxforIsFreeFalling()
 * ```
 */
export const gdxforIsFreeFalling = () => {
  return valueBlock<HikkakuBool>('gdxfor_isFreeFalling', {})
}

/**
 * Returns the spin speed of the GDX-FOR sensor.
 *
 * Input: `direction`.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @param direction See function signature for accepted input values.
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { gdxforGetSpinSpeed } from 'hikkaku/blocks'
 *
 * gdxforGetSpinSpeed('z')
 * ```
 */
export const gdxforGetSpinSpeed = (direction: PrimitiveSource<HikkakuString>) => {
  return valueBlock<HikkakuNumber>('gdxfor_getSpinSpeed', {
    inputs: {
      DIRECTION: menuInput(direction, gdxforMenuOfAxis), = (direction: GdxForAxis = 'z') => {
  return valueBlock<HikkakuString>('gdxfor_menu_axisOptions', {
    fields: {
      axisOptions: [direction, null],
    },
    isShadow: true,
  })
}

/**
 * Returns the acceleration of the GDX-FOR sensor.
 *
 * Input: `direction`.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @param direction See function signature for accepted input values.
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { gdxforGetAcceleration } from 'hikkaku/blocks'
 *
 * gdxforGetAcceleration('x')
 * ```
 */
export const gdxforGetAcceleration = (
  direction: PrimitiveSource<HikkakuString>,
) => {
  return valueBlock<HikkakuNumber>('gdxfor_getAcceleration', {
    inputs: {
      DIRECTION: menuInput(direction, gdxforMenuOfAxis),