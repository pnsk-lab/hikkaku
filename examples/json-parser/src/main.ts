import { Project } from 'hikkaku'
import {
  add,
  addToList,
  and,
  argumentReporterStringNumber,
  callProcedure,
  changeVariableBy,
  contains,
  defineProcedure,
  deleteAllOfList,
  deleteOfList,
  equals,
  forEach,
  getItemOfList,
  getVariable,
  gt,
  ifElse,
  ifThen,
  join,
  length,
  lengthOfList,
  letterOf,
  lt,
  not,
  or,
  procedureLabel,
  procedureStringOrNumber,
  replaceItemOfList,
  setVariableTo,
  showList,
  whenFlagClicked,
} from 'hikkaku/blocks'

const project = new Project()
const parser = project.createSprite('json-parser')

const sourceText = parser.createVariable('sourceText', '')
const parseOk = parser.createVariable('parseOk', 0)
const errorCode = parser.createVariable('errorCode', '')

const idx = parser.createVariable('idx', 1)
const len = parser.createVariable('len', 0)
const ch = parser.createVariable('ch', '')
const mode = parser.createVariable('mode', '')
const context = parser.createVariable('context', '')
const topPos = parser.createVariable('topPos', 0)
const topNode = parser.createVariable('topNode', 0)
const topKind = parser.createVariable('topKind', '')
const parsedNode = parser.createVariable('parsedNode', 0)
const attachParent = parser.createVariable('attachParent', 0)
const attachKey = parser.createVariable('attachKey', '')
const attachIndex = parser.createVariable('attachIndex', 0)
const keyBuffer = parser.createVariable('keyBuffer', '')
const token = parser.createVariable('token', '')
const tokenDone = parser.createVariable('tokenDone', 0)
const escapeMode = parser.createVariable('escapeMode', 0)
const nodeCount = parser.createVariable('nodeCount', 0)
const rootNode = parser.createVariable('rootNode', 0)
const found = parser.createVariable('found', 0)
const i = parser.createVariable('i', 1)
const j = parser.createVariable('j', 1)
const k = parser.createVariable('k', 1)
const rawQuery = parser.createVariable('rawQuery', '')
const queryText = parser.createVariable('queryText', '')
const queryPos = parser.createVariable('queryPos', 1)
const queryLen = parser.createVariable('queryLen', 0)
const queryError = parser.createVariable('queryError', 0)
const currentNode = parser.createVariable('currentNode', 0)
const resultBuffer = parser.createVariable('resultBuffer', '')
const startPos = parser.createVariable('startPos', 0)
const endPos = parser.createVariable('endPos', 0)
const numberBuffer = parser.createVariable('numberBuffer', '')
const tempIndex = parser.createVariable('tempIndex', 0)
const backspaceChar = parser.createVariable('backspaceChar', '\b')
const formFeedChar = parser.createVariable('formFeedChar', '\f')

const nodeType = parser.createList('nodeType', [])
const nodeParent = parser.createList('nodeParent', [])
const nodeKey = parser.createList('nodeKey', [])
const nodeIndex = parser.createList('nodeIndex', [])
const nodeStart = parser.createList('nodeStart', [])
const nodeEnd = parser.createList('nodeEnd', [])
const nodeValue = parser.createList('nodeValue', [])

const stackNode = parser.createList('stackNode', [])
const stackKind = parser.createList('stackKind', [])
const stackMode = parser.createList('stackMode', [])
const stackKey = parser.createList('stackKey', [])
const stackNextIndex = parser.createList('stackNextIndex', [])

const queryNodes = parser.createList('queryNodes', [])
const queryNextNodes = parser.createList('queryNextNodes', [])
const queryTempNodes = parser.createList('queryTempNodes', [])

const queryResult = project.stage.createList('queryResult', [])

const read = (v: typeof idx) => getVariable(v)

const parseProcCode = 'parse'
const getProcCode = 'get'

