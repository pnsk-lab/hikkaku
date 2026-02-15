import { describe, expect, test } from 'vite-plus/test'

import { moonscratch } from './bindings.ts'

describe('moonscratch/js/vm/bindings.ts', () => {
  test('exports generated vm bindings', () => {
    expect(typeof moonscratch.vm_compile_from_json).toBe('function')
    expect(typeof moonscratch.vm_new_from_compiled).toBe('function')
    expect(typeof moonscratch.vm_step_frame).toBe('function')
    expect(typeof moonscratch.vm_set_time).toBe('function')
    expect(typeof moonscratch.vm_render_frame).toBe('function')
  })
})
