import { describe, expect, test } from 'vite-plus/test'
import { block, createBlocks } from '../core/composer'
import { say } from './looks'
import { getViewerLanguage, translate } from './translate'

describe('blocks/translate', () => {
  test('creates translate extension blocks', () => {
    const blocks = createBlocks(() => {
      block('event_whenflagclicked', { topLevel: true })
      say(translate('hello', 'ja'))
      say(getViewerLanguage())
    })

    const opcodes = Object.values(blocks).map((b) => b.opcode)
    expect(opcodes).toContain('translate_getTranslate')
    expect(opcodes).toContain('translate_getViewerLanguage')
  })
})