parser.run(() => {
  const parseProcedure = defineProcedure(
    [procedureLabel(parseProcCode), procedureStringOrNumber('jsonText')],
    ({ jsonText }) => {
      setVariableTo(sourceText, argumentReporterStringNumber(jsonText))
      setVariableTo(parseOk, 0)
      setVariableTo(errorCode, '')
      setVariableTo(rootNode, 0)

      deleteAllOfList(nodeType)
      deleteAllOfList(nodeParent)
      deleteAllOfList(nodeKey)
      deleteAllOfList(nodeIndex)
      deleteAllOfList(nodeStart)
      deleteAllOfList(nodeEnd)
      deleteAllOfList(nodeValue)
      deleteAllOfList(stackNode)
      deleteAllOfList(stackKind)
      deleteAllOfList(stackMode)
      deleteAllOfList(stackKey)
      deleteAllOfList(stackNextIndex)

      setVariableTo(idx, 1)
      setVariableTo(len, length(read(sourceText)))

      // Main parser loop.
      ifThen(gt(read(len), 0), () => {
        forEach(i, add(read(len), 2), () => {
          ifThen(
            and(equals(read(parseOk), 0), equals(read(errorCode), '')),
            () => {
              ifThen(lt(read(idx), add(read(len), 1)), () => {
                setVariableTo(ch, letterOf(read(idx), read(sourceText)))

                ifElse(
                  or(
                    equals(read(ch), ' '),
                    or(
                      equals(read(ch), '\n'),
                      or(equals(read(ch), '\r'), equals(read(ch), '\t')),
                    ),
                  ),
                  () => {
                    changeVariableBy(idx, 1)
                  },
                  () => {
                    setVariableTo(mode, '')
                    setVariableTo(context, '')
                    setVariableTo(topPos, lengthOfList(stackNode))

                    ifElse(
                      equals(read(topPos), 0),
                      () => {
                        ifElse(
                          equals(read(rootNode), 0),
                          () => {
                            setVariableTo(mode, 'value')
                            setVariableTo(context, 'root')
                            setVariableTo(attachParent, 0)
                            setVariableTo(attachKey, '')
                            setVariableTo(attachIndex, 0)
                          },
                          () => {
                            setVariableTo(errorCode, 'TRAILING_TOKEN')
                          },
                        )
                      },
                      () => {
                        setVariableTo(
                          topNode,
                          getItemOfList(stackNode, read(topPos)),
                        )
                        setVariableTo(
                          topKind,
                          getItemOfList(stackKind, read(topPos)),
                        )
                        setVariableTo(
                          mode,
                          getItemOfList(stackMode, read(topPos)),
                        )

                        ifThen(
                          and(
                            equals(read(topKind), 'object'),
                            equals(read(mode), 'key_or_end'),
                          ),
                          () => {
                            ifElse(
                              equals(read(ch), '}'),
                              () => {
                                replaceItemOfList(
                                  nodeEnd,
                                  read(topNode),
                                  read(idx),
                                )
                                deleteOfList(stackNode, 'last')
                                deleteOfList(stackKind, 'last')
                                deleteOfList(stackMode, 'last')
                                deleteOfList(stackKey, 'last')
                                deleteOfList(stackNextIndex, 'last')
                                changeVariableBy(idx, 1)
                              },
                              () => {
                                ifElse(
                                  equals(read(ch), '"'),
                                  () => {
                                    setVariableTo(keyBuffer, '')
                                    setVariableTo(tokenDone, 0)
                                    setVariableTo(escapeMode, 0)
                                    changeVariableBy(idx, 1)

                                    forEach(j, add(read(len), 2), () => {
                                      ifThen(
                                        and(
                                          equals(read(tokenDone), 0),
                                          equals(read(errorCode), ''),
                                        ),
                                        () => {
                                          ifElse(
                                            gt(read(idx), read(len)),
                                            () => {
                                              setVariableTo(
                                                errorCode,
                                                'UNTERMINATED_KEY',
                                              )
                                            },
                                            () => {
                                              setVariableTo(
                                                ch,
                                                letterOf(
                                                  read(idx),
                                                  read(sourceText),
                                                ),
                                              )
                                              ifElse(
                                                equals(read(escapeMode), 1),
                                                () => {
                                                  ifElse(
                                                    equals(read(ch), 'n'),
                                                    () => {
                                                      setVariableTo(
                                                        keyBuffer,
                                                        join(
                                                          read(keyBuffer),
                                                          '\n',
                                                        ),
                                                      )
                                                    },
                                                    () => {
                                                      ifElse(
                                                        equals(read(ch), 'r'),
                                                        () => {
                                                          setVariableTo(
                                                            keyBuffer,
                                                            join(
                                                              read(keyBuffer),
                                                              '\r',
                                                            ),
                                                          )
                                                        },
                                                        () => {
                                                          ifElse(
                                                            equals(
                                                              read(ch),
                                                              't',
                                                            ),
                                                            () => {
                                                              setVariableTo(
                                                                keyBuffer,
                                                                join(
                                                                  read(
                                                                    keyBuffer,
                                                                  ),
                                                                  '\t',
                                                                ),
                                                              )
                                                            },
                                                            () => {
                                                              ifElse(
                                                                equals(
                                                                  read(ch),
                                                                  'b',
                                                                ),
                                                                () => {
                                                                  setVariableTo(
                                                                    keyBuffer,
                                                                    join(
                                                                      read(
                                                                        keyBuffer,
                                                                      ),
                                                                      read(
                                                                        backspaceChar,
                                                                      ),
                                                                    ),
                                                                  )
                                                                },
                                                                () => {
                                                                  ifElse(
                                                                    equals(
                                                                      read(ch),
                                                                      'f',
                                                                    ),
                                                                    () => {
                                                                      setVariableTo(
                                                                        keyBuffer,
                                                                        join(
                                                                          read(
                                                                            keyBuffer,
                                                                          ),
                                                                          read(
                                                                            formFeedChar,
                                                                          ),
                                                                        ),
                                                                      )
                                                                    },
                                                                    () => {
                                                                      setVariableTo(
                                                                        keyBuffer,
                                                                        join(
                                                                          read(
                                                                            keyBuffer,
                                                                          ),
                                                                          read(
                                                                            ch,
                                                                          ),
                                                                        ),
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
                                                  setVariableTo(escapeMode, 0)
                                                  changeVariableBy(idx, 1)
                                                },
                                                () => {
                                                  ifElse(
                                                    equals(read(ch), '\\'),
                                                    () => {
                                                      setVariableTo(
                                                        escapeMode,
                                                        1,
                                                      )
                                                      changeVariableBy(idx, 1)
                                                    },
                                                    () => {
                                                      ifElse(
                                                        equals(read(ch), '"'),
                                                        () => {
                                                          replaceItemOfList(
                                                            stackKey,
                                                            read(topPos),
                                                            read(keyBuffer),
                                                          )
                                                          replaceItemOfList(
                                                            stackMode,
                                                            read(topPos),
                                                            'colon',
                                                          )
                                                          setVariableTo(
                                                            tokenDone,
                                                            1,
                                                          )
                                                          changeVariableBy(
                                                            idx,
                                                            1,
                                                          )
                                                        },
                                                        () => {
                                                          setVariableTo(
                                                            keyBuffer,
                                                            join(
                                                              read(keyBuffer),
                                                              read(ch),
                                                            ),
                                                          )
                                                          changeVariableBy(
                                                            idx,
                                                            1,
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
                                  },
                                  () => {
                                    setVariableTo(
                                      errorCode,
                                      'OBJECT_KEY_EXPECTED',
                                    )
                                  },
                                )
                              },
                            )
                          },
                        )

                        ifThen(
                          and(
                            equals(read(topKind), 'object'),
                            equals(read(mode), 'colon'),
                          ),
                          () => {
                            ifElse(
                              equals(read(ch), ':'),
                              () => {
                                replaceItemOfList(
                                  stackMode,
                                  read(topPos),
                                  'value',
                                )
                                changeVariableBy(idx, 1)
                              },
                              () => {
                                setVariableTo(errorCode, 'COLON_EXPECTED')
                              },
                            )
                          },
                        )

                        ifThen(
                          and(
                            equals(read(topKind), 'object'),
                            equals(read(mode), 'comma_or_end'),
                          ),
                          () => {
                            ifElse(
                              equals(read(ch), ','),
                              () => {
                                replaceItemOfList(
                                  stackMode,
                                  read(topPos),
                                  'key_or_end',
                                )
                                changeVariableBy(idx, 1)
                              },
                              () => {
                                ifElse(
                                  equals(read(ch), '}'),
                                  () => {
                                    replaceItemOfList(
                                      nodeEnd,
                                      read(topNode),
                                      read(idx),
                                    )
                                    deleteOfList(stackNode, 'last')
                                    deleteOfList(stackKind, 'last')
                                    deleteOfList(stackMode, 'last')
                                    deleteOfList(stackKey, 'last')
                                    deleteOfList(stackNextIndex, 'last')
                                    changeVariableBy(idx, 1)
                                  },
                                  () => {
                                    setVariableTo(
                                      errorCode,
                                      'OBJECT_COMMA_EXPECTED',
                                    )
                                  },
                                )
                              },
                            )
                          },
                        )

                        ifThen(
                          and(
                            equals(read(topKind), 'array'),
                            equals(read(mode), 'comma_or_end'),
                          ),
                          () => {
                            ifElse(
                              equals(read(ch), ','),
                              () => {
                                replaceItemOfList(
                                  stackMode,
                                  read(topPos),
                                  'value_or_end',
                                )
                                changeVariableBy(idx, 1)
                              },
                              () => {
                                ifElse(
                                  equals(read(ch), ']'),
                                  () => {
                                    replaceItemOfList(
                                      nodeEnd,
                                      read(topNode),
                                      read(idx),
                                    )
                                    deleteOfList(stackNode, 'last')
                                    deleteOfList(stackKind, 'last')
                                    deleteOfList(stackMode, 'last')
                                    deleteOfList(stackKey, 'last')
                                    deleteOfList(stackNextIndex, 'last')
                                    changeVariableBy(idx, 1)
                                  },
                                  () => {
                                    setVariableTo(
                                      errorCode,
                                      'ARRAY_COMMA_EXPECTED',
                                    )
                                  },
                                )
                              },
                            )
                          },
                        )

                        ifThen(
                          and(
                            equals(read(topKind), 'array'),
                            equals(read(mode), 'value_or_end'),
                          ),
                          () => {
                            ifElse(
                              equals(read(ch), ']'),
                              () => {
                                replaceItemOfList(
                                  nodeEnd,
                                  read(topNode),
                                  read(idx),
                                )
                                deleteOfList(stackNode, 'last')
                                deleteOfList(stackKind, 'last')
                                deleteOfList(stackMode, 'last')
                                deleteOfList(stackKey, 'last')
                                deleteOfList(stackNextIndex, 'last')
                                changeVariableBy(idx, 1)
                              },
                              () => {
                                setVariableTo(mode, 'value')
                                setVariableTo(context, 'array')
                                setVariableTo(attachParent, read(topNode))
                                setVariableTo(attachKey, '')
                                setVariableTo(
                                  attachIndex,
                                  getItemOfList(stackNextIndex, read(topPos)),
                                )
                              },
                            )
                          },
                        )

                        ifThen(
                          and(
                            equals(read(topKind), 'object'),
                            equals(read(mode), 'value'),
                          ),
                          () => {
                            setVariableTo(mode, 'value')
                            setVariableTo(context, 'object')
                            setVariableTo(attachParent, read(topNode))
                            setVariableTo(
                              attachKey,
                              getItemOfList(stackKey, read(topPos)),
                            )
                            setVariableTo(attachIndex, 0)
                          },
                        )
                      },
                    )

                    ifThen(
                      and(
                        equals(read(mode), 'value'),
                        equals(read(errorCode), ''),
                      ),
                      () => {
                        setVariableTo(parsedNode, 0)
                        setVariableTo(ch, letterOf(read(idx), read(sourceText)))

                        ifElse(
                          equals(read(ch), '{'),
                          () => {
                            setVariableTo(
                              nodeCount,
                              add(lengthOfList(nodeType), 1),
                            )
                            addToList(nodeType, 'object')
                            addToList(nodeParent, read(attachParent))
                            addToList(nodeKey, read(attachKey))
                            addToList(nodeIndex, read(attachIndex))
                            addToList(nodeStart, read(idx))
                            addToList(nodeEnd, 0)
                            addToList(nodeValue, '')
                            setVariableTo(parsedNode, read(nodeCount))

                            addToList(stackNode, read(parsedNode))
                            addToList(stackKind, 'object')
                            addToList(stackMode, 'key_or_end')
                            addToList(stackKey, '')
                            addToList(stackNextIndex, 1)
                            changeVariableBy(idx, 1)
                          },
                          () => {
                            ifElse(
                              equals(read(ch), '['),
                              () => {
                                setVariableTo(
                                  nodeCount,
                                  add(lengthOfList(nodeType), 1),
                                )
                                addToList(nodeType, 'array')
                                addToList(nodeParent, read(attachParent))
                                addToList(nodeKey, read(attachKey))
                                addToList(nodeIndex, read(attachIndex))
                                addToList(nodeStart, read(idx))
                                addToList(nodeEnd, 0)
                                addToList(nodeValue, '')
                                setVariableTo(parsedNode, read(nodeCount))

                                addToList(stackNode, read(parsedNode))
                                addToList(stackKind, 'array')
                                addToList(stackMode, 'value_or_end')
                                addToList(stackKey, '')
                                addToList(stackNextIndex, 1)
                                changeVariableBy(idx, 1)
                              },
                              () => {
                                ifElse(
                                  equals(read(ch), '"'),
                                  () => {
                                    setVariableTo(token, '')
                                    setVariableTo(tokenDone, 0)
                                    setVariableTo(escapeMode, 0)
                                    setVariableTo(startPos, read(idx))
                                    changeVariableBy(idx, 1)

                                    forEach(j, add(read(len), 2), () => {
                                      ifThen(
                                        and(
                                          equals(read(tokenDone), 0),
                                          equals(read(errorCode), ''),
                                        ),
                                        () => {
                                          ifElse(
                                            gt(read(idx), read(len)),
                                            () => {
                                              setVariableTo(
                                                errorCode,
                                                'UNTERMINATED_STRING',
                                              )
                                            },
                                            () => {
                                              setVariableTo(
                                                ch,
                                                letterOf(
                                                  read(idx),
                                                  read(sourceText),
                                                ),
                                              )
                                              ifElse(
                                                equals(read(escapeMode), 1),
                                                () => {
                                                  ifElse(
                                                    equals(read(ch), 'n'),
                                                    () => {
                                                      setVariableTo(
                                                        token,
                                                        join(read(token), '\n'),
                                                      )
                                                    },
                                                    () => {
                                                      ifElse(
                                                        equals(read(ch), 'r'),
                                                        () => {
                                                          setVariableTo(
                                                            token,
                                                            join(
                                                              read(token),
                                                              '\r',
                                                            ),
                                                          )
                                                        },
                                                        () => {
                                                          ifElse(
                                                            equals(
                                                              read(ch),
                                                              't',
                                                            ),
                                                            () => {
                                                              setVariableTo(
                                                                token,
                                                                join(
                                                                  read(token),
                                                                  '\t',
                                                                ),
                                                              )
                                                            },
                                                            () => {
                                                              ifElse(
                                                                equals(
                                                                  read(ch),
                                                                  'b',
                                                                ),
                                                                () => {
                                                                  setVariableTo(
                                                                    token,
                                                                    join(
                                                                      read(
                                                                        token,
                                                                      ),
                                                                      read(
                                                                        backspaceChar,
                                                                      ),
                                                                    ),
                                                                  )
                                                                },
                                                                () => {
                                                                  ifElse(
                                                                    equals(
                                                                      read(ch),
                                                                      'f',
                                                                    ),
                                                                    () => {
                                                                      setVariableTo(
                                                                        token,
                                                                        join(
                                                                          read(
                                                                            token,
                                                                          ),
                                                                          read(
                                                                            formFeedChar,
                                                                          ),
                                                                        ),
                                                                      )
                                                                    },
                                                                    () => {
                                                                      setVariableTo(
                                                                        token,
                                                                        join(
                                                                          read(
                                                                            token,
                                                                          ),
                                                                          read(
                                                                            ch,
                                                                          ),
                                                                        ),
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
                                                  setVariableTo(escapeMode, 0)
                                                  changeVariableBy(idx, 1)
                                                },
                                                () => {
                                                  ifElse(
                                                    equals(read(ch), '\\'),
                                                    () => {
                                                      setVariableTo(
                                                        escapeMode,
                                                        1,
                                                      )
                                                      changeVariableBy(idx, 1)
                                                    },
                                                    () => {
                                                      ifElse(
                                                        equals(read(ch), '"'),
                                                        () => {
                                                          setVariableTo(
                                                            tokenDone,
                                                            1,
                                                          )
                                                          changeVariableBy(
                                                            idx,
                                                            1,
                                                          )
                                                        },
                                                        () => {
                                                          setVariableTo(
                                                            token,
                                                            join(
                                                              read(token),
                                                              read(ch),
                                                            ),
                                                          )
                                                          changeVariableBy(
                                                            idx,
                                                            1,
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

                                    ifThen(
                                      and(
                                        equals(read(errorCode), ''),
                                        equals(read(tokenDone), 1),
                                      ),
                                      () => {
                                        setVariableTo(
                                          nodeCount,
                                          add(lengthOfList(nodeType), 1),
                                        )
                                        addToList(nodeType, 'string')
                                        addToList(
                                          nodeParent,
                                          read(attachParent),
                                        )
                                        addToList(nodeKey, read(attachKey))
                                        addToList(nodeIndex, read(attachIndex))
                                        addToList(nodeStart, read(startPos))
                                        addToList(nodeEnd, add(read(idx), -1))
                                        addToList(nodeValue, read(token))
                                        setVariableTo(
                                          parsedNode,
                                          read(nodeCount),
                                        )
                                      },
                                    )
                                  },
                                  () => {
                                    ifElse(
                                      equals(read(ch), 't'),
                                      () => {
                                        ifElse(
                                          and(
                                            and(
                                              equals(
                                                letterOf(
                                                  read(idx),
                                                  read(sourceText),
                                                ),
                                                't',
                                              ),
                                              equals(
                                                letterOf(
                                                  add(read(idx), 1),
                                                  read(sourceText),
                                                ),
                                                'r',
                                              ),
                                            ),
                                            and(
                                              equals(
                                                letterOf(
                                                  add(read(idx), 2),
                                                  read(sourceText),
                                                ),
                                                'u',
                                              ),
                                              equals(
                                                letterOf(
                                                  add(read(idx), 3),
                                                  read(sourceText),
                                                ),
                                                'e',
                                              ),
                                            ),
                                          ),
                                          () => {
                                            setVariableTo(
                                              nodeCount,
                                              add(lengthOfList(nodeType), 1),
                                            )
                                            addToList(nodeType, 'boolean')
                                            addToList(
                                              nodeParent,
                                              read(attachParent),
                                            )
                                            addToList(nodeKey, read(attachKey))
                                            addToList(
                                              nodeIndex,
                                              read(attachIndex),
                                            )
                                            addToList(nodeStart, read(idx))
                                            addToList(
                                              nodeEnd,
                                              add(read(idx), 3),
                                            )
                                            addToList(nodeValue, 'true')
                                            setVariableTo(
                                              parsedNode,
                                              read(nodeCount),
                                            )
                                            changeVariableBy(idx, 4)
                                          },
                                          () => {
                                            setVariableTo(
                                              errorCode,
                                              'INVALID_LITERAL',
                                            )
                                          },
                                        )
                                      },
                                      () => {
                                        ifElse(
                                          equals(read(ch), 'f'),
                                          () => {
                                            ifElse(
                                              and(
                                                and(
                                                  equals(
                                                    letterOf(
                                                      read(idx),
                                                      read(sourceText),
                                                    ),
                                                    'f',
                                                  ),
                                                  equals(
                                                    letterOf(
                                                      add(read(idx), 1),
                                                      read(sourceText),
                                                    ),
                                                    'a',
                                                  ),
                                                ),
                                                and(
                                                  equals(
                                                    letterOf(
                                                      add(read(idx), 2),
                                                      read(sourceText),
                                                    ),
                                                    'l',
                                                  ),
                                                  and(
                                                    equals(
                                                      letterOf(
                                                        add(read(idx), 3),
                                                        read(sourceText),
                                                      ),
                                                      's',
                                                    ),
                                                    equals(
                                                      letterOf(
                                                        add(read(idx), 4),
                                                        read(sourceText),
                                                      ),
                                                      'e',
                                                    ),
                                                  ),
                                                ),
                                              ),
                                              () => {
                                                setVariableTo(
                                                  nodeCount,
                                                  add(
                                                    lengthOfList(nodeType),
                                                    1,
                                                  ),
                                                )
                                                addToList(nodeType, 'boolean')
                                                addToList(
                                                  nodeParent,
                                                  read(attachParent),
                                                )
                                                addToList(
                                                  nodeKey,
                                                  read(attachKey),
                                                )
                                                addToList(
                                                  nodeIndex,
                                                  read(attachIndex),
                                                )
                                                addToList(nodeStart, read(idx))
                                                addToList(
                                                  nodeEnd,
                                                  add(read(idx), 4),
                                                )
                                                addToList(nodeValue, 'false')
                                                setVariableTo(
                                                  parsedNode,
                                                  read(nodeCount),
                                                )
                                                changeVariableBy(idx, 5)
                                              },
                                              () => {
                                                setVariableTo(
                                                  errorCode,
                                                  'INVALID_LITERAL',
                                                )
                                              },
                                            )
                                          },
                                          () => {
                                            ifElse(
                                              equals(read(ch), 'n'),
                                              () => {
                                                ifElse(
                                                  and(
                                                    and(
                                                      equals(
                                                        letterOf(
                                                          read(idx),
                                                          read(sourceText),
                                                        ),
                                                        'n',
                                                      ),
                                                      equals(
                                                        letterOf(
                                                          add(read(idx), 1),
                                                          read(sourceText),
                                                        ),
                                                        'u',
                                                      ),
                                                    ),
                                                    and(
                                                      equals(
                                                        letterOf(
                                                          add(read(idx), 2),
                                                          read(sourceText),
                                                        ),
                                                        'l',
                                                      ),
                                                      equals(
                                                        letterOf(
                                                          add(read(idx), 3),
                                                          read(sourceText),
                                                        ),
                                                        'l',
                                                      ),
                                                    ),
                                                  ),
                                                  () => {
                                                    setVariableTo(
                                                      nodeCount,
                                                      add(
                                                        lengthOfList(nodeType),
                                                        1,
                                                      ),
                                                    )
                                                    addToList(nodeType, 'null')
                                                    addToList(
                                                      nodeParent,
                                                      read(attachParent),
                                                    )
                                                    addToList(
                                                      nodeKey,
                                                      read(attachKey),
                                                    )
                                                    addToList(
                                                      nodeIndex,
                                                      read(attachIndex),
                                                    )
                                                    addToList(
                                                      nodeStart,
                                                      read(idx),
                                                    )
                                                    addToList(
                                                      nodeEnd,
                                                      add(read(idx), 3),
                                                    )
                                                    addToList(nodeValue, 'null')
                                                    setVariableTo(
                                                      parsedNode,
                                                      read(nodeCount),
                                                    )
                                                    changeVariableBy(idx, 4)
                                                  },
                                                  () => {
                                                    setVariableTo(
                                                      errorCode,
                                                      'INVALID_LITERAL',
                                                    )
                                                  },
                                                )
                                              },
                                              () => {
                                                setVariableTo(
                                                  startPos,
                                                  read(idx),
                                                )
                                                setVariableTo(numberBuffer, '')
                                                setVariableTo(tokenDone, 0)

                                                forEach(
                                                  j,
                                                  add(read(len), 2),
                                                  () => {
                                                    ifThen(
                                                      and(
                                                        equals(
                                                          read(tokenDone),
                                                          0,
                                                        ),
                                                        equals(
                                                          read(errorCode),
                                                          '',
                                                        ),
                                                      ),
                                                      () => {
                                                        ifElse(
                                                          gt(
                                                            read(idx),
                                                            read(len),
                                                          ),
                                                          () => {
                                                            setVariableTo(
                                                              tokenDone,
                                                              1,
                                                            )
                                                          },
                                                          () => {
                                                            setVariableTo(
                                                              ch,
                                                              letterOf(
                                                                read(idx),
                                                                read(
                                                                  sourceText,
                                                                ),
                                                              ),
                                                            )
                                                            ifElse(
                                                              or(
                                                                or(
                                                                  contains(
                                                                    '-+0123456789',
                                                                    read(ch),
                                                                  ),
                                                                  equals(
                                                                    read(ch),
                                                                    '.',
                                                                  ),
                                                                ),
                                                                or(
                                                                  equals(
                                                                    read(ch),
                                                                    'e',
                                                                  ),
                                                                  equals(
                                                                    read(ch),
                                                                    'E',
                                                                  ),
                                                                ),
                                                              ),
                                                              () => {
                                                                setVariableTo(
                                                                  numberBuffer,
                                                                  join(
                                                                    read(
                                                                      numberBuffer,
                                                                    ),
                                                                    read(ch),
                                                                  ),
                                                                )
                                                                changeVariableBy(
                                                                  idx,
                                                                  1,
                                                                )
                                                              },
                                                              () => {
                                                                setVariableTo(
                                                                  tokenDone,
                                                                  1,
                                                                )
                                                              },
                                                            )
                                                          },
                                                        )
                                                      },
                                                    )
                                                  },
                                                )

                                                ifElse(
                                                  equals(
                                                    read(numberBuffer),
                                                    '',
                                                  ),
                                                  () => {
                                                    setVariableTo(
                                                      errorCode,
                                                      'VALUE_EXPECTED',
                                                    )
                                                  },
                                                  () => {
                                                    setVariableTo(
                                                      nodeCount,
                                                      add(
                                                        lengthOfList(nodeType),
                                                        1,
                                                      ),
                                                    )
                                                    addToList(
                                                      nodeType,
                                                      'number',
                                                    )
                                                    addToList(
                                                      nodeParent,
                                                      read(attachParent),
                                                    )
                                                    addToList(
                                                      nodeKey,
                                                      read(attachKey),
                                                    )
                                                    addToList(
                                                      nodeIndex,
                                                      read(attachIndex),
                                                    )
                                                    addToList(
                                                      nodeStart,
                                                      read(startPos),
                                                    )
                                                    addToList(
                                                      nodeEnd,
                                                      add(read(idx), -1),
                                                    )
                                                    addToList(
                                                      nodeValue,
                                                      read(numberBuffer),
                                                    )
                                                    setVariableTo(
                                                      parsedNode,
                                                      read(nodeCount),
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

                        ifThen(
                          and(
                            equals(read(errorCode), ''),
                            gt(read(parsedNode), 0),
                          ),
                          () => {
                            ifThen(equals(read(rootNode), 0), () => {
                              setVariableTo(rootNode, read(parsedNode))
                            })

                            ifThen(equals(read(context), 'object'), () => {
                              replaceItemOfList(
                                stackMode,
                                read(topPos),
                                'comma_or_end',
                              )
                            })
                            ifThen(equals(read(context), 'array'), () => {
                              replaceItemOfList(
                                stackMode,
                                read(topPos),
                                'comma_or_end',
                              )
                              replaceItemOfList(
                                stackNextIndex,
                                read(topPos),
                                add(
                                  getItemOfList(stackNextIndex, read(topPos)),
                                  1,
                                ),
                              )
                            })
                          },
                        )
                      },
                    )
                  },
                )
              })
            },
          )
        })
      })

      ifThen(equals(read(errorCode), ''), () => {
        ifThen(equals(read(rootNode), 0), () => {
          setVariableTo(errorCode, 'EMPTY_INPUT')
        })
        ifThen(gt(lengthOfList(stackNode), 0), () => {
          setVariableTo(errorCode, 'UNTERMINATED_CONTAINER')
        })
      })

      ifThen(equals(read(errorCode), ''), () => {
        setVariableTo(parseOk, 1)
      })
    },
    true,
  )

  const getProcedure = defineProcedure(
    [procedureLabel(getProcCode), procedureStringOrNumber('query')],
    ({ query }) => {
      deleteAllOfList(queryResult)
      deleteAllOfList(queryNodes)
      deleteAllOfList(queryNextNodes)
      deleteAllOfList(queryTempNodes)

      setVariableTo(rawQuery, argumentReporterStringNumber(query))
      setVariableTo(queryError, 0)
      setVariableTo(queryPos, 1)
      setVariableTo(queryLen, length(read(rawQuery)))

      ifThen(equals(read(parseOk), 0), () => {
        setVariableTo(queryError, 1)
      })

      ifThen(
        and(
          equals(read(queryError), 0),
          or(equals(read(queryLen), 0), equals(read(rootNode), 0)),
        ),
        () => {
          setVariableTo(queryError, 1)
        },
      )

      ifThen(equals(read(queryError), 0), () => {
        addToList(queryNodes, read(rootNode))
      })

      // Split query by `|` and apply each stage from left to right.
      forEach(i, add(read(queryLen), 2), () => {
        ifThen(
          and(
            equals(read(queryError), 0),
            lt(read(queryPos), add(read(queryLen), 1)),
          ),
          () => {
            setVariableTo(queryText, '')
            setVariableTo(tokenDone, 0)

            forEach(j, add(read(queryLen), 2), () => {
              ifThen(
                and(
                  equals(read(tokenDone), 0),
                  lt(read(queryPos), add(read(queryLen), 1)),
                ),
                () => {
                  setVariableTo(ch, letterOf(read(queryPos), read(rawQuery)))
                  ifElse(
                    equals(read(ch), '|'),
                    () => {
                      setVariableTo(tokenDone, 1)
                    },
                    () => {
                      setVariableTo(queryText, join(read(queryText), read(ch)))
                      changeVariableBy(queryPos, 1)
                    },
                  )
                },
              )
            })

            ifThen(
              and(
                lt(read(queryPos), add(read(queryLen), 1)),
                equals(letterOf(read(queryPos), read(rawQuery)), '|'),
              ),
              () => {
                changeVariableBy(queryPos, 1)
              },
            )

            ifThen(equals(read(queryText), ''), () => {
              setVariableTo(queryError, 1)
            })

            ifThen(equals(read(queryError), 0), () => {
              setVariableTo(queryPos, 1)
              setVariableTo(queryLen, length(read(queryText)))

              forEach(j, add(read(queryLen), 2), () => {
                ifThen(
                  and(
                    equals(read(queryError), 0),
                    lt(read(queryPos), add(read(queryLen), 1)),
                  ),
                  () => {
                    setVariableTo(ch, letterOf(read(queryPos), read(queryText)))

                    ifElse(
                      equals(read(ch), '.'),
                      () => {
                        ifElse(
                          equals(
                            letterOf(add(read(queryPos), 1), read(queryText)),
                            '.',
                          ),
                          () => {
                            // Recursive descent: `..` and `..key`
                            changeVariableBy(queryPos, 2)
                            setVariableTo(token, '')
                            setVariableTo(tokenDone, 0)

                            forEach(k, add(read(queryLen), 2), () => {
                              ifThen(
                                and(
                                  equals(read(tokenDone), 0),
                                  lt(read(queryPos), add(read(queryLen), 1)),
                                ),
                                () => {
                                  setVariableTo(
                                    ch,
                                    letterOf(read(queryPos), read(queryText)),
                                  )
                                  ifElse(
                                    or(
                                      equals(read(ch), '.'),
                                      equals(read(ch), '['),
                                    ),
                                    () => {
                                      setVariableTo(tokenDone, 1)
                                    },
                                    () => {
                                      setVariableTo(
                                        token,
                                        join(read(token), read(ch)),
                                      )
                                      changeVariableBy(queryPos, 1)
                                    },
                                  )
                                },
                              )
                            })

                            deleteAllOfList(queryNextNodes)
                            forEach(k, lengthOfList(queryNodes), () => {
                              addToList(
                                queryNextNodes,
                                getItemOfList(queryNodes, read(k)),
                              )
                            })

                            setVariableTo(nodeCount, lengthOfList(nodeType))
                            // Closure over descendants.
                            forEach(j, read(nodeCount), () => {
                              forEach(k, read(nodeCount), () => {
                                setVariableTo(
                                  tempIndex,
                                  getItemOfList(nodeParent, read(k)),
                                )
                                ifThen(gt(read(tempIndex), 0), () => {
                                  setVariableTo(found, 0)
                                  forEach(
                                    j,
                                    lengthOfList(queryNextNodes),
                                    () => {
                                      ifThen(
                                        equals(
                                          getItemOfList(
                                            queryNextNodes,
                                            read(j),
                                          ),
                                          read(tempIndex),
                                        ),
                                        () => {
                                          setVariableTo(found, 1)
                                        },
                                      )
                                    },
                                  )

                                  ifThen(equals(read(found), 1), () => {
                                    setVariableTo(tokenDone, 0)
                                    forEach(
                                      j,
                                      lengthOfList(queryNextNodes),
                                      () => {
                                        ifThen(
                                          equals(
                                            getItemOfList(
                                              queryNextNodes,
                                              read(j),
                                            ),
                                            read(k),
                                          ),
                                          () => {
                                            setVariableTo(tokenDone, 1)
                                          },
                                        )
                                      },
                                    )
                                    ifThen(equals(read(tokenDone), 0), () => {
                                      addToList(queryNextNodes, read(k))
                                    })
                                  })
                                })
                              })
                            })

                            ifElse(
                              equals(read(token), ''),
                              () => {
                                deleteAllOfList(queryNodes)
                                forEach(k, lengthOfList(queryNextNodes), () => {
                                  addToList(
                                    queryNodes,
                                    getItemOfList(queryNextNodes, read(k)),
                                  )
                                })
                              },
                              () => {
                                deleteAllOfList(queryNodes)
                                forEach(k, lengthOfList(queryNextNodes), () => {
                                  setVariableTo(
                                    currentNode,
                                    getItemOfList(queryNextNodes, read(k)),
                                  )
                                  ifThen(
                                    equals(
                                      getItemOfList(nodeKey, read(currentNode)),
                                      read(token),
                                    ),
                                    () => {
                                      addToList(queryNodes, read(currentNode))
                                    },
                                  )
                                })
                              },
                            )
                          },
                          () => {
                            changeVariableBy(queryPos, 1)
                            setVariableTo(token, '')
                            setVariableTo(tokenDone, 0)

                            forEach(k, add(read(queryLen), 2), () => {
                              ifThen(
                                and(
                                  equals(read(tokenDone), 0),
                                  lt(read(queryPos), add(read(queryLen), 1)),
                                ),
                                () => {
                                  setVariableTo(
                                    ch,
                                    letterOf(read(queryPos), read(queryText)),
                                  )
                                  ifElse(
                                    or(
                                      equals(read(ch), '.'),
                                      equals(read(ch), '['),
                                    ),
                                    () => {
                                      setVariableTo(tokenDone, 1)
                                    },
                                    () => {
                                      setVariableTo(
                                        token,
                                        join(read(token), read(ch)),
                                      )
                                      changeVariableBy(queryPos, 1)
                                    },
                                  )
                                },
                              )
                            })

                            ifThen(not(equals(read(token), '')), () => {
                              deleteAllOfList(queryNextNodes)
                              setVariableTo(nodeCount, lengthOfList(nodeType))
                              forEach(k, lengthOfList(queryNodes), () => {
                                setVariableTo(
                                  currentNode,
                                  getItemOfList(queryNodes, read(k)),
                                )
                                forEach(j, read(nodeCount), () => {
                                  ifThen(
                                    and(
                                      equals(
                                        getItemOfList(nodeParent, read(j)),
                                        read(currentNode),
                                      ),
                                      equals(
                                        getItemOfList(nodeKey, read(j)),
                                        read(token),
                                      ),
                                    ),
                                    () => {
                                      addToList(queryNextNodes, read(j))
                                    },
                                  )
                                })
                              })

                              deleteAllOfList(queryNodes)
                              forEach(k, lengthOfList(queryNextNodes), () => {
                                addToList(
                                  queryNodes,
                                  getItemOfList(queryNextNodes, read(k)),
                                )
                              })
                            })
                          },
                        )
                      },
                      () => {
                        ifElse(
                          equals(read(ch), '['),
                          () => {
                            changeVariableBy(queryPos, 1)
                            ifThen(gt(read(queryPos), read(queryLen)), () => {
                              setVariableTo(queryError, 1)
                            })

                            ifThen(equals(read(queryError), 0), () => {
                              setVariableTo(
                                ch,
                                letterOf(read(queryPos), read(queryText)),
                              )

                              ifElse(
                                equals(read(ch), ']'),
                                () => {
                                  // Wildcard children: `[]`
                                  changeVariableBy(queryPos, 1)
                                  deleteAllOfList(queryNextNodes)
                                  setVariableTo(
                                    nodeCount,
                                    lengthOfList(nodeType),
                                  )
                                  forEach(k, lengthOfList(queryNodes), () => {
                                    setVariableTo(
                                      currentNode,
                                      getItemOfList(queryNodes, read(k)),
                                    )
                                    forEach(j, read(nodeCount), () => {
                                      ifThen(
                                        equals(
                                          getItemOfList(nodeParent, read(j)),
                                          read(currentNode),
                                        ),
                                        () => {
                                          addToList(queryNextNodes, read(j))
                                        },
                                      )
                                    })
                                  })

                                  deleteAllOfList(queryNodes)
                                  forEach(
                                    k,
                                    lengthOfList(queryNextNodes),
                                    () => {
                                      addToList(
                                        queryNodes,
                                        getItemOfList(queryNextNodes, read(k)),
                                      )
                                    },
                                  )
                                },
                                () => {
                                  ifElse(
                                    equals(read(ch), '"'),
                                    () => {
                                      changeVariableBy(queryPos, 1)
                                      setVariableTo(token, '')
                                      setVariableTo(tokenDone, 0)

                                      forEach(k, add(read(queryLen), 2), () => {
                                        ifThen(
                                          and(
                                            equals(read(tokenDone), 0),
                                            lt(
                                              read(queryPos),
                                              add(read(queryLen), 1),
                                            ),
                                          ),
                                          () => {
                                            setVariableTo(
                                              ch,
                                              letterOf(
                                                read(queryPos),
                                                read(queryText),
                                              ),
                                            )
                                            ifElse(
                                              equals(read(ch), '"'),
                                              () => {
                                                setVariableTo(tokenDone, 1)
                                                changeVariableBy(queryPos, 1)
                                              },
                                              () => {
                                                setVariableTo(
                                                  token,
                                                  join(read(token), read(ch)),
                                                )
                                                changeVariableBy(queryPos, 1)
                                              },
                                            )
                                          },
                                        )
                                      })

                                      ifThen(
                                        not(
                                          equals(
                                            letterOf(
                                              read(queryPos),
                                              read(queryText),
                                            ),
                                            ']',
                                          ),
                                        ),
                                        () => {
                                          setVariableTo(queryError, 1)
                                        },
                                      )
                                      ifThen(
                                        equals(read(queryError), 0),
                                        () => {
                                          changeVariableBy(queryPos, 1)
                                          deleteAllOfList(queryNextNodes)
                                          setVariableTo(
                                            nodeCount,
                                            lengthOfList(nodeType),
                                          )
                                          forEach(
                                            k,
                                            lengthOfList(queryNodes),
                                            () => {
                                              setVariableTo(
                                                currentNode,
                                                getItemOfList(
                                                  queryNodes,
                                                  read(k),
                                                ),
                                              )
                                              forEach(
                                                i,
                                                read(nodeCount),
                                                () => {
                                                  ifThen(
                                                    and(
                                                      equals(
                                                        getItemOfList(
                                                          nodeParent,
                                                          read(i),
                                                        ),
                                                        read(currentNode),
                                                      ),
                                                      equals(
                                                        getItemOfList(
                                                          nodeKey,
                                                          read(i),
                                                        ),
                                                        read(token),
                                                      ),
                                                    ),
                                                    () => {
                                                      addToList(
                                                        queryNextNodes,
                                                        read(i),
                                                      )
                                                    },
                                                  )
                                                },
                                              )
                                            },
                                          )

                                          deleteAllOfList(queryNodes)
                                          forEach(
                                            k,
                                            lengthOfList(queryNextNodes),
                                            () => {
                                              addToList(
                                                queryNodes,
                                                getItemOfList(
                                                  queryNextNodes,
                                                  read(k),
                                                ),
                                              )
                                            },
                                          )
                                        },
                                      )
                                    },
                                    () => {
                                      setVariableTo(numberBuffer, '')
                                      setVariableTo(tokenDone, 0)

                                      forEach(k, add(read(queryLen), 2), () => {
                                        ifThen(
                                          and(
                                            equals(read(tokenDone), 0),
                                            lt(
                                              read(queryPos),
                                              add(read(queryLen), 1),
                                            ),
                                          ),
                                          () => {
                                            setVariableTo(
                                              ch,
                                              letterOf(
                                                read(queryPos),
                                                read(queryText),
                                              ),
                                            )
                                            ifElse(
                                              equals(read(ch), ']'),
                                              () => {
                                                setVariableTo(tokenDone, 1)
                                              },
                                              () => {
                                                ifElse(
                                                  contains(
                                                    '0123456789',
                                                    read(ch),
                                                  ),
                                                  () => {
                                                    setVariableTo(
                                                      numberBuffer,
                                                      join(
                                                        read(numberBuffer),
                                                        read(ch),
                                                      ),
                                                    )
                                                    changeVariableBy(
                                                      queryPos,
                                                      1,
                                                    )
                                                  },
                                                  () => {
                                                    setVariableTo(queryError, 1)
                                                  },
                                                )
                                              },
                                            )
                                          },
                                        )
                                      })

                                      ifThen(
                                        or(
                                          equals(read(numberBuffer), ''),
                                          not(
                                            equals(
                                              letterOf(
                                                read(queryPos),
                                                read(queryText),
                                              ),
                                              ']',
                                            ),
                                          ),
                                        ),
                                        () => {
                                          setVariableTo(queryError, 1)
                                        },
                                      )
                                      ifThen(
                                        equals(read(queryError), 0),
                                        () => {
                                          changeVariableBy(queryPos, 1)
                                          deleteAllOfList(queryNextNodes)
                                          setVariableTo(
                                            nodeCount,
                                            lengthOfList(nodeType),
                                          )
                                          forEach(
                                            k,
                                            lengthOfList(queryNodes),
                                            () => {
                                              setVariableTo(
                                                currentNode,
                                                getItemOfList(
                                                  queryNodes,
                                                  read(k),
                                                ),
                                              )
                                              forEach(
                                                i,
                                                read(nodeCount),
                                                () => {
                                                  ifThen(
                                                    and(
                                                      equals(
                                                        getItemOfList(
                                                          nodeParent,
                                                          read(i),
                                                        ),
                                                        read(currentNode),
                                                      ),
                                                      equals(
                                                        getItemOfList(
                                                          nodeIndex,
                                                          read(i),
                                                        ),
                                                        add(
                                                          read(numberBuffer),
                                                          1,
                                                        ),
                                                      ),
                                                    ),
                                                    () => {
                                                      addToList(
                                                        queryNextNodes,
                                                        read(i),
                                                      )
                                                    },
                                                  )
                                                },
                                              )
                                            },
                                          )

                                          deleteAllOfList(queryNodes)
                                          forEach(
                                            k,
                                            lengthOfList(queryNextNodes),
                                            () => {
                                              addToList(
                                                queryNodes,
                                                getItemOfList(
                                                  queryNextNodes,
                                                  read(k),
                                                ),
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
                          },
                          () => {
                            setVariableTo(queryError, 1)
                          },
                        )
                      },
                    )

                    ifThen(
                      and(
                        equals(read(queryError), 0),
                        equals(lengthOfList(queryNodes), 0),
                      ),
                      () => {
                        setVariableTo(queryError, 1)
                      },
                    )
                  },
                )
              })
            })

            // Restore raw-query length for the outer pipe loop.
            setVariableTo(queryLen, length(read(rawQuery)))
          },
        )
      })

      ifThen(
        and(equals(read(queryError), 0), gt(lengthOfList(queryNodes), 0)),
        () => {
          forEach(i, lengthOfList(queryNodes), () => {
            setVariableTo(currentNode, getItemOfList(queryNodes, read(i)))
            setVariableTo(startPos, getItemOfList(nodeStart, read(currentNode)))
            setVariableTo(endPos, getItemOfList(nodeEnd, read(currentNode)))
            setVariableTo(resultBuffer, '')
            setVariableTo(tempIndex, read(startPos))
            forEach(j, add(read(len), 2), () => {
              ifThen(not(gt(read(tempIndex), read(endPos))), () => {
                setVariableTo(
                  resultBuffer,
                  join(
                    read(resultBuffer),
                    letterOf(read(tempIndex), read(sourceText)),
                  ),
                )
                changeVariableBy(tempIndex, 1)
              })
            })
            addToList(queryResult, read(resultBuffer))
          })
        },
      )

      ifThen(
        or(equals(read(queryError), 1), equals(lengthOfList(queryResult), 0)),
        () => {
          deleteAllOfList(queryResult)
          setVariableTo(queryError, 1)
        },
      )

      ifThen(equals(read(queryError), 1), () => {
        ifElse(
          equals(read(parseOk), 0),
          () => {
            addToList(
              queryResult,
              join('ERROR: parse failed ', read(errorCode)),
            )
          },
          () => {
            addToList(queryResult, 'ERROR: invalid query')
          },
        )
      })
    },
    true,
  )

  whenFlagClicked(() => {
    showList(queryResult)
    // Sample JSON data to parse
    const sampleJSON = JSON.stringify({
      meta: {
        version: '1.0',
        generatedAt: '2026-02-10T20:00:00+09:00',
        source: {
          name: 'example-generator',
          flags: ['demo', 'stress-test'],
          checksum: {
            algo: 'sha256',
            value: 'a3f1c6e2deadbeef',
          },
        },
      },
      users: [
        {
          id: 'u_001',
          profile: {
            displayName: 'Alice',
            age: 29,
            contacts: [
              { type: 'email', value: 'alice@example.com', verified: true },
              { type: 'phone', value: null, verified: false },
            ],
            preferences: {
              theme: 'dark',
              language: 'ja',
              experimental: {
                newDashboard: true,
                rankingModel: 'v3',
              },
            },
          },
          roles: ['admin', 'editor'],
          lastLogin: '2026-02-09T12:34:56+09:00',
        },
        {
          id: 'u_002',
          profile: {
            displayName: 'Bob',
            age: null,
            contacts: [],
            preferences: {},
          },
          roles: ['viewer'],
          lastLogin: null,
        },
      ],
      projects: [
        {
          id: 'p_alpha',
          ownerId: 'u_001',
          members: ['u_001', 'u_002'],
          tasks: [
            {
              id: 't1',
              title: 'Design schema',
              status: 'done',
              estimate: { unit: 'hour', value: 5.5 },
              tags: ['backend', 'api'],
              history: [
                {
                  at: '2026-02-08T10:00:00+09:00',
                  by: 'u_001',
                  action: 'create',
                },
                {
                  at: '2026-02-08T12:00:00+09:00',
                  by: 'u_002',
                  action: 'review',
                },
              ],
            },
            {
              id: 't2',
              title: 'Implement parser',
              status: 'running',
              estimate: { unit: 'hour', value: 12 },
              tags: [],
              history: [],
            },
          ],
          settings: {
            visibility: 'private',
            limits: {
              storageMB: 1024,
              rate: {
                perMinute: 120,
                burst: 300,
              },
            },
          },
        },
      ],
      featureMatrix: {
        beta: {
          enabledUsers: ['u_001'],
          rollout: 0.25,
        },
        legacy: false,
      },
      misc: [
        42,
        'text',
        null,
        { freeform: [1, 2, { deep: ['a', 'b', { x: true }] }] },
      ],
    })
    // Parse the JSON
    callProcedure(parseProcedure, {
      jsonText: sampleJSON,
    })
    // Query the data (examples)
    // Get name: .name
    callProcedure(getProcedure, {
      query: '.meta',
    })
  })
})

export { getProcCode, parseProcCode, queryResult }
export default project
