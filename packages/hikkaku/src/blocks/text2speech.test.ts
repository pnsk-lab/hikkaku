import { describe, expect, test } from 'vite-plus/test'
import { block, createBlocks } from '../core/composer'
import {
  setLanguage,
  setVoice,
  speakAndWait,
  type TextToSpeechVoice,
} from './text2speech'

// Scratch only exposes its five supported voice IDs.
// @ts-expect-error GOOGLE is not a Scratch voice
const unsupportedVoice: TextToSpeechVoice = 'GOOGLE'
void unsupportedVoice

describe('blocks/text2speech', () => {
  test('rejects unsupported literal voices', () => {
    expect(() => createBlocks(() => setVoice('GOOGLE'))).toThrow(
      'Unsupported text-to-speech voice: GOOGLE',
    )
  })

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
    const voiceMenu = Object.values(blocks).find(
      (b) => b.opcode === 'text2speech_menu_voices',
    )
    expect(voiceMenu?.fields?.voices).toEqual(['TENOR', null])
    expect(opcodes).toContain('text2speech_setLanguage')
    expect(opcodes).toContain('text2speech_menu_languages')
    expect(opcodes).toContain('text2speech_speakAndWait')
  })
})
