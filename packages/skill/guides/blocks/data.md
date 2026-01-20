---
title: Blocks - Data
impact: HIGH
---

# Variables & Lists

## getVariable(variable)

Returns the value of a variable.

* `variable: VariableReference`

## setVariableTo(variable, value)

Sets a variable.

* `variable: VariableReference`
* `value: PrimitiveSource<number | string>`

## changeVariableBy(variable, value)

Changes a variable by an amount.

* `variable: VariableReference`
* `value: PrimitiveSource<number>`

## showVariable(variable)

Shows variable monitor.

## hideVariable(variable)

Hides variable monitor.

## getListContents(list)

Returns list contents as text.

* `list: ListReference`

## addToList(list, item)

Appends an item.

* `list: ListReference`
* `item: PrimitiveSource<string | number>`

## deleteOfList(list, index)

Deletes an item.

* `index: PrimitiveSource<number | string>`

## deleteAllOfList(list)

Clears list.

## insertAtList(list, index, item)

Inserts item at index.

## replaceItemOfList(list, index, item)

Replaces item at index.

## getItemOfList(list, index)

Returns list item.

## getItemNumOfList(list, item)

Returns index of item.

## lengthOfList(list)

Returns list length.

## listContainsItem(list, item)

Checks membership.

## showList(list)

Shows list monitor.

## hideList(list)

Hides list monitor.
