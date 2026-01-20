import type * as sb3 from "@pnsk-lab/sb3-types";

export type PrimitiveAvailableOnScratch = number | boolean | string;

export type PrimitiveSource<T extends PrimitiveAvailableOnScratch> = T | HikkakuBlock

export interface VariableBase {
  id: string
  name: string
}

export interface VariableReference extends VariableBase {
  type: 'variable'
}

export interface ListReference extends VariableBase {
  type: 'list'
}

export interface HikkakuBlock {
  id: string
}
