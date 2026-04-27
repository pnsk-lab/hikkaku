import { menuInput } from '../core/block-helper'
import { attachStack, block, valueBlock } from '../core/composer'
import type {
  HikkakuBool,
  HikkakuNumber,
  HikkakuString,
  PrimitiveSource,
} from '../core/types'

export type FaceSensingPart =
  | 'nose'
  | 'leftEye'
  | 'rightEye'
  | 'leftEar'
  | 'rightEar'
  | 'mouth'
  | 'betweenEyes'
  | 'topOfHead'
export type FaceSensingTilt = 'left' | 'right'

/**
 * Moves the sprite to a face part.
 *
 * Input: `part`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param part See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { faceSensingGoToPart } from 'hikkaku/blocks'
 *
 * faceSensingGoToPart('nose')
 * ```
 */
export const faceSensingGoToPart = (part: PrimitiveSource<HikkakuString>) => {
  return block('faceSensing_goToPart', {
    inputs: {
      PART: menuInput(part, faceSensingMenuOfPart),
    },
  })
}

export const faceSensingMenuOfPart = (part: FaceSensingPart = 'nose') => {
  return valueBlock<HikkakuString>('faceSensing_menu_PART', {
    fields: {
      PART: [part, null],
    },
    isShadow: true,
  })
}

/**
 * Points the sprite in the direction of face tilt.
 *
 * Input: none.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { faceSensingPointInFaceTiltDirection } from 'hikkaku/blocks'
 *
 * faceSensingPointInFaceTiltDirection()
 * ```
 */
export const faceSensingPointInFaceTiltDirection = () => {
  return block('faceSensing_pointInFaceTiltDirection', {})
}

/**
 * Sets the size of the sprite to the face size.
 *
 * Input: none.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { faceSensingSetSizeToFaceSize } from 'hikkaku/blocks'
 *
 * faceSensingSetSizeToFaceSize()
 * ```
 */
export const faceSensingSetSizeToFaceSize = () => {
  return block('faceSensing_setSizeToFaceSize', {})
}

/**
 * Hat block that triggers when face tilts in a direction.
 *
 * Input: `direction`, `stack`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param direction See function signature for accepted input values.
 * @param stack See function signature for accepted input values. Optional.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { faceSensingWhenTilted } from 'hikkaku/blocks'
 *
 * faceSensingWhenTilted('left', () => {})
 * ```
 */
export const faceSensingWhenTilted = (
  direction: PrimitiveSource<HikkakuString>,
  stack?: () => void,
) => {
  const res = block('faceSensing_whenTilted', {
    topLevel: true,
    inputs: {
      DIRECTION: menuInput(direction, faceSensingMenuOfTilt),
    },
  })
  attachStack(res.id, stack)
  return res
}

export const faceSensingMenuOfTilt = (direction: FaceSensingTilt = 'left') => {
  return valueBlock<HikkakuString>('faceSensing_menu_TILT', {
    fields: {
      TILT: [direction, null],
    },
    isShadow: true,
  })
}

/**
 * Hat block that triggers when this sprite touches a face part.
 *
 * Input: `part`, `stack`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param part See function signature for accepted input values.
 * @param stack See function signature for accepted input values. Optional.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { faceSensingWhenSpriteTouchesPart } from 'hikkaku/blocks'
 *
 * faceSensingWhenSpriteTouchesPart('nose', () => {})
 * ```
 */
export const faceSensingWhenSpriteTouchesPart = (
  part: PrimitiveSource<HikkakuString>,
  stack?: () => void,
) => {
  const res = block('faceSensing_whenSpriteTouchesPart', {
    topLevel: true,
    inputs: {
      PART: menuInput(part, faceSensingMenuOfPart),
    },
  })
  attachStack(res.id, stack)
  return res
}

/**
 * Hat block that triggers when a face is detected.
 *
 * Input: `stack`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param stack See function signature for accepted input values. Optional.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { faceSensingWhenFaceDetected } from 'hikkaku/blocks'
 *
 * faceSensingWhenFaceDetected(() => {})
 * ```
 */
export const faceSensingWhenFaceDetected = (stack?: () => void) => {
  const res = block('faceSensing_whenFaceDetected', {
    topLevel: true,
  })
  attachStack(res.id, stack)
  return res
}

/**
 * Boolean check for whether a face is detected.
 *
 * Input: none.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { faceSensingFaceIsDetected } from 'hikkaku/blocks'
 *
 * faceSensingFaceIsDetected()
 * ```
 */
export const faceSensingFaceIsDetected = () => {
  return valueBlock<HikkakuBool>('faceSensing_faceIsDetected', {})
}

/**
 * Returns the face tilt value.
 *
 * Input: none.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { faceSensingFaceTilt } from 'hikkaku/blocks'
 *
 * faceSensingFaceTilt()
 * ```
 */
export const faceSensingFaceTilt = () => {
  return valueBlock<HikkakuNumber>('faceSensing_faceTilt', {})
}

/**
 * Returns the face size value.
 *
 * Input: none.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { faceSensingFaceSize } from 'hikkaku/blocks'
 *
 * faceSensingFaceSize()
 * ```
 */
export const faceSensingFaceSize = () => {
  return valueBlock<HikkakuNumber>('faceSensing_faceSize', {})
}
