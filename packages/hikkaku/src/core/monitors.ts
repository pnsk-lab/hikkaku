import type * as sb3 from 'sb3-types'
import type { ListMonitorOptions, VariableMonitorOptions } from './types'

export interface VariableMonitor {
  id: string
  mode: 'default' | 'large' | 'slider'
  opcode: 'data_variable'
  params: {
    VARIABLE: string
  }
  spriteName: string | null
  value: sb3.ScalarVal
  sliderMin: number
  sliderMax: number
  isDiscrete: boolean
  x: number | null
  y: number | null
  width: number
  height: number
  visible: boolean
}

export interface ListMonitor {
  id: string
  mode: 'list'
  opcode: 'data_listcontents'
  params: {
    LIST: string
  }
  spriteName: string | null
  value: sb3.ScalarVal[]
  x: number | null
  y: number | null
  width: number
  height: number
  visible: boolean
}

export type Monitor = VariableMonitor | ListMonitor

export const createVariableMonitor = (
  id: string,
  name: string,
  defaultValue: sb3.ScalarVal,
  spriteName: string | null,
  options: VariableMonitorOptions,
): VariableMonitor => {
  const sliderMin = options.sliderMin ?? 0
  const sliderMax = options.sliderMax ?? 100

  return {
    id,
    mode: options.mode ?? 'default',
    opcode: 'data_variable',
    params: {
      VARIABLE: name,
    },
    spriteName,
    value: defaultValue,
    sliderMin: Math.min(sliderMin, sliderMax),
    sliderMax: Math.max(sliderMin, sliderMax),
    isDiscrete: options.isDiscrete ?? true,
    x: options.x ?? null,
    y: options.y ?? null,
    width: 0,
    height: 0,
    visible: options.visible ?? true,
  }
}

export const createListMonitor = (
  id: string,
  name: string,
  defaultValue: sb3.ScalarVal[],
  spriteName: string | null,
  options: ListMonitorOptions,
): ListMonitor => {
  return {
    id,
    mode: 'list',
    opcode: 'data_listcontents',
    params: {
      LIST: name,
    },
    spriteName,
    value: [...defaultValue],
    x: options.x ?? null,
    y: options.y ?? null,
    width: options.width ?? 0,
    height: options.height ?? 0,
    visible: options.visible ?? true,
  }
}

export const cloneMonitor = (monitor: Monitor): Monitor => {
  if (monitor.mode === 'list') {
    return {
      ...monitor,
      params: {
        ...monitor.params,
      },
      value: [...monitor.value],
    }
  }
  return {
    ...monitor,
    params: {
      ...monitor.params,
    },
  }
}
