import { Project } from 'hikkaku'
import {
  // events/control
  whenFlagClicked,
  ifThen,
  ifElse,
  repeatUntil,
  repeatWhile,
  forEach,
  stop,

  // data
  setVariableTo,
  getVariable,
  changeVariableBy,

  // lists
  addToList,
  deleteOfList,
  deleteAllOfList,
  replaceItemOfList,
  getItemOfList,
  lengthOfList,

  // procedures
  defineProcedure,
  callProcedure,
  procedureLabel,
  procedureStringOrNumber,
  argumentReporterStringNumber,
} from 'hikkaku/blocks'

import {
  // operators
  add,
  subtract,
  multiply,
  lt,
  gt,
  equals,
  and,
  or,
  not,
  join,
  letterOf,
  length,
  contains,
} from 'hikkaku/blocks'

const project = new Project()
const sprite = project.createSprite('JSON')

// =========================
// 変数
// =========================
const vSrc = sprite.createVariable('json_src', '')
const vI = sprite.createVariable('json_i', 1)
const vLen = sprite.createVariable('json_len', 0)

const vRoot = sprite.createVariable('json_root', 0)
const vErr = sprite.createVariable('json_error', 0)
const vErrMsg = sprite.createVariable('json_error_msg', '')

// “戻り値”用
const vRetNode = sprite.createVariable('json_ret_node', 0)
const vRetStr = sprite.createVariable('json_ret_str', '')

// 一時
const vTmpStr = sprite.createVariable('tmp_str', '')
const vTmpNum = sprite.createVariable('tmp_num', 0)
const vTmpNum2 = sprite.createVariable('tmp_num2', 0)
const vNode = sprite.createVariable('tmp_node', 0)
const vFirst = sprite.createVariable('tmp_first', 0)
const vCount = sprite.createVariable('tmp_count', 0)
const vEdgeIdx = sprite.createVariable('tmp_edge_i', 0)
const vFound = sprite.createVariable('tmp_found', 0)
const vDone = sprite.createVariable('tmp_done', 0)

// jq/get用
const vFilter = sprite.createVariable('jq_filter', '')
const vP = sprite.createVariable('jq_p', 1)
const vFLen = sprite.createVariable('jq_len', 0)
const vToken = sprite.createVariable('jq_token', '')
const vSign = sprite.createVariable('jq_sign', 1)
const vIdx = sprite.createVariable('jq_index', 0)

// ループ変数（ネストするので複数）
const vLoopA = sprite.createVariable('loopA', 0)
const vLoopB = sprite.createVariable('loopB', 0)
const vLoopC = sprite.createVariable('loopC', 0)
const vLoopD = sprite.createVariable('loopD', 0)

// =========================
// リスト：パース木
// =========================
// Node: id = インデックス(1-based)
const lNType = sprite.createList('N_type', [])   // 1=obj 2=array 3=string 4=number 5=bool 6=null
const lNStart = sprite.createList('N_start', []) // json_src内の開始位置（1-based）
const lNEnd = sprite.createList('N_end', [])     // json_src内の終了位置（1-based, inclusive）
const lNFirst = sprite.createList('N_first', []) // 子Edgeの開始index（E_*）
const lNCount = sprite.createList('N_count', []) // 子の数

// Edge: 子参照
const lEKey = sprite.createList('E_key', [])     // objectのキー（unescaped）。arrayは '' を入れる
const lEChild = sprite.createList('E_child', []) // 子node id

// =========================
// リスト：getのワークリスト & 出力
// =========================
const lCur = sprite.createList('jq_cur', [])
const lNext = sprite.createList('jq_next', [])
const lOut = sprite.createList('jq_out', []) // ←「特定の配列」これに出力
const lParseNodeStack = sprite.createList('json_node_stack', [])

// =========================
// 定数
// =========================
const DIGITS = '0123456789'
const DIGITS19 = '123456789'
const IDCHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_'

// =========================
// 内部手続き名（no-argでcallProcedureする）
// =========================
const P_FAIL = '__json_fail'
const P_SKIPWS = '__json_skipWS'
const P_PARSE_VALUE = '__json_parseValue'
const P_PARSE_OBJECT = '__json_parseObject'
const P_PARSE_ARRAY = '__json_parseArray'
const P_PARSE_STRING = '__json_parseString'
const P_PARSE_NUMBER = '__json_parseNumber'
const P_SLICE = '__json_slice'
const P_RESET = '__json_reset'

const P_JQ_SKIP = '__jq_skipWSPipe'
const P_JQ_APPLY_KEY = '__jq_applyKey'
const P_JQ_APPLY_INDEX = '__jq_applyIndex'
const P_JQ_APPLY_ITER = '__jq_applyIter'

