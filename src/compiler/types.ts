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

export interface CostumeReference {
  name: string
  type: 'costume'
}

export type CostumeSource = PrimitiveSource<string> | CostumeReference

export interface HikkakuBlock {
  id: string
}
