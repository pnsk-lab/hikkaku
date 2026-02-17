import type { Fields } from 'sb3-types'
import { fromPrimitiveSource } from '../core/block-helper'
import { block, valueBlock } from '../core/composer'
import type {
  ListReference,
  PrimitiveSource,
  VariableReference,
} from '../core/types'

export type ListIndex = PrimitiveSource<number | string>

const toField = (field: VariableReference | ListReference): Fields => [
  field.name,
  field.id,
]

/**
 * Returns the value of a variable.
 *
 * Input: `variable`.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @param variable VariableReference
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { getVariable } from 'hikkaku/blocks'
 *
 * getVariable(variable)
 * ```
 */
export const getVariable = (variable: VariableReference) => {
  return valueBlock('data_variable', {
    fields: {
      VARIABLE: toField(variable),
    },
  })
}

/**
 * Sets a variable.
 *
 * Input: `variable`, `value`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param variable VariableReference
 * @param value PrimitiveSource<number | string>
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { setVariableTo } from 'hikkaku/blocks'
 *
 * setVariableTo(variable, 10)
 * ```
 */
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

/**
 * Changes a variable by an amount.
 *
 * Input: `variable`, `value`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param variable VariableReference
 * @param value PrimitiveSource<number>
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { changeVariableBy } from 'hikkaku/blocks'
 *
 * changeVariableBy(variable, 10)
 * ```
 */
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

/**
 * Shows variable monitor.
 *
 * Input: `variable`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param variable See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { showVariable } from 'hikkaku/blocks'
 *
 * showVariable(variable)
 * ```
 */
export const showVariable = (variable: VariableReference) => {
  return block('data_showvariable', {
    fields: {
      VARIABLE: toField(variable),
    },
  })
}

/**
 * Hides variable monitor.
 *
 * Input: `variable`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param variable See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { hideVariable } from 'hikkaku/blocks'
 *
 * hideVariable(variable)
 * ```
 */
export const hideVariable = (variable: VariableReference) => {
  return block('data_hidevariable', {
    fields: {
      VARIABLE: toField(variable),
    },
  })
}

/**
 * Returns list contents as text.
 *
 * Input: `list`.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @param list ListReference
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { getListContents } from 'hikkaku/blocks'
 *
 * getListContents(list)
 * ```
 */
export const getListContents = (list: ListReference) => {
  return valueBlock('data_listcontents', {
    fields: {
      LIST: toField(list),
    },
  })
}

/**
 * Appends an item.
 *
 * Input: `list`, `item`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param list ListReference
 * @param item PrimitiveSource<string | number>
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { addToList } from 'hikkaku/blocks'
 *
 * addToList(list, "banana")
 * ```
 */
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

/**
 * Deletes an item.
 *
 * Input: `list`, `index`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param list Input value used by this block.
 * @param index PrimitiveSource<number | string>
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { deleteOfList } from 'hikkaku/blocks'
 *
 * deleteOfList(list, 1)
 * ```
 */
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

/**
 * Clears list.
 *
 * Input: `list`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param list See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { deleteAllOfList } from 'hikkaku/blocks'
 *
 * deleteAllOfList(list)
 * ```
 */
export const deleteAllOfList = (list: ListReference) => {
  return block('data_deletealloflist', {
    fields: {
      LIST: toField(list),
    },
  })
}

/**
 * Inserts item at index.
 *
 * Input: `list`, `index`, `item`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param list See function signature for accepted input values.
 * @param index See function signature for accepted input values.
 * @param item See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { insertAtList } from 'hikkaku/blocks'
 *
 * insertAtList(list, 42, "banana")
 * ```
 */
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

/**
 * Replaces item at index.
 *
 * Input: `list`, `index`, `item`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param list See function signature for accepted input values.
 * @param index See function signature for accepted input values.
 * @param item See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { replaceItemOfList } from 'hikkaku/blocks'
 *
 * replaceItemOfList(list, 42, "banana")
 * ```
 */
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

/**
 * Returns list item.
 *
 * Input: `list`, `index`.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @param list See function signature for accepted input values.
 * @param index See function signature for accepted input values.
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { getItemOfList } from 'hikkaku/blocks'
 *
 * getItemOfList(list, 1)
 * ```
 */
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

/**
 * Returns index of item.
 *
 * Input: `list`, `item`.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @param list See function signature for accepted input values.
 * @param item See function signature for accepted input values.
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { getItemNumOfList } from 'hikkaku/blocks'
 *
 * getItemNumOfList(list, "banana")
 * ```
 */
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

/**
 * Returns list length.
 *
 * Input: `list`.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @param list See function signature for accepted input values.
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { lengthOfList } from 'hikkaku/blocks'
 *
 * lengthOfList(list)
 * ```
 */
export const lengthOfList = (list: ListReference) => {
  return valueBlock('data_lengthoflist', {
    fields: {
      LIST: toField(list),
    },
  })
}

/**
 * Checks membership.
 *
 * Input: `list`, `item`.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @param list See function signature for accepted input values.
 * @param item See function signature for accepted input values.
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { listContainsItem } from 'hikkaku/blocks'
 *
 * listContainsItem(list,"banana")
 * ```
 */
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

/**
 * Shows list monitor.
 *
 * Input: `list`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param list See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { showList } from 'hikkaku/blocks'
 *
 * showList(list)
 * ```
 */
export const showList = (list: ListReference) => {
  return block('data_showlist', {
    fields: {
      LIST: toField(list),
    },
  })
}

/**
 * Hides list monitor.
 *
 * Input: `list`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param list See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { hideList } from 'hikkaku/blocks'
 *
 * hideList(list)
 * ```
 */
export const hideList = (list: ListReference) => {
  return block('data_hidelist', {
    fields: {
      LIST: toField(list),
    },
  })
}
