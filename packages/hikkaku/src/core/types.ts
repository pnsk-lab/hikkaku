import type { Costume, Sound } from 'sb3-types'

export type PrimitiveAvailableOnScratch = number | boolean | string

export type PrimitiveSource<T extends PrimitiveAvailableOnScratch> =
  | T
  | HikkakuBlock

export interface VariableBase {
  id: string
  name: string
}

export interface MonitorPosition {
  x?: number | null
  y?: number | null
}

export type VariableMonitorMode = 'default' | 'large' | 'slider'

export interface VariableMonitorOptions extends MonitorPosition {
  visible?: boolean
  mode?: VariableMonitorMode
  sliderMin?: number
  sliderMax?: number
  isDiscrete?: boolean
}

export interface ListMonitorOptions extends MonitorPosition {
  visible?: boolean
  width?: number
  height?: number
}

export interface CreateVariableOptions {
  isCloudVariable?: boolean
  monitor?: VariableMonitorOptions
}

export interface CreateListOptions {
  monitor?: ListMonitorOptions
}

export interface VariableReference extends VariableBase {
  type: 'variable'
}

export interface VariableDefinition extends VariableReference {
  get(): HikkakuBlock
  set(value: PrimitiveSource<number | string>): HikkakuBlock
}

export interface ListReference extends VariableBase {
  type: 'list'
}

export interface CostumeReference {
  name: string
  type: 'costume'
}

export type CostumeSource = PrimitiveSource<string> | CostumeReference

export interface SoundReference {
  name: string
  type: 'sound'
}

export type SoundSource = PrimitiveSource<string> | SoundReference

export interface HikkakuBlock {
  isBlock: true
  id: string
}

export type CostumeData = Costume & { _data?: Uint8Array }
export type SoundData = Sound & { _data?: Uint8Array }
