import { describe, expect, test } from 'vite-plus/test'
import { block, createBlocks } from '../core/composer'
import { setLanguage, setVoice, speakAndWait } from './text2speech'

describe('blocks/text2speech', () => {
  test('creates text to speech extension blocks', () => {
    const blocks = createBlocks(() => {
      block('event_whenflagclicked', { topLevel: true })
      setVoice('TENOR')
      setLanguage('ja')
      speakAndWait('hello')
    })

    const opcodes = Object.values(blocks).map((b) => b.opcode)
    expect(opcodes).toContain('text2speech_setVoice')
    expect(opcodes).toContain('text2speech_menu_voices')
    expect(opcodes).toContain('text2speech_setLanguage')
    expect(opcodes).toContain('text2speech_menu_languages')
    expect(opcodes).toContain('text2speech_speakAndWait')
  })
})
