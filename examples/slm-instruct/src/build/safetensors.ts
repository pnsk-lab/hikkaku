import type { SafetensorsDType, SafetensorsTensorEntry } from './types'

interface RawSafetensorsTensorEntry {
  readonly dtype: string
  readonly shape: readonly number[]
  readonly data_offsets: readonly [number, number]
}

const PRODUCT = (shape: readonly number[]) =>
  shape.reduce((acc, value) => acc * value, 1)

const f16BitsToNumber = (bits: number) => {
  const sign = (bits & 0x8000) !== 0 ? -1 : 1
  const exponent = (bits >> 10) & 0x1f
  const fraction = bits & 0x03ff
  if (exponent === 0) {
    if (fraction === 0) {
      return sign * 0
    }
    return sign * 2 ** -14 * (fraction / 0x0400)
  }
  if (exponent === 0x1f) {
    return fraction === 0 ? sign * Number.POSITIVE_INFINITY : Number.NaN
  }
  return sign * 2 ** (exponent - 15) * (1 + fraction / 0x0400)
}

const bf16BitsToNumber = (bits: number) => {
  const floatView = new Float32Array(1)
  const intView = new Uint32Array(floatView.buffer)
  intView[0] = bits << 16
  return floatView[0] ?? 0
}

const bytesPerElement = (dtype: SafetensorsDType) => {
  switch (dtype) {
    case 'F32':
      return 4
    case 'BF16':
    case 'F16':
      return 2
    default:
      throw new Error(`Unsupported tensor dtype: ${dtype}`)
  }
}

export class SafetensorsFile {
  readonly #buffer: ArrayBuffer
  readonly #dataBaseOffset: number
  readonly tensors: readonly SafetensorsTensorEntry[]

  private constructor(
    buffer: ArrayBuffer,
    dataBaseOffset: number,
    tensors: readonly SafetensorsTensorEntry[],
  ) {
    this.#buffer = buffer
    this.#dataBaseOffset = dataBaseOffset
    this.tensors = tensors
  }

  static async fromFile(path: string | URL): Promise<SafetensorsFile> {
    const buffer = await Bun.file(path).arrayBuffer()
    const view = new DataView(buffer)
    const headerLength = Number(view.getBigUint64(0, true))
    const headerBytes = new Uint8Array(buffer, 8, headerLength)
    const headerText = new TextDecoder().decode(headerBytes)
    const header = JSON.parse(headerText) as Record<
      string,
      RawSafetensorsTensorEntry | Record<string, unknown>
    >

    const tensors = Object.entries(header)
      .filter(([name]) => name !== '__metadata__')
      .map(([name, value]) => {
        const entry = value as RawSafetensorsTensorEntry
        if (!['F32', 'BF16', 'F16'].includes(entry.dtype)) {
          throw new Error(
            `Unsupported tensor dtype for ${name}: ${entry.dtype}`,
          )
        }
        return {
          name,
          dtype: entry.dtype as SafetensorsDType,
          shape: entry.shape,
          data_offsets: entry.data_offsets,
        }
      })
      .sort((left, right) => left.name.localeCompare(right.name))

    return new SafetensorsFile(buffer, 8 + headerLength, tensors)
  }

  getTensorData(name: string): Float32Array {
    const tensor = this.tensors.find((entry) => entry.name === name)
    if (!tensor) {
      throw new Error(`Tensor not found: ${name}`)
    }
    const [start, end] = tensor.data_offsets
    const byteOffset = this.#dataBaseOffset + start
    const byteLength = end - start
    const expectedLength = PRODUCT(tensor.shape)
    const elementBytes = bytesPerElement(tensor.dtype)
    const actualLength = byteLength / elementBytes
    if (actualLength !== expectedLength) {
      throw new Error(
        `Tensor length mismatch for ${name}: expected ${expectedLength}, got ${actualLength}`,
      )
    }
    if (tensor.dtype === 'F32') {
      return new Float32Array(
        this.#buffer.slice(byteOffset, byteOffset + byteLength),
      )
    }

    const source = new Uint16Array(this.#buffer, byteOffset, actualLength)
    const converted = new Float32Array(actualLength)
    for (let index = 0; index < actualLength; index += 1) {
      const bits = source[index] ?? 0
      converted[index] =
        tensor.dtype === 'BF16' ? bf16BitsToNumber(bits) : f16BitsToNumber(bits)
    }
    return converted
  }
}
