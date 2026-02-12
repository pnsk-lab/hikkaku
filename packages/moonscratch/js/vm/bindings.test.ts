import { describe, expect, test } from 'vite-plus/test'

import { moonscratch } from './bindings.ts'

describe('moonscratch/js/vm/bindings.ts', () => {
  test('exports generated vm bindings', () => {
    expect(typeof moonscratch.vm_new_from_json).toBe('function')
    expect(typeof moonscratch.vm_step).toBe('function')
    expect(typeof moonscratch.vm_render_svg).toBe('function')
  })
})
