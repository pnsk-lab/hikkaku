import { InputType } from 'sb3-types/enum'
import { fromPrimitiveSource, menuInput } from '../core/block-helper'
import { valueBlock } from '../core/composer'
import type { HikkakuString, PrimitiveSource } from '../core/types'

/**
 * Translates words to the given language.
 *
 * Input: `words`, `language`.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @param words See function signature for accepted input values.
 * @param language See function signature for accepted input values.
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { getTranslate } from 'hikkaku/blocks'
 *
 * getTranslate('hello', 'fr')
 * ```
 */
export const getTranslate = (
  words: PrimitiveSource<HikkakuString>,
  language: PrimitiveSource<HikkakuString>,
) => {
  return valueBlock<HikkakuString>('translate_getTranslate', {
    inputs: {
      WORDS: fromPrimitiveSource(InputType.String, words, 'hello'),
      LANGUAGE: menuInput(language, menuOfLanguages),
    },
  })
}

export const menuOfLanguages = (language = 'fr') => {
  return valueBlock<HikkakuString>('translate_menu_languages', {
    fields: {
      languages: [language, null],
    },
    isShadow: true,
  })
}

/**
 * Returns the language of the viewer.
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
