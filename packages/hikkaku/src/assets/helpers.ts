import type * as sb3 from 'sb3-types'

export const svg = (id: string): sb3.Costume =>
  ({
    name: id,
    dataFormat: 'svg',
    assetId: id,
    md5ext: `${id}.svg`,
  }) as const
export const png = (id: string) =>
  ({
    dataFormat: 'png',
    assetId: id,
  }) as const
export const sound = (
  name: string,
  assetId: string,
  sampleCount: number,
  rate: number,
): sb3.Sound =>
  ({
    name,
    assetId,
    dataFormat: 'wav',
    md5ext: `${assetId}.wav`,
    sampleCount,
    rate,
  }) as const
