import { InputType } from 'sb3-types/enum'
import { fromBooleanSource, fromPrimitiveSource } from '../core/block-helper'
import { valueBlock } from '../core/composer'
import type {
  HikkakuBool,
  HikkakuNumber,
  HikkakuString,
  PrimitiveSource,
} from '../core/types'

/**
 * Addition.
 *
 * Input: `a`, `b`.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @param a See function signature for accepted input values.
 * @param b See function signature for accepted input values.
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { add } from 'hikkaku/blocks'
 *
 * add(1, 2)
 * ```
 */
export const add = (
  a: PrimitiveSource<HikkakuNumber>,
  b: PrimitiveSource<HikkakuNumber>,
) => {
  return valueBlock<HikkakuNumber>('operator_add', {
    inputs: {
      NUM1: fromPrimitiveSource(InputType.Number, a, 0),
      NUM2: fromPrimitiveSource(InputType.Number, b, 0),
    },
  })
}

/**
 * Subtraction.
 *
 * Input: `a`, `b`.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @param a See function signature for accepted input values.
 * @param b See function signature for accepted input values.
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { subtract } from 'hikkaku/blocks'
 *
 * subtract(5, 3)
 * ```
 */
export const subtract = (
  a: PrimitiveSource<HikkakuNumber>,
  b: PrimitiveSource<HikkakuNumber>,
) => {
  return valueBlock<HikkakuNumber>('operator_subtract', {
    inputs: {
      NUM1: fromPrimitiveSource(InputType.Number, a, 0),
      NUM2: fromPrimitiveSource(InputType.Number, b, 0),
    },
  })
}

/**
 * Multiplication.
 *
 * Input: `a`, `b`.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @param a See function signature for accepted input values.
 * @param b See function signature for accepted input values.
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { multiply } from 'hikkaku/blocks'
 *
 * multiply(3, 4)
 * ```
 */
export const multiply = (
  a: PrimitiveSource<HikkakuNumber>,
  b: PrimitiveSource<HikkakuNumber>,
) => {
  return valueBlock<HikkakuNumber>('operator_multiply', {
    inputs: {
      NUM1: fromPrimitiveSource(InputType.Number, a, 0),
      NUM2: fromPrimitiveSource(InputType.Number, b, 0),
    },
  })
}

/**
 * Division.
 *
 * Input: `a`, `b`.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @param a See function signature for accepted input values.
 * @param b See function signature for accepted input values.
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { divide } from 'hikkaku/blocks'
 *
 * divide(10, 2)
 * ```
 */
export const divide = (
  a: PrimitiveSource<HikkakuNumber>,
  b: PrimitiveSource<HikkakuNumber>,
) => {
  return valueBlock<HikkakuNumber>('operator_divide', {
    inputs: {
      NUM1: fromPrimitiveSource(InputType.Number, a, 0),
      NUM2: fromPrimitiveSource(InputType.Number, b, 0),
    },
  })
}

/**
 * Less-than comparison.
 *
 * Input: `a`, `b`.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @param a See function signature for accepted input values.
 * @param b See function signature for accepted input values.
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { lt } from 'hikkaku/blocks'
 *
 * lt(1, 2)
 * ```
 */
export const lt = (
  a: PrimitiveSource<HikkakuNumber | HikkakuString>,
  b: PrimitiveSource<HikkakuNumber | HikkakuString>,
) => {
  return valueBlock<HikkakuBool>('operator_lt', {
    inputs: {
      OPERAND1: fromPrimitiveSource(InputType.String, a, ''),
      OPERAND2: fromPrimitiveSource(InputType.String, b, ''),
    },
  })
}

/**
 * Equality comparison.
 *
 * Input: `a`, `b`.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @param a See function signature for accepted input values.
 * @param b See function signature for accepted input values.
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { equals } from 'hikkaku/blocks'
 *
 * equals(5, 5)
 * ```
 */
