interface BufferLike {
  from(input: Uint8Array): { toString(encoding: string): string }
}

export const encodeBase64 = (bytes: Uint8Array): string => {
  const maybeBuffer = (globalThis as { Buffer?: BufferLike }).Buffer
  if (maybeBuffer) {
    return maybeBuffer.from(bytes).toString('base64')
  }

  const maybeBtoa = (globalThis as { btoa?: (binary: string) => string }).btoa
  if (typeof maybeBtoa === 'function') {
    let binary = ''
    for (let i = 0; i < bytes.length; i += 1) {
      binary += String.fromCharCode(bytes[i] ?? 0)
    }
    return maybeBtoa(binary)
  }

  throw new Error('No base64 encoder found in this runtime')
}
