import type { Costume, Sound } from 'sb3-types'

export type PrimitiveAvailableOnScratch = number | boolean | string

type HikkakuTypeTag = 'number' | 'bool' | 'string'
type HikkakuBrand<T extends HikkakuTypeTag> = {
  readonly __hikkakuType: T
}

export type HikkakuNumber = HikkakuBrand<'number'>
export type HikkakuBool = HikkakuBrand<'bool'>
export type HikkakuString = HikkakuBrand<'string'>
export type HikkakuType = HikkakuNumber | HikkakuBool | HikkakuString

export type PrimitiveToHikkakuType<T extends PrimitiveAvailableOnScratch> =
  T extends number
    ? HikkakuNumber
    : T extends boolean
      ? HikkakuBool
      : T extends string
        ? HikkakuString
        : never

export type HikkakuTypeToPrimitive<T extends HikkakuType> =
  T extends HikkakuNumber
    ? number
    : T extends HikkakuBool
      ? boolean
      : T extends HikkakuString
        ? string
        : never

export interface HikkakuBlock {
  isBlock: true
  id: string
}

export interface HikkakuReporterBlock<T extends HikkakuType = HikkakuType>
  extends HikkakuBlock {
  readonly __hikkakuType: T['__hikkakuType']
}

export type PrimitiveSource<T extends HikkakuType> =
  | HikkakuTypeToPrimitive<T>
  | HikkakuReporterBlock

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
  get(): HikkakuReporterBlock<HikkakuNumber | HikkakuString>
  set(value: PrimitiveSource<HikkakuNumber | HikkakuString>): HikkakuBlock
}

export interface ListReference extends VariableBase {
  type: 'list'
}

export interface CostumeReference {
  name: string
  type: 'costume'
}

export type CostumeSource = PrimitiveSource<HikkakuString> | CostumeReference

export interface SoundReference {
  name: string
  type: 'sound'
}

export type SoundSource = PrimitiveSource<HikkakuString> | SoundReference

export type CostumeData = Costume & { _data?: Uint8Array }
export type SoundData = Sound & { _data?: Uint8Array }