export const equals = (
  a: PrimitiveSource<HikkakuNumber | HikkakuString>,
  b: PrimitiveSource<HikkakuNumber | HikkakuString>,
) => {
  return valueBlock<HikkakuBool>('operator_equals', {
    inputs: {
      OPERAND1: fromPrimitiveSource(InputType.String, a, ''),
      OPERAND2: fromPrimitiveSource(InputType.String, b, ''),
    },
  })
}

/**
 * Greater-than comparison.
 *
 * Input: `a`, `b`.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @param a See function signature for accepted input values.
 * @param b See function signature for accepted input values.
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { gt } from 'hikkaku/blocks'
 *
 * gt(10, 5)
 * ```
 */
export const gt = (
  a: PrimitiveSource<HikkakuNumber | HikkakuString>,
  b: PrimitiveSource<HikkakuNumber | HikkakuString>,
) => {
  return valueBlock<HikkakuBool>('operator_gt', {
    inputs: {
      OPERAND1: fromPrimitiveSource(InputType.String, a, ''),
      OPERAND2: fromPrimitiveSource(InputType.String, b, ''),
    },
  })
}

/**
 * Logical AND.
 *
 * Input: `a`, `b`.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @param a See function signature for accepted input values.
 * @param b See function signature for accepted input values.
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { and } from 'hikkaku/blocks'
 *
 * and(true, false)
 * ```
 */
export const and = (
  a: PrimitiveSource<HikkakuBool>,
  b: PrimitiveSource<HikkakuBool>,
) => {
  return valueBlock<HikkakuBool>('operator_and', {
    inputs: {
      OPERAND1: fromBooleanSource(a),
      OPERAND2: fromBooleanSource(b),
    },
  })
}

/**
 * Logical OR.
 *
 * Input: `a`, `b`.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @param a See function signature for accepted input values.
 * @param b See function signature for accepted input values.
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { or } from 'hikkaku/blocks'
 *
 * or(true, false)
 * ```
 */
export const or = (
  a: PrimitiveSource<HikkakuBool>,
  b: PrimitiveSource<HikkakuBool>,
) => {
  return valueBlock<HikkakuBool>('operator_or', {
    inputs: {
      OPERAND1: fromBooleanSource(a),
      OPERAND2: fromBooleanSource(b),
    },
  })
}

/**
 * Logical NOT.
 *
 * Input: `operand`.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @param operand See function signature for accepted input values.
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { not } from 'hikkaku/blocks'
 *
 * not(false)
 * ```
 */
export const not = (operand: PrimitiveSource<HikkakuBool>) => {
  return valueBlock<HikkakuBool>('operator_not', {
    inputs: {
      OPERAND: fromBooleanSource(operand),
    },
  })
}

/**
 * Random number.
 *
 * Input: `from`, `to`.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @param from See function signature for accepted input values.
 * @param to See function signature for accepted input values.
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { random } from 'hikkaku/blocks'
 *
 * random(10, 10)
 * ```
 */
export const random = (
  from: PrimitiveSource<HikkakuNumber>,
  to: PrimitiveSource<HikkakuNumber>,
) => {
  return valueBlock<HikkakuNumber>('operator_random', {
    inputs: {
      FROM: fromPrimitiveSource(InputType.Number, from, 1),
      TO: fromPrimitiveSource(InputType.Number, to, 10),
    },
  })
}

/**
 * String concatenation.
 *
 * Input: `a`, `b`.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @param a See function signature for accepted input values.
 * @param b See function signature for accepted input values.
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { join } from 'hikkaku/blocks'
 *
 * join('Hello', 'World')
 * ```
 */
export const join = (
  a: PrimitiveSource<HikkakuString>,
  b: PrimitiveSource<HikkakuString>,
) => {
  return valueBlock<HikkakuString>('operator_join', {
    inputs: {
      STRING1: fromPrimitiveSource(InputType.String, a, 'apple'),
      STRING2: fromPrimitiveSource(InputType.String, b, 'banana'),
    },
  })
}

