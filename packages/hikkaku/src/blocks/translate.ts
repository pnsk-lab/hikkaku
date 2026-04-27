import { InputType } from 'sb3-types/enum'
import { fromPrimitiveSource } from '../core/block-helper'
import { valueBlock } from '../core/composer'
import type { HikkakuString, PrimitiveSource } from '../core/types'

export const translate = (
  words: PrimitiveSource<HikkakuString>,
  language: PrimitiveSource<HikkakuString>,
) => {
  return valueBlock<HikkakuString>('translate_getTranslate', {
    inputs: {
      WORDS: fromPrimitiveSource(InputType.String, words, 'hello'),
      LANGUAGE: fromPrimitiveSource(InputType.String, language, 'ja'),
    },
  })
}

export const getViewerLanguage = () => {
  return valueBlock<HikkakuString>('translate_getViewerLanguage', {})
}
