import { InputType } from 'sb3-types/enum'
import { fromPrimitiveSource, menuInput } from '../core/block-helper'
import { attachStack, block, valueBlock } from '../core/composer'
import type {
  HikkakuBool,
  HikkakuNumber,
  HikkakuString,
  PrimitiveSource,
} from '../core/types'

export type VideoSensingAttribute = 'motion' | 'direction'
export type VideoSensingSubject = 'this sprite' | 'Stage'
export type VideoState = 'off' | 'on' | 'on-flipped'

/**
 * Hat block that triggers when video motion exceeds a threshold.
 *
 * Input: `reference`, `stack`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param reference See function signature for accepted input values.
 * @param stack See function signature for accepted input values. Optional.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { whenMotionGreaterThan } from 'hikkaku/blocks'
 *
 * whenMotionGreaterThan(10, () => {})
 * ```
 */
export const whenMotionGreaterThan = (
  reference: PrimitiveSource<HikkakuNumber>,
  stack?: () => void,
) => {
  const res = block('videoSensing_whenMotionGreaterThan', {
    topLevel: true,
    inputs: {
      REFERENCE: fromPrimitiveSource(InputType.Number, reference, 10),
    },
  })
  attachStack(res.id, stack)
  return res
}

/**
 * Reports video motion/direction on a subject.
 *
 * Input: `attribute`, `subject`.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @param attribute See function signature for accepted input values.
 * @param subject See function signature for accepted input values.
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { videoOn } from 'hikkaku/blocks'
 *
 * videoOn('motion', 'this sprite')
 * ```
 */
export const videoOn = (
  attribute: PrimitiveSource<HikkakuString>,
  subject: PrimitiveSource<HikkakuString>,
) => {
  return valueBlock<HikkakuNumber>('videoSensing_videoOn', {
    inputs: {
      ATTRIBUTE: menuInput(attribute, menuOfAttribute),
      SUBJECT: menuInput(subject, menuOfSubject),
    },
  })
}

export const menuOfAttribute = (
  attribute: VideoSensingAttribute = 'motion',
) => {
  return valueBlock<HikkakuString>('videoSensing_menu_ATTRIBUTE', {
    fields: {
      ATTRIBUTE: [attribute, null],
    },
    isShadow: true,
  })
}

export const menuOfSubject = (subject: VideoSensingSubject = 'this sprite') => {
  return valueBlock<HikkakuString>('videoSensing_menu_SUBJECT', {
    fields: {
      SUBJECT: [subject, null],
    },
    isShadow: true,
  })
}

/**
 * Turns video on or off.
 *
 * Input: `state`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param state See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { videoToggle } from 'hikkaku/blocks'
 *
 * videoToggle('on')
 * ```
 */
export const videoToggle = (state: PrimitiveSource<HikkakuString>) => {
  return block('videoSensing_videoToggle', {
    inputs: {
      VIDEO_STATE: menuInput(state, menuOfVideoState),
    },
  })
}

export const menuOfVideoState = (state: VideoState = 'on') => {
  return valueBlock<HikkakuString>('videoSensing_menu_VIDEO_STATE', {
    fields: {
      VIDEO_STATE: [state, null],
    },
    isShadow: true,
  })
}

/**
 * Sets video transparency.
 *
 * Input: `transparency`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param transparency See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { setVideoTransparency } from 'hikkaku/blocks'
 *
 * setVideoTransparency(50)
 * ```
 */
export const setVideoTransparency = (
  transparency: PrimitiveSource<HikkakuNumber>,
) => {
  return block('videoSensing_setVideoTransparency', {
    inputs: {
      TRANSPARENCY: fromPrimitiveSource(InputType.Number, transparency, 50),
    },
  })
}

/**
 * Boolean check for video on state.
 *
 * Input: none.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 */
export const isVideoOn = () => {
  return valueBlock<HikkakuBool>('videoSensing_videoOn', {})
}