/**
 * Character extraction.
 *
 * Input: `letter`, `text`.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @param letter See function signature for accepted input values.
 * @param text See function signature for accepted input values.
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { letterOf } from 'hikkaku/blocks'
 *
 * letterOf(10, 'Hello')
 * ```
 */
export const letterOf = (
  letter: PrimitiveSource<HikkakuNumber>,
  text: PrimitiveSource<HikkakuString>,
) => {
  return valueBlock<HikkakuString>('operator_letter_of', {
    inputs: {
      LETTER: fromPrimitiveSource(InputType.PositiveInteger, letter, 1),
      STRING: fromPrimitiveSource(InputType.String, text, 'apple'),
    },
  })
}

/**
 * String length.
 *
 * Input: `text`.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @param text See function signature for accepted input values.
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { length } from 'hikkaku/blocks'
 *
 * length('Hello')
 * ```
 */
export const length = (text: PrimitiveSource<HikkakuString>) => {
  return valueBlock<HikkakuNumber>('operator_length', {
    inputs: {
      STRING: fromPrimitiveSource(InputType.String, text, 'apple'),
    },
  })
}

/**
 * Substring check.
 *
 * Input: `text`, `substring`.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @param text See function signature for accepted input values.
 * @param substring See function signature for accepted input values.
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { contains } from 'hikkaku/blocks'
 *
 * contains('Hello', 'Hello')
 * ```
 */
export const contains = (
  text: PrimitiveSource<HikkakuString>,
  substring: PrimitiveSource<HikkakuString>,
) => {
  return valueBlock<HikkakuBool>('operator_contains', {
    inputs: {
      STRING1: fromPrimitiveSource(InputType.String, text, 'apple'),
      STRING2: fromPrimitiveSource(InputType.String, substring, 'a'),
    },
  })
}

/**
 * Modulo.
 *
 * Input: `a`, `b`.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @param a See function signature for accepted input values.
 * @param b See function signature for accepted input values.
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { mod } from 'hikkaku/blocks'
 *
 * mod(10, 3)
 * ```
 */
export const mod = (
  a: PrimitiveSource<HikkakuNumber>,
  b: PrimitiveSource<HikkakuNumber>,
) => {
  return valueBlock<HikkakuNumber>('operator_mod', {
    inputs: {
      NUM1: fromPrimitiveSource(InputType.Number, a, 0),
      NUM2: fromPrimitiveSource(InputType.Number, b, 0),
    },
  })
}

/**
 * Rounds number.
 *
 * Input: `value`.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @param value See function signature for accepted input values.
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { round } from 'hikkaku/blocks'
 *
 * round(10)
 * ```
 */
export const round = (value: PrimitiveSource<HikkakuNumber>) => {
  return valueBlock<HikkakuNumber>('operator_round', {
    inputs: {
      NUM: fromPrimitiveSource(InputType.Number, value, 0),
    },
  })
}

export type MathOpOperator =
  | 'abs'
  | 'floor'
  | 'ceiling'
  | 'sqrt'
  | 'sin'
  | 'cos'
  | 'tan'
  | 'asin'
  | 'acos'
  | 'atan'
  | 'ln'
  | 'log'
  | 'e ^'
  | '10 ^'

/**
 * Math operation (sin, cos, log, etc.).
 *
 * Input: `operator`, `value`.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @param operator See function signature for accepted input values.
 * @param value See function signature for accepted input values.
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { mathop } from 'hikkaku/blocks'
 *
 * mathop('abs', 10)
 * ```
 */
export const mathop = (
  operator: MathOpOperator,
  value: PrimitiveSource<HikkakuNumber>,
) => {
  return valueBlock<HikkakuNumber>('operator_mathop', {
    inputs: {
      NUM: fromPrimitiveSource(InputType.Number, value, 0),
    },
    fields: {
      OPERATOR: [operator, null],
    },
  })
}
