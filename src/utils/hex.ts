/**
 * Utils for hex
 * @module
 */

/**
 * convert Uint8Array to hex
 * @param data Source data
 * @returns hex string
 */
export const uint8ArrayToHex = (data: Uint8Array): string => {
  return [...data]
    .map((x) => x.toString(16).padStart(2, '0')).join('')
}