sprite.run(() => {
  // =========================================================
  // __json_fail: json_error_msg をセットしてから呼ぶ
  // =========================================================
  defineProcedure([procedureLabel(P_FAIL)], () => {
    setVariableTo(vErr, 1)
    stop('this script')
  }, true)

  // =========================================================
  // __json_skipWS: vSrc/vI/vLen を使って空白スキップ
  // =========================================================
  defineProcedure([procedureLabel(P_SKIPWS)], () => {
    repeatUntil(
      or(
        gt(getVariable(vI), getVariable(vLen)),
        not(
          or(
            equals(letterOf(getVariable(vI), getVariable(vSrc)), ' '),
            or(
              equals(letterOf(getVariable(vI), getVariable(vSrc)), '\n'),
              or(
                equals(letterOf(getVariable(vI), getVariable(vSrc)), '\r'),
                equals(letterOf(getVariable(vI), getVariable(vSrc)), '\t'),
              ),
            ),
          ),
        ),
      ),
      () => {
        changeVariableBy(vI, 1)
      },
    )
  }, true)

  // =========================================================
  // __json_parseString:
  // - vI が " を指している前提
  // - vRetStr に unescaped の文字列を入れる（\uXXXXは復号せず \uXXXX のまま）
  // - vI は終端 " の次へ
  // =========================================================

  // ↑の parseString 内で「uの4桁読み」や「それ以外のエスケープ」が未実装なので、
  // ここで上書きする形で、完成版の parseString を定義し直します（Scratch的には最後が勝ちます）。
  defineProcedure([procedureLabel(P_PARSE_STRING)], () => {
    ifThen(
      not(equals(letterOf(getVariable(vI), getVariable(vSrc)), '"')),
      () => {
        setVariableTo(vErrMsg, 'string must start with "')
        callProcedure(P_FAIL, [], {}, true)
      },
    )

    changeVariableBy(vI, 1)
    setVariableTo(vRetStr, '')

    repeatUntil(
      or(
        gt(getVariable(vI), getVariable(vLen)),
        equals(letterOf(getVariable(vI), getVariable(vSrc)), '"'),
      ),
      () => {
        ifElse(
          equals(letterOf(getVariable(vI), getVariable(vSrc)), '\\'),
          () => {
            changeVariableBy(vI, 1)
            ifThen(gt(getVariable(vI), getVariable(vLen)), () => {
              setVariableTo(vErrMsg, 'unterminated escape')
              callProcedure(P_FAIL, [], {}, true)
            })

            // escChar = letterOf(i)
            // \" \\ \/ \b \f \n \r \t \uXXXX
            ifElse(
              equals(letterOf(getVariable(vI), getVariable(vSrc)), '"'),
              () => {
                setVariableTo(vRetStr, join(getVariable(vRetStr), '"'))
                changeVariableBy(vI, 1)
              },
              () => {
                ifElse(
                  equals(letterOf(getVariable(vI), getVariable(vSrc)), '\\'),
                  () => {
                    setVariableTo(vRetStr, join(getVariable(vRetStr), '\\'))
                    changeVariableBy(vI, 1)
                  },
                  () => {
                    ifElse(
                      equals(letterOf(getVariable(vI), getVariable(vSrc)), '/'),
                      () => {
                        setVariableTo(vRetStr, join(getVariable(vRetStr), '/'))
                        changeVariableBy(vI, 1)
                      },
                      () => {
                        ifElse(
                          equals(letterOf(getVariable(vI), getVariable(vSrc)), 'b'),
                          () => {
                            setVariableTo(vRetStr, join(getVariable(vRetStr), '\b'))
                            changeVariableBy(vI, 1)
                          },
                          () => {
                            ifElse(
                              equals(letterOf(getVariable(vI), getVariable(vSrc)), 'f'),
                              () => {
                                //setVariableTo(vRetStr, join(getVariable(vRetStr), '\f'))
                                changeVariableBy(vI, 1)
                              },
                              () => {
                                ifElse(
                                  equals(letterOf(getVariable(vI), getVariable(vSrc)), 'n'),
                                  () => {
                                    setVariableTo(vRetStr, join(getVariable(vRetStr), '\n'))
                                    changeVariableBy(vI, 1)
                                  },
                                  () => {
                                    ifElse(
                                      equals(letterOf(getVariable(vI), getVariable(vSrc)), 'r'),
                                      () => {
                                        setVariableTo(vRetStr, join(getVariable(vRetStr), '\r'))
                                        changeVariableBy(vI, 1)
                                      },
                                      () => {
                                        ifElse(
                                          equals(letterOf(getVariable(vI), getVariable(vSrc)), 't'),
                                          () => {
                                            setVariableTo(vRetStr, join(getVariable(vRetStr), '\t'))
                                            changeVariableBy(vI, 1)
                                          },
                                          () => {
                                            // \uXXXX（復号せず、文字列として保持）
                                            ifElse(
                                              equals(letterOf(getVariable(vI), getVariable(vSrc)), 'u'),
                                              () => {
                                                setVariableTo(vRetStr, join(getVariable(vRetStr), '\\u'))
                                                changeVariableBy(vI, 1)

                                                // 4桁読む
                                                setVariableTo(vTmpNum, 1)
                                                repeatUntil(gt(getVariable(vTmpNum), 4), () => {
                                                  ifThen(gt(getVariable(vI), getVariable(vLen)), () => {
                                                    setVariableTo(vErrMsg, 'unterminated \\uXXXX')
                                                    callProcedure(P_FAIL, [], {}, true)
                                                  })
                                                  setVariableTo(
                                                    vRetStr,
                                                    join(getVariable(vRetStr), letterOf(getVariable(vI), getVariable(vSrc))),
                                                  )
                                                  changeVariableBy(vI, 1)
                                                  changeVariableBy(vTmpNum, 1)
                                                })
                                              },
                                              () => {
                                                setVariableTo(vErrMsg, 'invalid escape')
                                                callProcedure(P_FAIL, [], {}, true)
                                              },
                                            )
                                          },
                                        )
                                      },
                                    )
                                  },
                                )
                              },
                            )
                          },
                        )
                      },
                    )
                  },
                )
              },
            )
          },
          () => {
            setVariableTo(
              vRetStr,
              join(getVariable(vRetStr), letterOf(getVariable(vI), getVariable(vSrc))),
            )
            changeVariableBy(vI, 1)
          },
        )
      },
    )

    // 終端 " が無い
    ifThen(gt(getVariable(vI), getVariable(vLen)), () => {
      setVariableTo(vErrMsg, 'unterminated string')
      callProcedure(P_FAIL, [], {}, true)
    })

    // 終端 " を消費
    changeVariableBy(vI, 1)
  }, true)

  // =========================================================
  // __json_parseNumber:
  // - vI が number の先頭（- または digit）
  // - vI を number の末尾の次へ進める（戻り値は持たない）
  // =========================================================
  defineProcedure([procedureLabel(P_PARSE_NUMBER)], () => {
    // optional '-'
    ifThen(equals(letterOf(getVariable(vI), getVariable(vSrc)), '-'), () => {
      changeVariableBy(vI, 1)
    })

    ifThen(gt(getVariable(vI), getVariable(vLen)), () => {
      setVariableTo(vErrMsg, 'unexpected end in number')
      callProcedure(P_FAIL, [], {}, true)
    })

    // int part
    ifElse(
      equals(letterOf(getVariable(vI), getVariable(vSrc)), '0'),
      () => {
        changeVariableBy(vI, 1)
      },
      () => {
        ifThen(
          or(
            gt(getVariable(vI), getVariable(vLen)),
            not(contains(DIGITS19, letterOf(getVariable(vI), getVariable(vSrc)))),
          ),
          () => {
            setVariableTo(vErrMsg, 'invalid number')
            callProcedure(P_FAIL, [], {}, true)
          },
        )
        changeVariableBy(vI, 1)

        repeatWhile(
          and(
            not(gt(getVariable(vI), getVariable(vLen))),
            contains(DIGITS, letterOf(getVariable(vI), getVariable(vSrc))),
          ),
          () => {
            changeVariableBy(vI, 1)
          },
        )
      },
    )

    // frac part
    ifThen(equals(letterOf(getVariable(vI), getVariable(vSrc)), '.'), () => {
      changeVariableBy(vI, 1)
      ifThen(
        or(
          gt(getVariable(vI), getVariable(vLen)),
          not(contains(DIGITS, letterOf(getVariable(vI), getVariable(vSrc)))),
        ),
        () => {
          setVariableTo(vErrMsg, 'invalid fraction')
          callProcedure(P_FAIL, [], {}, true)
        },
      )
      repeatWhile(
        and(
          not(gt(getVariable(vI), getVariable(vLen))),
          contains(DIGITS, letterOf(getVariable(vI), getVariable(vSrc))),
        ),
        () => {
          changeVariableBy(vI, 1)
        },
      )
    })

    // exp part
    ifThen(
      or(
        equals(letterOf(getVariable(vI), getVariable(vSrc)), 'e'),
        equals(letterOf(getVariable(vI), getVariable(vSrc)), 'E'),
      ),
      () => {
        changeVariableBy(vI, 1)

        ifThen(
          or(
            equals(letterOf(getVariable(vI), getVariable(vSrc)), '+'),
            equals(letterOf(getVariable(vI), getVariable(vSrc)), '-'),
          ),
          () => {
            changeVariableBy(vI, 1)
          },
        )

        ifThen(
          or(
            gt(getVariable(vI), getVariable(vLen)),
            not(contains(DIGITS, letterOf(getVariable(vI), getVariable(vSrc)))),
          ),
          () => {
            setVariableTo(vErrMsg, 'invalid exponent')
            callProcedure(P_FAIL, [], {}, true)
          },
        )

        repeatWhile(
          and(
            not(gt(getVariable(vI), getVariable(vLen))),
            contains(DIGITS, letterOf(getVariable(vI), getVariable(vSrc))),
          ),
          () => {
            changeVariableBy(vI, 1)
          },
        )
      },
    )
  }, true)

  // =========================================================
  // __json_parseObject:
  // - vI が '{'
  // - vRetNode に object node id
  // =========================================================
  defineProcedure([procedureLabel(P_PARSE_OBJECT)], () => {
    // start
    setVariableTo(vTmpNum, getVariable(vI))

    // create node
    addToList(lNType, 1)
    addToList(lNStart, getVariable(vTmpNum))
    addToList(lNEnd, 0)
    addToList(lNFirst, add(lengthOfList(lEChild), 1))
    addToList(lNCount, 0)

    // 再帰で壊れないよう、現在ノードIDをスタック管理する
    setVariableTo(vNode, lengthOfList(lNType))
    addToList(lParseNodeStack, getVariable(vNode))

    // consume '{'
    changeVariableBy(vI, 1)
    callProcedure(P_SKIPWS, [], {}, true)

    // empty?
    ifElse(
      equals(letterOf(getVariable(vI), getVariable(vSrc)), '}'),
      () => {
        changeVariableBy(vI, 1) // consume '}'

        // end
        setVariableTo(vNode, getItemOfList(lParseNodeStack, lengthOfList(lParseNodeStack)))
        replaceItemOfList(lNEnd, getVariable(vNode), subtract(getVariable(vI), 1))
        // count=0 already
      },
      () => {
        // first member
        ifThen(
          not(equals(letterOf(getVariable(vI), getVariable(vSrc)), '"')),
          () => {
            setVariableTo(vErrMsg, 'object key must be string')
            callProcedure(P_FAIL, [], {}, true)
          },
        )
        callProcedure(P_PARSE_STRING, [], {}, true)
        setVariableTo(vTmpStr, getVariable(vRetStr))

        callProcedure(P_SKIPWS, [], {}, true)
        ifThen(
          not(equals(letterOf(getVariable(vI), getVariable(vSrc)), ':')),
          () => {
            setVariableTo(vErrMsg, 'missing :')
            callProcedure(P_FAIL, [], {}, true)
          },
        )
        changeVariableBy(vI, 1)
        callProcedure(P_SKIPWS, [], {}, true)

        // keyは先に積んで、value parse後にchildだけ差し替える
        addToList(lEKey, getVariable(vTmpStr))
        addToList(lEChild, 0)
        setVariableTo(vTmpNum2, lengthOfList(lEChild))
        callProcedure(P_PARSE_VALUE, [], {}, true)
        replaceItemOfList(lEChild, getVariable(vTmpNum2), getVariable(vRetNode))
        callProcedure(P_SKIPWS, [], {}, true)

        // additional members
        repeatWhile(
          equals(letterOf(getVariable(vI), getVariable(vSrc)), ','),
          () => {
            changeVariableBy(vI, 1)
            callProcedure(P_SKIPWS, [], {}, true)

            ifThen(
              not(equals(letterOf(getVariable(vI), getVariable(vSrc)), '"')),
              () => {
                setVariableTo(vErrMsg, 'object key must be string')
                callProcedure(P_FAIL, [], {}, true)
              },
            )
            callProcedure(P_PARSE_STRING, [], {}, true)
            setVariableTo(vTmpStr, getVariable(vRetStr))

            callProcedure(P_SKIPWS, [], {}, true)
            ifThen(
              not(equals(letterOf(getVariable(vI), getVariable(vSrc)), ':')),
              () => {
                setVariableTo(vErrMsg, 'missing :')
                callProcedure(P_FAIL, [], {}, true)
              },
            )
            changeVariableBy(vI, 1)
            callProcedure(P_SKIPWS, [], {}, true)

            addToList(lEKey, getVariable(vTmpStr))
            addToList(lEChild, 0)
            setVariableTo(vTmpNum2, lengthOfList(lEChild))
            callProcedure(P_PARSE_VALUE, [], {}, true)
            replaceItemOfList(lEChild, getVariable(vTmpNum2), getVariable(vRetNode))
            callProcedure(P_SKIPWS, [], {}, true)
          },
        )

        // '}'
        ifThen(
          not(equals(letterOf(getVariable(vI), getVariable(vSrc)), '}')),
          () => {
            setVariableTo(vErrMsg, 'missing }')
            callProcedure(P_FAIL, [], {}, true)
          },
        )
        changeVariableBy(vI, 1)

        // count
        setVariableTo(vNode, getItemOfList(lParseNodeStack, lengthOfList(lParseNodeStack)))
        setVariableTo(vFirst, getItemOfList(lNFirst, getVariable(vNode)))
        setVariableTo(
          vCount,
          add(subtract(lengthOfList(lEChild), getVariable(vFirst)), 1),
        )
        replaceItemOfList(lNCount, getVariable(vNode), getVariable(vCount))

        // end
        replaceItemOfList(lNEnd, getVariable(vNode), subtract(getVariable(vI), 1))
      },
    )

    setVariableTo(vRetNode, getItemOfList(lParseNodeStack, lengthOfList(lParseNodeStack)))
    deleteOfList(lParseNodeStack, 'last')
  }, true)

  // =========================================================
  // __json_parseArray:
  // - vI が '['
  // - vRetNode に array node id
  // =========================================================
  defineProcedure([procedureLabel(P_PARSE_ARRAY)], () => {
    setVariableTo(vTmpNum, getVariable(vI))

    addToList(lNType, 2)
    addToList(lNStart, getVariable(vTmpNum))
    addToList(lNEnd, 0)
    addToList(lNFirst, add(lengthOfList(lEChild), 1))
    addToList(lNCount, 0)

    setVariableTo(vNode, lengthOfList(lNType))
    addToList(lParseNodeStack, getVariable(vNode))

    // consume '['
    changeVariableBy(vI, 1)
    callProcedure(P_SKIPWS, [], {}, true)

    // empty?
    ifElse(
      equals(letterOf(getVariable(vI), getVariable(vSrc)), ']'),
      () => {
        changeVariableBy(vI, 1)
        setVariableTo(vNode, getItemOfList(lParseNodeStack, lengthOfList(lParseNodeStack)))
        replaceItemOfList(lNEnd, getVariable(vNode), subtract(getVariable(vI), 1))
      },
      () => {
        // first element
        callProcedure(P_PARSE_VALUE, [], {}, true)
        addToList(lEKey, '')
        addToList(lEChild, getVariable(vRetNode))
        callProcedure(P_SKIPWS, [], {}, true)

        // additional elements
        repeatWhile(
          equals(letterOf(getVariable(vI), getVariable(vSrc)), ','),
          () => {
            changeVariableBy(vI, 1)
            callProcedure(P_SKIPWS, [], {}, true)
            callProcedure(P_PARSE_VALUE, [], {}, true)
            addToList(lEKey, '')
            addToList(lEChild, getVariable(vRetNode))
            callProcedure(P_SKIPWS, [], {}, true)
          },
        )

        ifThen(
          not(equals(letterOf(getVariable(vI), getVariable(vSrc)), ']')),
          () => {
            setVariableTo(vErrMsg, 'missing ]')
            callProcedure(P_FAIL, [], {}, true)
          },
        )
        changeVariableBy(vI, 1)

        setVariableTo(vNode, getItemOfList(lParseNodeStack, lengthOfList(lParseNodeStack)))
        setVariableTo(vFirst, getItemOfList(lNFirst, getVariable(vNode)))
        setVariableTo(
          vCount,
          add(subtract(lengthOfList(lEChild), getVariable(vFirst)), 1),
        )
        replaceItemOfList(lNCount, getVariable(vNode), getVariable(vCount))
        replaceItemOfList(lNEnd, getVariable(vNode), subtract(getVariable(vI), 1))
      },
    )

    setVariableTo(vRetNode, getItemOfList(lParseNodeStack, lengthOfList(lParseNodeStack)))
    deleteOfList(lParseNodeStack, 'last')
  }, true)

  // =========================================================
  // __json_parseValue:
  // - vI が value の先頭（空白は飛ばしてよい）
  // - vRetNode に node id
  // =========================================================
  defineProcedure([procedureLabel(P_PARSE_VALUE)], () => {
    callProcedure(P_SKIPWS, [], {}, true)

    ifThen(gt(getVariable(vI), getVariable(vLen)), () => {
      setVariableTo(vErrMsg, 'unexpected end of input')
      callProcedure(P_FAIL, [], {}, true)
    })

    setVariableTo(vTmpNum, getVariable(vI)) // start

    ifThen(equals(getVariable(vErr), 0), () => {
      ifElse(
        equals(letterOf(getVariable(vI), getVariable(vSrc)), '{'),
        () => {
          callProcedure(P_PARSE_OBJECT, [], {}, true)
        },
        () => {
          ifElse(
            equals(letterOf(getVariable(vI), getVariable(vSrc)), '['),
            () => {
              callProcedure(P_PARSE_ARRAY, [], {}, true)
            },
            () => {
              ifElse(
                equals(letterOf(getVariable(vI), getVariable(vSrc)), '"'),
                () => {
                  // string
                  callProcedure(P_PARSE_STRING, [], {}, true)

                  addToList(lNType, 3)
                  addToList(lNStart, getVariable(vTmpNum))
                  addToList(lNEnd, subtract(getVariable(vI), 1))
                  addToList(lNFirst, 0)
                  addToList(lNCount, 0)

                  setVariableTo(vRetNode, lengthOfList(lNType))
                },
                () => {
                  ifElse(
                    and(
                      not(gt(getVariable(vI), getVariable(vLen))),
                      or(
                        equals(letterOf(getVariable(vI), getVariable(vSrc)), '-'),
                        contains(DIGITS, letterOf(getVariable(vI), getVariable(vSrc))),
                      ),
                    ),
                    () => {
                      callProcedure(P_PARSE_NUMBER, [], {}, true)

                      addToList(lNType, 4)
                      addToList(lNStart, getVariable(vTmpNum))
                      addToList(lNEnd, subtract(getVariable(vI), 1))
                      addToList(lNFirst, 0)
                      addToList(lNCount, 0)

                      setVariableTo(vRetNode, lengthOfList(lNType))
                    },
                    () => {
                      // true / false / null
                      ifElse(
                        equals(letterOf(getVariable(vI), getVariable(vSrc)), 't'),
                        () => {
                          ifThen(
                            not(
                              and(
                                equals(letterOf(getVariable(vI), getVariable(vSrc)), 't'),
                                and(
                                  equals(letterOf(add(getVariable(vI), 1), getVariable(vSrc)), 'r'),
                                  and(
                                    equals(letterOf(add(getVariable(vI), 2), getVariable(vSrc)), 'u'),
                                    equals(letterOf(add(getVariable(vI), 3), getVariable(vSrc)), 'e'),
                                  ),
                                ),
                              )
                            ),
                            () => {
                              setVariableTo(vErrMsg, 'invalid literal true')
                              callProcedure(P_FAIL, [], {}, true)
                            },
                          )
                          changeVariableBy(vI, 4)

                          addToList(lNType, 5)
                          addToList(lNStart, getVariable(vTmpNum))
                          addToList(lNEnd, subtract(getVariable(vI), 1))
                          addToList(lNFirst, 0)
                          addToList(lNCount, 0)
                          setVariableTo(vRetNode, lengthOfList(lNType))
                        },
                        () => {
                          ifElse(
                            equals(letterOf(getVariable(vI), getVariable(vSrc)), 'f'),
                            () => {
                              ifThen(
                                not(
                                  and(
                                    equals(letterOf(getVariable(vI), getVariable(vSrc)), 'f'),
                                    and(
                                      equals(letterOf(add(getVariable(vI), 1), getVariable(vSrc)), 'a'),
                                      and(
                                        equals(letterOf(add(getVariable(vI), 2), getVariable(vSrc)), 'l'),
                                        and(
                                          equals(letterOf(add(getVariable(vI), 3), getVariable(vSrc)), 's'),
                                          equals(letterOf(add(getVariable(vI), 4), getVariable(vSrc)), 'e'),
                                        ),
                                      ),
                                    ),
                                  )
                                ),
                                () => {
                                  setVariableTo(vErrMsg, 'invalid literal false')
                                  callProcedure(P_FAIL, [], {}, true)
                                },
                              )
                              changeVariableBy(vI, 5)

                              addToList(lNType, 5)
                              addToList(lNStart, getVariable(vTmpNum))
                              addToList(lNEnd, subtract(getVariable(vI), 1))
                              addToList(lNFirst, 0)
                              addToList(lNCount, 0)
                              setVariableTo(vRetNode, lengthOfList(lNType))
                            },
                            () => {
                              ifElse(
                                equals(letterOf(getVariable(vI), getVariable(vSrc)), 'n'),
                                () => {
                                  ifThen(
                                    not(
                                      and(
                                        equals(letterOf(getVariable(vI), getVariable(vSrc)), 'n'),
                                        and(
                                          equals(letterOf(add(getVariable(vI), 1), getVariable(vSrc)), 'u'),
                                          and(
                                            equals(letterOf(add(getVariable(vI), 2), getVariable(vSrc)), 'l'),
                                            equals(letterOf(add(getVariable(vI), 3), getVariable(vSrc)), 'l'),
                                          ),
                                        ),
                                      )
                                    ),
                                    () => {
                                      setVariableTo(vErrMsg, 'invalid literal null')
                                      callProcedure(P_FAIL, [], {}, true)
                                    },
                                  )
                                  changeVariableBy(vI, 4)

                                  addToList(lNType, 6)
                                  addToList(lNStart, getVariable(vTmpNum))
                                  addToList(lNEnd, subtract(getVariable(vI), 1))
                                  addToList(lNFirst, 0)
                                  addToList(lNCount, 0)
                                  setVariableTo(vRetNode, lengthOfList(lNType))
                                },
                                () => {
                                  setVariableTo(vErrMsg, 'unexpected token')
                                  callProcedure(P_FAIL, [], {}, true)
                                },
                              )
                            },
                          )
                        },
                      )
                    },
                  )
                },
              )
            },
          )
        },
      )
    })
  }, true)

  // =========================================================
  // __json_slice:
  // vTmpNum = start, vTmpNum2 = end を json_src から切り出して vRetStr に入れる
  // =========================================================
  defineProcedure([procedureLabel(P_SLICE)], () => {
    setVariableTo(vRetStr, '')
    setVariableTo(vEdgeIdx, getVariable(vTmpNum))

    repeatUntil(gt(getVariable(vEdgeIdx), getVariable(vTmpNum2)), () => {
      setVariableTo(
        vRetStr,
        join(getVariable(vRetStr), letterOf(getVariable(vEdgeIdx), getVariable(vSrc))),
      )
      changeVariableBy(vEdgeIdx, 1)
    })
  }, true)

  // =========================================================
  // __json_reset:
  // parser/get の状態を初期化
  // =========================================================
  defineProcedure([procedureLabel(P_RESET)], () => {
    // parser state
    setVariableTo(vSrc, '')
    setVariableTo(vI, 1)
    setVariableTo(vLen, 0)
    setVariableTo(vRoot, 0)
    setVariableTo(vErr, 0)
    setVariableTo(vErrMsg, '')
    setVariableTo(vRetNode, 0)
    setVariableTo(vRetStr, '')

    // temporary
    setVariableTo(vTmpStr, '')
    setVariableTo(vTmpNum, 0)
    setVariableTo(vTmpNum2, 0)
    setVariableTo(vNode, 0)
    setVariableTo(vFirst, 0)
    setVariableTo(vCount, 0)
    setVariableTo(vEdgeIdx, 0)
    setVariableTo(vFound, 0)
    setVariableTo(vDone, 0)

    // jq/get state
    setVariableTo(vFilter, '')
    setVariableTo(vP, 1)
    setVariableTo(vFLen, 0)
    setVariableTo(vToken, '')
    setVariableTo(vSign, 1)
    setVariableTo(vIdx, 0)

    // loop variables
    setVariableTo(vLoopA, 0)
    setVariableTo(vLoopB, 0)
    setVariableTo(vLoopC, 0)
    setVariableTo(vLoopD, 0)

    // tree / edge
    deleteAllOfList(lNType)
    deleteAllOfList(lNStart)
    deleteAllOfList(lNEnd)
    deleteAllOfList(lNFirst)
    deleteAllOfList(lNCount)
    deleteAllOfList(lEKey)
    deleteAllOfList(lEChild)

    // jq work / output
    deleteAllOfList(lCur)
    deleteAllOfList(lNext)
    deleteAllOfList(lOut)
    deleteAllOfList(lParseNodeStack)
  }, true)

  // =========================================================
  // jq helper: skip ws and '|'
  // =========================================================
  defineProcedure([procedureLabel(P_JQ_SKIP)], () => {
    repeatUntil(
      or(
        gt(getVariable(vP), getVariable(vFLen)),
        and(
          not(
            or(
              equals(letterOf(getVariable(vP), getVariable(vFilter)), ' '),
              or(
                equals(letterOf(getVariable(vP), getVariable(vFilter)), '\n'),
                or(
                  equals(letterOf(getVariable(vP), getVariable(vFilter)), '\r'),
                  equals(letterOf(getVariable(vP), getVariable(vFilter)), '\t'),
                ),
              ),
            ),
          ),
          not(equals(letterOf(getVariable(vP), getVariable(vFilter)), '|')),
        ),
      ),
      () => {
        changeVariableBy(vP, 1)
      },
    )
  }, true)

  // =========================================================
  // jq step: apply key (vToken)
  // =========================================================
  defineProcedure([procedureLabel(P_JQ_APPLY_KEY)], () => {
    deleteAllOfList(lNext)

    forEach(vLoopA, lengthOfList(lCur), () => {
      setVariableTo(vNode, getItemOfList(lCur, getVariable(vLoopA)))

      // object?
      ifThen(equals(getItemOfList(lNType, getVariable(vNode)), 1), () => {
        setVariableTo(vFirst, getItemOfList(lNFirst, getVariable(vNode)))
        setVariableTo(vCount, getItemOfList(lNCount, getVariable(vNode)))
        setVariableTo(vFound, 0)

        forEach(vLoopC, getVariable(vCount), () => {
          ifThen(equals(getVariable(vFound), 0), () => {
            setVariableTo(
              vEdgeIdx,
              add(getVariable(vFirst), subtract(getVariable(vLoopC), 1)),
            )
            ifThen(
              equals(getItemOfList(lEKey, getVariable(vEdgeIdx)), getVariable(vToken)),
              () => {
                addToList(lNext, getItemOfList(lEChild, getVariable(vEdgeIdx)))
                setVariableTo(vFound, 1)
              },
            )
          })
        })
      })
    })

    // copy next -> cur
    deleteAllOfList(lCur)
    forEach(vLoopB, lengthOfList(lNext), () => {
      addToList(lCur, getItemOfList(lNext, getVariable(vLoopB)))
    })
  }, true)

  // =========================================================
  // jq step: apply index (vIdx) 0-based, negative supported
  // =========================================================
  defineProcedure([procedureLabel(P_JQ_APPLY_INDEX)], () => {
    deleteAllOfList(lNext)

    forEach(vLoopA, lengthOfList(lCur), () => {
      setVariableTo(vNode, getItemOfList(lCur, getVariable(vLoopA)))

      ifThen(equals(getItemOfList(lNType, getVariable(vNode)), 2), () => {
        setVariableTo(vFirst, getItemOfList(lNFirst, getVariable(vNode)))
        setVariableTo(vCount, getItemOfList(lNCount, getVariable(vNode)))

        // idxNorm = vIdx (負なら count+idx)
        setVariableTo(vTmpNum, getVariable(vIdx))
        ifThen(lt(getVariable(vIdx), 0), () => {
          setVariableTo(vTmpNum, add(getVariable(vCount), getVariable(vIdx)))
        })

        // 0 <= idxNorm < count
        ifThen(
          and(
            gt(getVariable(vTmpNum), -1),
            lt(getVariable(vTmpNum), getVariable(vCount)),
          ),
          () => {
            setVariableTo(vEdgeIdx, add(getVariable(vFirst), getVariable(vTmpNum)))
            addToList(lNext, getItemOfList(lEChild, getVariable(vEdgeIdx)))
          },
        )
      })
    })

    deleteAllOfList(lCur)
    forEach(vLoopB, lengthOfList(lNext), () => {
      addToList(lCur, getItemOfList(lNext, getVariable(vLoopB)))
    })
  }, true)

  // =========================================================
  // jq step: apply iter (.[]) arrays->elements, objects->values
  // =========================================================
  defineProcedure([procedureLabel(P_JQ_APPLY_ITER)], () => {
    deleteAllOfList(lNext)

    forEach(vLoopA, lengthOfList(lCur), () => {
      setVariableTo(vNode, getItemOfList(lCur, getVariable(vLoopA)))

      // array or object
      ifThen(
        or(
          equals(getItemOfList(lNType, getVariable(vNode)), 2),
          equals(getItemOfList(lNType, getVariable(vNode)), 1),
        ),
        () => {
          setVariableTo(vFirst, getItemOfList(lNFirst, getVariable(vNode)))
          setVariableTo(vCount, getItemOfList(lNCount, getVariable(vNode)))

          forEach(vLoopC, getVariable(vCount), () => {
            setVariableTo(
              vEdgeIdx,
              add(getVariable(vFirst), subtract(getVariable(vLoopC), 1)),
            )
            addToList(lNext, getItemOfList(lEChild, getVariable(vEdgeIdx)))
          })
        },
      )
    })

    deleteAllOfList(lCur)
    forEach(vLoopB, lengthOfList(lNext), () => {
      addToList(lCur, getItemOfList(lNext, getVariable(vLoopB)))
    })
  }, true)

  // =========================================================
  // public: parse %s
  // =========================================================
  defineProcedure(
    [procedureLabel('parse'), procedureStringOrNumber('jsonText')],
    ({ jsonText }) => {
      // reset
      callProcedure(P_RESET, [], {}, true)

      // set src
      setVariableTo(vSrc, argumentReporterStringNumber(jsonText))
      setVariableTo(vI, 1)
      setVariableTo(vLen, length(getVariable(vSrc)))

      // parse
      callProcedure(P_PARSE_VALUE, [], {}, true)
      setVariableTo(vRoot, getVariable(vRetNode))

      // trailing check
      callProcedure(P_SKIPWS, [], {}, true)
      ifThen(
        not(gt(getVariable(vI), getVariable(vLen))),
        () => {
          setVariableTo(vErrMsg, 'trailing characters')
          callProcedure(P_FAIL, [], {}, true)
        },
      )
    },
    true,
  )

  // =========================================================
  // public: reset
  // =========================================================
  defineProcedure([procedureLabel('reset')], () => {
    callProcedure(P_RESET, [], {}, true)
  }, true)

  // =========================================================
  // public: get %s
  // =========================================================
  defineProcedure(
    [procedureLabel('get'), procedureStringOrNumber('filterText')],
    ({ filterText }) => {
      deleteAllOfList(lOut)

      // root check
      ifThen(equals(getVariable(vRoot), 0), () => {
        setVariableTo(vErrMsg, 'call parse() first')
        callProcedure(P_FAIL, [], {}, true)
      })

      setVariableTo(vFilter, argumentReporterStringNumber(filterText))
      setVariableTo(vP, 1)
      setVariableTo(vFLen, length(getVariable(vFilter)))

      // outer: multiple queries separated by ','
      setVariableTo(vDone, 0)
      repeatUntil(equals(getVariable(vDone), 1), () => {
        // init cur = [root]
        deleteAllOfList(lCur)
        addToList(lCur, getVariable(vRoot))

        // steps loop until ',' or end
        setVariableTo(vTmpNum, 0) // local doneStep flag
        repeatUntil(equals(getVariable(vTmpNum), 1), () => {
          callProcedure(P_JQ_SKIP, [], {}, true)

          // end?
          ifThen(gt(getVariable(vP), getVariable(vFLen)), () => {
            setVariableTo(vTmpNum, 1)
          })

          // comma?
          ifThen(
            and(
              equals(getVariable(vTmpNum), 0),
              equals(letterOf(getVariable(vP), getVariable(vFilter)), ','),
            ),
            () => {
              setVariableTo(vTmpNum, 1)
            },
          )

          // still running
          ifThen(equals(getVariable(vTmpNum), 0), () => {
            // '.' は区切りとして消費
            ifThen(equals(letterOf(getVariable(vP), getVariable(vFilter)), '.'), () => {
              changeVariableBy(vP, 1)
            })

            callProcedure(P_JQ_SKIP, [], {}, true)

            // '[' step?
            ifElse(
              equals(letterOf(getVariable(vP), getVariable(vFilter)), '['),
              () => {
                // consume '['
                changeVariableBy(vP, 1)
                callProcedure(P_JQ_SKIP, [], {}, true)

                // ']' => iter
                ifElse(
                  equals(letterOf(getVariable(vP), getVariable(vFilter)), ']'),
                  () => {
                    changeVariableBy(vP, 1)
                    callProcedure(P_JQ_APPLY_ITER, [], {}, true)
                  },
                  () => {
                    // parse index number (optional '-')
                    setVariableTo(vSign, 1)
                    ifThen(equals(letterOf(getVariable(vP), getVariable(vFilter)), '-'), () => {
                      setVariableTo(vSign, -1)
                      changeVariableBy(vP, 1)
                    })

                    setVariableTo(vToken, '')
                    repeatWhile(
                      and(
                        not(gt(getVariable(vP), getVariable(vFLen))),
                        contains(DIGITS, letterOf(getVariable(vP), getVariable(vFilter))),
                      ),
                      () => {
                        setVariableTo(
                          vToken,
                          join(getVariable(vToken), letterOf(getVariable(vP), getVariable(vFilter))),
                        )
                        changeVariableBy(vP, 1)
                      },
                    )

                    ifThen(equals(getVariable(vToken), ''), () => {
                      setVariableTo(vErrMsg, 'index expected')
                      callProcedure(P_FAIL, [], {}, true)
                    })

                    // expect ']'
                    ifThen(
                      not(equals(letterOf(getVariable(vP), getVariable(vFilter)), ']')),
                      () => {
                        setVariableTo(vErrMsg, 'missing ] in index')
                        callProcedure(P_FAIL, [], {}, true)
                      },
                    )
                    changeVariableBy(vP, 1)

                    setVariableTo(vIdx, multiply(getVariable(vSign), getVariable(vToken)))
                    callProcedure(P_JQ_APPLY_INDEX, [], {}, true)
                  },
                )
              },
              () => {
                // identifier => key step
                setVariableTo(vToken, '')

                repeatWhile(
                  and(
                    not(gt(getVariable(vP), getVariable(vFLen))),
                    contains(IDCHARS, letterOf(getVariable(vP), getVariable(vFilter))),
                  ),
                  () => {
                    setVariableTo(
                      vToken,
                      join(getVariable(vToken), letterOf(getVariable(vP), getVariable(vFilter))),
                    )
                    changeVariableBy(vP, 1)
                  },
                )

                ifThen(
                  and(
                    equals(getVariable(vToken), ''),
                    not(
                      or(
                        gt(getVariable(vP), getVariable(vFLen)),
                        equals(letterOf(getVariable(vP), getVariable(vFilter)), ','),
                      ),
                    ),
                  ),
                  () => {
                    setVariableTo(vErrMsg, 'identifier expected')
                    callProcedure(P_FAIL, [], {}, true)
                  },
                )

                ifThen(not(equals(getVariable(vToken), '')), () => {
                  callProcedure(P_JQ_APPLY_KEY, [], {}, true)
                })
              },
            )
          })
        })

        // emit results in jq_out (slice original json)
        forEach(vLoopA, lengthOfList(lCur), () => {
          setVariableTo(vNode, getItemOfList(lCur, getVariable(vLoopA)))

          setVariableTo(vTmpNum, getItemOfList(lNStart, getVariable(vNode)))
          setVariableTo(vTmpNum2, getItemOfList(lNEnd, getVariable(vNode)))
          callProcedure(P_SLICE, [], {}, true)
          addToList(lOut, getVariable(vRetStr))
        })

        // skip ws
        callProcedure(P_JQ_SKIP, [], {}, true)

        // if comma then continue else done
        ifElse(
          and(
            not(gt(getVariable(vP), getVariable(vFLen))),
            equals(letterOf(getVariable(vP), getVariable(vFilter)), ','),
          ),
          () => {
            changeVariableBy(vP, 1)
          },
          () => {
            setVariableTo(vDone, 1)
          },
        )
      })
    },
    true,
  )

  // 動作確認用（任意で消してOK）
  whenFlagClicked(() => {
    callProcedure('reset', [], {}, true)
    callProcedure('parse %s', ['jsonText'], { jsonText: '' }, true)
    callProcedure('get %s', ['filterText'], { filterText: '' }, true)
  })
})

export default project
