import type { CanvasLike } from '../assets/types.ts'
import type {
  RenderFrame,
  RenderImageData,
  RenderWithWebGLOptions,
  RenderWithWebGLResult,
} from './types.ts'
import { normalizeRenderFrame } from './utils.ts'

const normalizeCanvas = (width: number, height: number): CanvasLike | null => {
  const global = globalThis as {
    OffscreenCanvas?: new (width: number, height: number) => CanvasLike
    document?: { createElement(tag: string): CanvasLike }
  }
  if (global.OffscreenCanvas) {
    return new global.OffscreenCanvas(width, height)
  }
  if (global.document?.createElement) {
    return global.document.createElement('canvas')
  }
  return null
}

const createWebGLContext = (canvas: CanvasLike): unknown => {
  const raw = canvas.getContext as (type: string, options?: unknown) => unknown
  return (
    raw('webgl2', { preserveDrawingBuffer: true }) ??
    raw('webgl', { preserveDrawingBuffer: true })
  )
}

const isWebGLContext = (
  context: unknown,
): context is WebGLRenderingContextLike =>
  typeof context === 'object' &&
  context !== null &&
  'createTexture' in context &&
  'createBuffer' in context &&
  'createProgram' in context &&
  'drawArrays' in context

type WebGLRenderingContextLike = {
  ARRAY_BUFFER: number
  CLAMP_TO_EDGE: number
  COLOR_BUFFER_BIT: number
  COMPILE_STATUS: number
  FRAGMENT_SHADER: number
  FLOAT: number
  LINK_STATUS: number
  NEAREST: number
  RGBA: number
  STATIC_DRAW: number
  TEXTURE0: number
  TEXTURE_WRAP_S: number
  TEXTURE_WRAP_T: number
  TEXTURE_2D: number
  TEXTURE_MIN_FILTER: number
  TEXTURE_MAG_FILTER: number
  TRIANGLE_STRIP: number
  UNSIGNED_BYTE: number
  VERTEX_SHADER: number
  activeTexture(texture: number): void
  attachShader(program: unknown, shader: unknown): void
  bindBuffer(target: number, buffer: unknown): void
  bindTexture(target: number, texture: unknown): void
  clear(mask: number): void
  clearColor(r: number, g: number, b: number, a: number): void
  compileShader(shader: unknown): void
  createBuffer(): unknown
  createProgram(): unknown
  createShader(type: number): unknown
  createTexture(): unknown
  createFramebuffer?(): unknown
  drawArrays(mode: number, first: number, count: number): void
  enableVertexAttribArray(location: number): void
  bufferData(target: number, data: ArrayBufferView, usage: number): void
  getAttribLocation(program: unknown, name: string): number
  getError?(): number
  getProgramInfoLog(program: unknown): string | null
  getProgramParameter(program: unknown, pname: number): unknown
  getShaderInfoLog(shader: unknown): string | null
  getShaderParameter(shader: unknown, pname: number): unknown
  getUniformLocation(program: unknown, name: string): unknown
  linkProgram(program: unknown): void
  pixelStorei(...args: unknown[]): void
  readPixels(
    x: number,
    y: number,
    width: number,
    height: number,
    format: number,
    type: number,
    pixels: Uint8Array,
  ): void
  shaderSource(shader: unknown, source: string): void
  uniform1i(location: unknown, value: number): void
  useProgram(program: unknown): void
  vertexAttribPointer(
    index: number,
    size: number,
    type: number,
    normalized: boolean,
    stride: number,
    offset: number,
  ): void
  viewport(x: number, y: number, width: number, height: number): void
  texParameteri(target: number, pname: number, param: number): void
  texImage2D(
    target: number,
    level: number,
    internalformat: number,
    width: number,
    height: number,
    border: number,
    format: number,
    type: number,
    pixels: Uint8Array | null,
  ): void
  bindVertexArray?(vertexArray: unknown): void
  createVertexArray?(): unknown
}

const createProgram = (gl: WebGLRenderingContextLike): unknown => {
  const vertexShader = gl.createShader(gl.VERTEX_SHADER)
  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
  if (!vertexShader || !fragmentShader) {
    throw new Error('Unable to create WebGL shaders')
  }

  const vertexSource = `
attribute vec2 a_position;
attribute vec2 a_tex_coord;
varying vec2 v_tex_coord;
void main() {
  v_tex_coord = a_tex_coord;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`
  const fragmentSource = `
precision mediump float;
varying vec2 v_tex_coord;
uniform sampler2D u_texture;
void main() {
  gl_FragColor = texture2D(u_texture, v_tex_coord);
}`

  gl.shaderSource(vertexShader, vertexSource)
  gl.compileShader(vertexShader)
  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    throw new Error('Unable to compile WebGL vertex shader')
  }

  gl.shaderSource(fragmentShader, fragmentSource)
  gl.compileShader(fragmentShader)
  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    throw new Error('Unable to compile WebGL fragment shader')
  }

  const program = gl.createProgram()
  if (!program) {
    throw new Error('Unable to create WebGL program')
  }
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) ?? 'linking failed'
    throw new Error(`Unable to link WebGL program: ${message}`)
  }
  return program
}

export const renderWithWebGL = (
  input: RenderFrame,
  options: RenderWithWebGLOptions = {},
): RenderWithWebGLResult => {
  const frame = normalizeRenderFrame(input)
  const canvas = options.canvas ?? normalizeCanvas(frame.width, frame.height)
  if (!canvas) {
    throw new Error(
      'renderWithWebGL requires a canvas and an environment that supports canvas',
    )
  }

  canvas.width = frame.width
  canvas.height = frame.height
  const rawContext = createWebGLContext(canvas)
  if (!isWebGLContext(rawContext)) {
    throw new Error('renderWithWebGL requires a webgl-capable canvas')
  }
  const gl = rawContext

  const program = createProgram(gl)
  gl.useProgram(program)

  const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1])
  const texCoords = new Float32Array([0, 1, 1, 1, 0, 0, 1, 0])
  const buffer = gl.createBuffer()
  const texBuffer = gl.createBuffer()
  if (!buffer || !texBuffer) {
    throw new Error('Unable to allocate WebGL buffers')
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)
  const positionLocation = gl.getAttribLocation(program, 'a_position')
  gl.enableVertexAttribArray(positionLocation)
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

  gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW)
  const texCoordLocation = gl.getAttribLocation(program, 'a_tex_coord')
  gl.enableVertexAttribArray(texCoordLocation)
  gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0)

  const texture = gl.createTexture()
  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.pixelStorei(0x9240, true)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    frame.width,
    frame.height,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    frame.pixels,
  )
  const sampler = gl.getUniformLocation(program, 'u_texture')
  gl.uniform1i(sampler, 0)

  gl.viewport(0, 0, frame.width, frame.height)
  gl.clearColor(0, 0, 0, 0)
  gl.clear(gl.COLOR_BUFFER_BIT)
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

  let imageDataCache: RenderImageData | null = null
  const readback = (): RenderImageData => {
    if (imageDataCache !== null) {
      return imageDataCache
    }
    const out = new Uint8Array(frame.width * frame.height * 4)
    if (frame.width > 0 && frame.height > 0) {
      gl.readPixels(
        0,
        0,
        frame.width,
        frame.height,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        out,
      )
    }
    imageDataCache = {
      width: frame.width,
      height: frame.height,
      data: new Uint8ClampedArray(out),
    }
    return imageDataCache
  }

  const imageElement = () => canvas

  return {
    canvas,
    toImageData: readback,
    toImageElement: imageElement,
  }
}
