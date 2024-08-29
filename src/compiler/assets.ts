export const fileFormats: Record<string, string> = {
  'wav': 'audio/wav',
  'mp3': 'audio/mpeg',
  'png': 'image/png',
  'svg': 'image/svg+xml'
}

export const getFormatFromMime = (mime: string): string => {
  for (const format in fileFormats) {
    if (mime.startsWith(fileFormats[format])) {
      return format
    }
  }
  throw new TypeError(`Mimetype ${mime} is not supported by Scratch.`)
}
export const getMimeFromName = (name: string) => {
  for (const format in fileFormats) {
    if (name.endsWith(format)) {
      return fileFormats[format]
    }
  }
  throw new Error(`Couldn't analize name.`)
}

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