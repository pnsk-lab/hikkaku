import { InputType } from 'sb3-types/enum'
import { fromPrimitiveSource } from '../core/block-helper'
import { block, valueBlock } from '../core/composer'
import type {
  HikkakuNumber,
  HikkakuString,
  PrimitiveSource,
} from '../core/types'

export type VideoSensingAttribute = 'motion' | 'direction'
export type VideoSensingSubject = 'this sprite' | 'stage'
export type VideoState = 'on' | 'off' | 'on-flipped'

export const whenMotionGreaterThan = (
  reference: PrimitiveSource<HikkakuNumber>,
) => {
  return block('videoSensing_whenMotionGreaterThan', {
    inputs: {
      REFERENCE: fromPrimitiveSource(InputType.Number, reference, 10),
    },
  })
}

export const videoOn = (
  attribute: PrimitiveSource<HikkakuString>,
  subject: PrimitiveSource<HikkakuString>,
) => {
  return valueBlock<HikkakuNumber>('videoSensing_videoOn', {
    inputs: {
      ATTRIBUTE: fromPrimitiveSource(InputType.String, attribute, 'motion'),
      SUBJECT: fromPrimitiveSource(InputType.String, subject, 'this sprite'),
    },
  })
}

export const videoToggle = (state: PrimitiveSource<HikkakuString>) => {
  return block('videoSensing_videoToggle', {
    inputs: {
      VIDEO_STATE: fromPrimitiveSource(InputType.String, state, 'on'),
    },
  })
}

export const setVideoTransparency = (
  transparency: PrimitiveSource<HikkakuNumber>,
) => {
  return block('videoSensing_setVideoTransparency', {
    inputs: {
      TRANSPARENCY: fromPrimitiveSource(InputType.Number, transparency, 50),
    },
  })
}
