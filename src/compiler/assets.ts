/**
 * Utils for assets
 * @module
 */

/**
 * File formats map that Scratch supports.
 */
export const fileFormats: Record<string, string> = {
  'wav': 'audio/wav',
  'mp3': 'audio/mpeg',
  'png': 'image/png',
  'svg': 'image/svg+xml'
}

/**
 * Get file format from mimetype
 * @param mime Mime Type
 * @returns file ext
 */
export const getFormatFromMime = (mime: string): string => {
  for (const format in fileFormats) {
    if (mime.startsWith(fileFormats[format])) {
      return format
    }
  }
  throw new TypeError(`Mimetype ${mime} is not supported by Scratch.`)
}

/**
 * Get mimetype from filename or filepath
 * @param name filename or filepath
 * @returns mimetype
 */
export const getMimeFromName = (name: string) => {
  for (const format in fileFormats) {
    if (name.endsWith(format)) {
      return fileFormats[format]
    }
  }
  throw new Error(`Couldn't analize name.`)
}

/**
 * Fetch asset from URL or filepath
 * @param pathOrURL relative file path or file URL
 * @returns Blob
 */
export const fetchAsset = async (pathOrURL: URL | string): Promise<Blob> => {
  let blob: Blob
  if (URL.canParse(pathOrURL)) {
    const res = await fetch(pathOrURL)
    const type = res.headers.get('Content-Type') ?? getMimeFromName(pathOrURL.toString())
    blob = new Blob([await res.arrayBuffer()], {
      type
    })
  } else {
    blob = new Blob([await Deno.readFile(pathOrURL)], {
      type: getMimeFromName(pathOrURL.toString())
    })
  }
  return blob
}
