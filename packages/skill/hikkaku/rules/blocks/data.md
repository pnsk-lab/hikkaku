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

getVariable(variable as any)
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

setVariableTo(variable as any, 10)
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

changeVariableBy(variable as any, 10)
```

## showVariable(variable)

Shows variable monitor.

Input: `variable`.

Output: Scratch statement block definition that is appended to the current script stack.

* `variable: See function signature for accepted input values`

Example:
```ts
import { showVariable } from 'hikkaku/blocks'

showVariable(variable as any)
```

## hideVariable(variable)

Hides variable monitor.

Input: `variable`.

Output: Scratch statement block definition that is appended to the current script stack.

* `variable: See function signature for accepted input values`

Example:
```ts
import { hideVariable } from 'hikkaku/blocks'

hideVariable(variable as any)
```

## getListContents(list)

Returns list contents as text.

Input: `list`.

Output: Scratch reporter block definition that can be used as an input value in other blocks.

* `list: ListReference`

Example:
```ts
import { getListContents } from 'hikkaku/blocks'

getListContents(list as any)
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

addToList(list as any, undefined as any)
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

deleteOfList(list as any, undefined as any)
```

## deleteAllOfList(list)

Clears list.

Input: `list`.

Output: Scratch statement block definition that is appended to the current script stack.

* `list: See function signature for accepted input values`

Example:
```ts
import { deleteAllOfList } from 'hikkaku/blocks'

deleteAllOfList(list as any)
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

insertAtList(list as any, undefined as any, undefined as any)
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

replaceItemOfList(list as any, undefined as any, undefined as any)
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

getItemOfList(list as any, undefined as any)
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

getItemNumOfList(list as any, undefined as any)
```

## lengthOfList(list)

Returns list length.

Input: `list`.

Output: Scratch reporter block definition that can be used as an input value in other blocks.

* `list: See function signature for accepted input values`

Example:
```ts
import { lengthOfList } from 'hikkaku/blocks'

lengthOfList(list as any)
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

listContainsItem(list as any, undefined as any)
```

## showList(list)

Shows list monitor.

Input: `list`.

Output: Scratch statement block definition that is appended to the current script stack.

* `list: See function signature for accepted input values`

Example:
```ts
import { showList } from 'hikkaku/blocks'

showList(list as any)
```

## hideList(list)

Hides list monitor.

Input: `list`.

Output: Scratch statement block definition that is appended to the current script stack.

* `list: See function signature for accepted input values`

Example:
```ts
import { hideList } from 'hikkaku/blocks'

hideList(list as any)
```
