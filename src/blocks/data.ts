import { fromPrimitiveSource } from "../compiler/block-helper"
import { block } from "../compiler/composer"
import type { PrimitiveSource, ListReference, VariableReference } from "../compiler/types"

export type VariableField = VariableReference
export type ListField = ListReference
export type ListIndex = PrimitiveSource<number | string>

const toField = (field: VariableField | ListField) => [field.name, field.id] as const

export const getVariable = (variable: VariableField) => {
  return block('data_variable', {
    fields: {
      VARIABLE: toField(variable)
    }
  })
}

export const setVariableTo = (
  variable: VariableField,
  value: PrimitiveSource<number | string>
) => {
  return block('data_setvariableto', {
    inputs: {
      VALUE: fromPrimitiveSource(value)
    },
    fields: {
      VARIABLE: toField(variable)
    }
  })
}

export const changeVariableBy = (
  variable: VariableField,
  value: PrimitiveSource<number>
) => {
  return block('data_changevariableby', {
    inputs: {
      VALUE: fromPrimitiveSource(value)
    },
    fields: {
      VARIABLE: toField(variable)
    }
  })
}

export const showVariable = (variable: VariableField) => {
  return block('data_showvariable', {
    fields: {
      VARIABLE: toField(variable)
    }
  })
}

export const hideVariable = (variable: VariableField) => {
  return block('data_hidevariable', {
    fields: {
      VARIABLE: toField(variable)
    }
  })
}

export const getListContents = (list: ListField) => {
  return block('data_listcontents', {
    fields: {
      LIST: toField(list)
    }
  })
}

export const addToList = (
  list: ListField,
  item: PrimitiveSource<string | number>
) => {
  return block('data_addtolist', {
    inputs: {
      ITEM: fromPrimitiveSource(item)
    },
    fields: {
      LIST: toField(list)
    }
  })
}

export const deleteOfList = (list: ListField, index: ListIndex) => {
  return block('data_deleteoflist', {
    inputs: {
      INDEX: fromPrimitiveSource(index)
    },
    fields: {
      LIST: toField(list)
    }
  })
}

export const deleteAllOfList = (list: ListField) => {
  return block('data_deletealloflist', {
    fields: {
      LIST: toField(list)
    }
  })
}

export const insertAtList = (
  list: ListField,
  index: ListIndex,
  item: PrimitiveSource<string | number>
) => {
  return block('data_insertatlist', {
    inputs: {
      INDEX: fromPrimitiveSource(index),
      ITEM: fromPrimitiveSource(item)
    },
    fields: {
      LIST: toField(list)
    }
  })
}

export const replaceItemOfList = (
  list: ListField,
  index: ListIndex,
  item: PrimitiveSource<string | number>
) => {
  return block('data_replaceitemoflist', {
    inputs: {
      INDEX: fromPrimitiveSource(index),
      ITEM: fromPrimitiveSource(item)
    },
    fields: {
      LIST: toField(list)
    }
  })
}

export const getItemOfList = (list: ListField, index: ListIndex) => {
  return block('data_itemoflist', {
    inputs: {
      INDEX: fromPrimitiveSource(index)
    },
    fields: {
      LIST: toField(list)
    }
  })
}

export const getItemNumOfList = (
  list: ListField,
  item: PrimitiveSource<string | number>
) => {
  return block('data_itemnumoflist', {
    inputs: {
      ITEM: fromPrimitiveSource(item)
    },
    fields: {
      LIST: toField(list)
    }
  })
}

export const lengthOfList = (list: ListField) => {
  return block('data_lengthoflist', {
    fields: {
      LIST: toField(list)
    }
  })
}

export const listContainsItem = (
  list: ListField,
  item: PrimitiveSource<string | number>
) => {
  return block('data_listcontainsitem', {
    inputs: {
      ITEM: fromPrimitiveSource(item)
    },
    fields: {
      LIST: toField(list)
    }
  })
}

export const showList = (list: ListField) => {
  return block('data_showlist', {
    fields: {
      LIST: toField(list)
    }
  })
}

export const hideList = (list: ListField) => {
  return block('data_hidelist', {
    fields: {
      LIST: toField(list)
    }
  })
}
