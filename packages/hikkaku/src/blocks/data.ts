import type { Fields } from '@pnsk-lab/sb3-types'
import { fromPrimitiveSource } from '../compiler/block-helper'
import { block, valueBlock } from '../compiler/composer'
import type {
  ListReference,
  PrimitiveSource,
  VariableReference,
} from '../compiler/types'

export type ListIndex = PrimitiveSource<number | string>

const toField = (field: VariableReference | ListReference): Fields => [
  field.name,
  field.id,
]

export const getVariable = (variable: VariableReference) => {
  return valueBlock('data_variable', {
    fields: {
      VARIABLE: toField(variable),
    },
  })
}

export const setVariableTo = (
  variable: VariableReference,
  value: PrimitiveSource<number | string>,
) => {
  return block('data_setvariableto', {
    inputs: {
      VALUE: fromPrimitiveSource(value),
    },
    fields: {
      VARIABLE: toField(variable),
    },
  })
}

export const changeVariableBy = (
  variable: VariableReference,
  value: PrimitiveSource<number>,
) => {
  return block('data_changevariableby', {
    inputs: {
      VALUE: fromPrimitiveSource(value),
    },
    fields: {
      VARIABLE: toField(variable),
    },
  })
}

export const showVariable = (variable: VariableReference) => {
  return block('data_showvariable', {
    fields: {
      VARIABLE: toField(variable),
    },
  })
}

export const hideVariable = (variable: VariableReference) => {
  return block('data_hidevariable', {
    fields: {
      VARIABLE: toField(variable),
    },
  })
}

export const getListContents = (list: ListReference) => {
  return valueBlock('data_listcontents', {
    fields: {
      LIST: toField(list),
    },
  })
}

export const addToList = (
  list: ListReference,
  item: PrimitiveSource<string | number>,
) => {
  return block('data_addtolist', {
    inputs: {
      ITEM: fromPrimitiveSource(item),
    },
    fields: {
      LIST: toField(list),
    },
  })
}

export const deleteOfList = (list: ListReference, index: ListIndex) => {
  return block('data_deleteoflist', {
    inputs: {
      INDEX: fromPrimitiveSource(index),
    },
    fields: {
      LIST: toField(list),
    },
  })
}

export const deleteAllOfList = (list: ListReference) => {
  return block('data_deletealloflist', {
    fields: {
      LIST: toField(list),
    },
  })
}

export const insertAtList = (
  list: ListReference,
  index: ListIndex,
  item: PrimitiveSource<string | number>,
) => {
  return block('data_insertatlist', {
    inputs: {
      INDEX: fromPrimitiveSource(index),
      ITEM: fromPrimitiveSource(item),
    },
    fields: {
      LIST: toField(list),
    },
  })
}

export const replaceItemOfList = (
  list: ListReference,
  index: ListIndex,
  item: PrimitiveSource<string | number>,
) => {
  return block('data_replaceitemoflist', {
    inputs: {
      INDEX: fromPrimitiveSource(index),
      ITEM: fromPrimitiveSource(item),
    },
    fields: {
      LIST: toField(list),
    },
  })
}

export const getItemOfList = (list: ListReference, index: ListIndex) => {
  return valueBlock('data_itemoflist', {
    inputs: {
      INDEX: fromPrimitiveSource(index),
    },
    fields: {
      LIST: toField(list),
    },
  })
}

export const getItemNumOfList = (
  list: ListReference,
  item: PrimitiveSource<string | number>,
) => {
  return valueBlock('data_itemnumoflist', {
    inputs: {
      ITEM: fromPrimitiveSource(item),
    },
    fields: {
      LIST: toField(list),
    },
  })
}

export const lengthOfList = (list: ListReference) => {
  return valueBlock('data_lengthoflist', {
    fields: {
      LIST: toField(list),
    },
  })
}

export const listContainsItem = (
  list: ListReference,
  item: PrimitiveSource<string | number>,
) => {
  return valueBlock('data_listcontainsitem', {
    inputs: {
      ITEM: fromPrimitiveSource(item),
    },
    fields: {
      LIST: toField(list),
    },
  })
}

export const showList = (list: ListReference) => {
  return block('data_showlist', {
    fields: {
      LIST: toField(list),
    },
  })
}

export const hideList = (list: ListReference) => {
  return block('data_hidelist', {
    fields: {
      LIST: toField(list),
    },
  })
}
