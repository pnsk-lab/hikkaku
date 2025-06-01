import type * as sb3 from "@pnsk-lab/sb3-types";

export type PrimitiveAvailableOnScratch = number | boolean | string;

export type PrimitiveSource<T extends PrimitiveAvailableOnScratch> = T | HikkakuBlock

export interface HikkakuBlock {
  id: string
}
