import { InputType } from 'sb3-types/enum'
import { fromPrimitiveSource, menuInput } from '../core/block-helper'
import { valueBlock } from '../core/composer'
import type { HikkakuString, PrimitiveSource } from '../core/types'

/**
 * Translates words to a target language.
 *
 * Input: `words`, `language`.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @param words See function signature for accepted input values.
 * @param language See function signature for accepted input values.
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { translate } from 'hikkaku/blocks'
 *
 * translate('hello', 'ja')
 * ```
 */
export const translate = (
  words: PrimitiveSource<HikkakuString>,
  language: PrimitiveSource<HikkakuString>,
) => {
  return valueBlock<HikkakuString>('translate_getTranslate', {
    inputs: {
      WORDS: fromPrimitiveSource(InputType.String, words, 'hello'),
      LANGUAGE: menuInput(language, menuOfTranslateLanguage),
    },
  })
}

export const menuOfTranslateLanguage = (language: string = 'ja') => {
  return valueBlock<HikkakuString>('translate_menu_languages', {
    fields: {
      languages: [language, null],
    },
    isShadow: true,
  })
}

/**
 * Returns viewer language.
 *
 * Input: none.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { getViewerLanguage } from 'hikkaku/blocks'
 *
 * getViewerLanguage()
 * ```
 */
export const getViewerLanguage = () => {
  return valueBlock<HikkakuString>('translate_getViewerLanguage', {})
}
