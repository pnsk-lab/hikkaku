---
title: Blocks - Data
impact: HIGH
---

<!-- AUTO-GENERATED FILE. Do not edit manually.
Edit packages/hikkaku/src/blocks and packages/skill/scripts/build-blocks.ts instead. -->

# Variables & Lists

## getVariable(variable)

Returns the value of a variable.

Input: `variable`.

Output: Scratch reporter block definition that can be used as an input value in other blocks.

* `variable: VariableReference`

Example:
```ts
import { getVariable } from 'hikkaku/blocks'

getVariable(variable)
```

## setVariableTo(variable, value)

Sets a variable.

Input: `variable`, `value`.

Output: Scratch statement block definition that is appended to the current script stack.

* `variable: VariableReference`
* `value: PrimitiveSource<number | string>`

Example:
```ts
import { setVariableTo } from 'hikkaku/blocks'

setVariableTo(variable, 10)
```

## changeVariableBy(variable, value)

Changes a variable by an amount.

Input: `variable`, `value`.

Output: Scratch statement block definition that is appended to the current script stack.

* `variable: VariableReference`
* `value: PrimitiveSource<number>`

Example:
```ts
import { changeVariableBy } from 'hikkaku/blocks'

changeVariableBy(variable, 10)
```

## showVariable(variable)

Shows variable monitor.

Input: `variable`.

Output: Scratch statement block definition that is appended to the current script stack.

* `variable: See function signature for accepted input values`

Example:
```ts
import { showVariable } from 'hikkaku/blocks'

showVariable(variable)
```

## hideVariable(variable)

Hides variable monitor.

Input: `variable`.

Output: Scratch statement block definition that is appended to the current script stack.

* `variable: See function signature for accepted input values`

Example:
```ts
import { hideVariable } from 'hikkaku/blocks'

hideVariable(variable)
```

## getListContents(list)

Returns list contents as text.

Input: `list`.

Output: Scratch reporter block definition that can be used as an input value in other blocks.

* `list: ListReference`

Example:
```ts
import { getListContents } from 'hikkaku/blocks'

getListContents(list)
```

## addToList(list, item)

Appends an item.

Input: `list`, `item`.

Output: Scratch statement block definition that is appended to the current script stack.

* `list: ListReference`
* `item: PrimitiveSource<string | number>`

Example:
```ts
import { addToList } from 'hikkaku/blocks'

addToList(list, "banana")
```

## deleteOfList(list, index)

Deletes an item.

Input: `list`, `index`.

Output: Scratch statement block definition that is appended to the current script stack.

* `list: Input value used by this block`
* `index: ListIndex` - PrimitiveSource<number | string>

Example:
```ts
import { deleteOfList } from 'hikkaku/blocks'

deleteOfList(list, 1)
```

## deleteAllOfList(list)

Clears list.

Input: `list`.

Output: Scratch statement block definition that is appended to the current script stack.

* `list: See function signature for accepted input values`

Example:
```ts
import { deleteAllOfList } from 'hikkaku/blocks'

deleteAllOfList(list)
```

## insertAtList(list, index, item)

Inserts item at index.

Input: `list`, `index`, `item`.

Output: Scratch statement block definition that is appended to the current script stack.

* `list: See function signature for accepted input values`
* `index: See function signature for accepted input values`
* `item: See function signature for accepted input values`

Example:
```ts
import { insertAtList } from 'hikkaku/blocks'

insertAtList(list, 42, "banana")
```

## replaceItemOfList(list, index, item)

Replaces item at index.

Input: `list`, `index`, `item`.

Output: Scratch statement block definition that is appended to the current script stack.

* `list: See function signature for accepted input values`
* `index: See function signature for accepted input values`
* `item: See function signature for accepted input values`

Example:
```ts
import { replaceItemOfList } from 'hikkaku/blocks'

replaceItemOfList(list, 42, "banana")
```

## getItemOfList(list, index)

Returns list item.

Input: `list`, `index`.

Output: Scratch reporter block definition that can be used as an input value in other blocks.

* `list: See function signature for accepted input values`
* `index: See function signature for accepted input values`

Example:
```ts
import { getItemOfList } from 'hikkaku/blocks'

getItemOfList(list, 1)
```

## getItemNumOfList(list, item)

Returns index of item.

Input: `list`, `item`.

Output: Scratch reporter block definition that can be used as an input value in other blocks.

* `list: See function signature for accepted input values`
* `item: See function signature for accepted input values`

Example:
```ts
import { getItemNumOfList } from 'hikkaku/blocks'

getItemNumOfList(list, "banana")
```

## lengthOfList(list)

Returns list length.

Input: `list`.

Output: Scratch reporter block definition that can be used as an input value in other blocks.

* `list: See function signature for accepted input values`

Example:
```ts
import { lengthOfList } from 'hikkaku/blocks'

lengthOfList(list)
```

## listContainsItem(list, item)

Checks membership.

Input: `list`, `item`.

Output: Scratch reporter block definition that can be used as an input value in other blocks.

* `list: See function signature for accepted input values`
* `item: See function signature for accepted input values`

Example:
```ts
import { listContainsItem } from 'hikkaku/blocks'

listContainsItem(list,"banana")
```

## showList(list)

Shows list monitor.

Input: `list`.

Output: Scratch statement block definition that is appended to the current script stack.

* `list: See function signature for accepted input values`

Example:
```ts
import { showList } from 'hikkaku/blocks'

showList(list)
```

## hideList(list)

Hides list monitor.

Input: `list`.

Output: Scratch statement block definition that is appended to the current script stack.

* `list: See function signature for accepted input values`

Example:
```ts
import { hideList } from 'hikkaku/blocks'

hideList(list)
```
