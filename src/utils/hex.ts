export const uint8ArrayToHex = (data: Uint8Array): string => {
  return [...data]
    .map(x => x.toString(16).padStart(2, '0')).join('')
}
