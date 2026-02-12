declare module 'sharp' {
  type SharpPipeline = {
    ensureAlpha(): SharpPipeline
    raw(): SharpPipeline
    toBuffer(options: { resolveWithObject: true }): Promise<{
      data: Uint8Array
      info: {
        width: number
        height: number
      }
    }>
  }

  const sharp: (input?: unknown) => SharpPipeline
  export default sharp
}
