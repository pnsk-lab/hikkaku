import { Runtime } from '../runtime/runtime.ts'

const canvas = document.getElementById('canvas') as HTMLCanvasElement

const runtime = new Runtime({
  canvas,
  ast: await fetch('/ast.json').then(res => res.json())
})
await runtime.start()
