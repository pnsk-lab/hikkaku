import { Project, type ListReference, type VariableReference } from 'hikkaku'
import {
	add,
	addToList,
	and,
	askAndWait,
	callProcedure,
	changeVariableBy,
	contains,
	defineProcedure,
	deleteAllOfList,
	deleteOfList,
	divide,
	equals,
	getAnswer,
	getItemOfList,
	getTimer,
	getVariable,
	gt,
	ifElse,
	ifThen,
	insertAtList,
	join,
	length,
	lengthOfList,
	letterOf,
	lt,
	mathop,
	mod,
	multiply,
	not,
	or,
	procedureLabel,
	repeatUntil,
	replaceItemOfList,
	resetTimer,
	round,
	setVariableTo,
	showVariable,
	subtract,
	whenFlagClicked,
} from 'hikkaku/blocks'

const BASE = 10000
const CHUNK_WIDTH = 4
const DIGITS = '0123456789'

const project = new Project()
const stage = project.stage

const read = (variable: VariableReference) => getVariable(variable)

const description = stage.createVariable(
	'description',
	'Exact bigint for Scratch: base-10000 chunks + warp procedures. Division is truncating quotient with remainder having the dividend sign.',
	{
		monitor: {
			mode: 'large',
			visible: true,
			x: 10,
			y: 10,
		},
	},
)

const leftInput = stage.createVariable(
	'left',
	'3141592653589793238462643383279502884197169399375105820974944592',
	{
		monitor: {
			mode: 'default',
			visible: true,
			x: 10,
			y: 70,
		},
	},
)

const operation = stage.createVariable('op', '*', {
	monitor: {
		mode: 'default',
		visible: true,
		x: 10,
		y: 100,
	},
})

const rightInput = stage.createVariable(
	'right',
	'2718281828459045235360287471352662497757247093699959574966967627',
	{
		monitor: {
			mode: 'default',
			visible: true,
			x: 10,
			y: 130,
		},
	},
)

const result = stage.createVariable('result', '', {
	monitor: {
		mode: 'large',
		visible: true,
		x: 10,
		y: 170,
	},
})

const remainder = stage.createVariable('remainder', '', {
	monitor: {
		mode: 'large',
		visible: true,
		x: 10,
		y: 230,
	},
})

const status = stage.createVariable('status', 'Ready', {
	monitor: {
		mode: 'default',
		visible: true,
		x: 10,
		y: 290,
	},
})

const elapsedMs = stage.createVariable('elapsedMs', 0, {
	monitor: {
		mode: 'default',
		visible: true,
		x: 10,
		y: 320,
	},
})

const avgMs = stage.createVariable('avgMs', 0, {
	monitor: {
		mode: 'default',
		visible: true,
		x: 10,
		y: 350,
	},
})

const leftDigitsView = stage.createVariable('leftDigits', 0, {
	monitor: {
		mode: 'default',
		visible: true,
		x: 10,
		y: 380,
	},
})

const rightDigitsView = stage.createVariable('rightDigits', 0, {
	monitor: {
		mode: 'default',
		visible: true,
		x: 10,
		y: 410,
	},
})

const resultDigitsView = stage.createVariable('resultDigits', 0, {
	monitor: {
		mode: 'default',
		visible: true,
		x: 10,
		y: 440,
	},
})

const benchmarkMode = stage.createVariable('benchmarkMode', 'manual', {
	monitor: {
		mode: 'default',
		visible: true,
		x: 10,
		y: 470,
	},
})

const benchmarkDigits = stage.createVariable('benchmarkDigits', 256, {
	monitor: {
		mode: 'default',
		visible: true,
		x: 10,
		y: 500,
	},
})

const benchmarkRepeats = stage.createVariable('benchmarkRepeats', 3, {
	monitor: {
		mode: 'default',
		visible: true,
		x: 10,
		y: 530,
	},
})

const benchmarkSeed = stage.createVariable('benchmarkSeed', 20260312, {
	monitor: {
		mode: 'default',
		visible: true,
		x: 10,
		y: 560,
	},
})

const benchmarkAccuracy = stage.createVariable('benchmarkAccuracy', 'exact', {
	monitor: {
		mode: 'default',
		visible: true,
		x: 10,
		y: 590,
	},
})

const benchmarkResultDigits = stage.createVariable('benchmarkResultDigits', 0)

const benchmarkReport = stage.createVariable('benchmarkReport', '', {
	monitor: {
		mode: 'large',
		visible: true,
		x: 280,
		y: 10,
	},
})

const leftMag = stage.createVariable('leftMag', '0')
const rightMag = stage.createVariable('rightMag', '0')
const leftSign = stage.createVariable('leftSign', 1)
const rightSign = stage.createVariable('rightSign', 1)
const effectiveRightSign = stage.createVariable('effectiveRightSign', 1)
const resultSign = stage.createVariable('resultSign', 1)
const inputValid = stage.createVariable('inputValid', 1)
const cmp = stage.createVariable('cmp', 0)
const carry = stage.createVariable('carry', 0)
const borrow = stage.createVariable('borrow', 0)
const i = stage.createVariable('i', 0)
const j = stage.createVariable('j', 0)
const k = stage.createVariable('k', 0)
const startIndex = stage.createVariable('startIndex', 0)
const value = stage.createVariable('value', 0)
const low = stage.createVariable('low', 0)
const high = stage.createVariable('high', 0)
const mid = stage.createVariable('mid', 0)
const candidate = stage.createVariable('candidate', 0)
const trial = stage.createVariable('trial', 0)
const chunkText = stage.createVariable('chunkText', '')
const generatorState = stage.createVariable('generatorState', 1)
const repeatCounter = stage.createVariable('repeatCounter', 0)
const fftSize = stage.createVariable('fftSize', 0)
const fftLen = stage.createVariable('fftLen', 0)
const fftHalf = stage.createVariable('fftHalf', 0)
const fftIndex = stage.createVariable('fftIndex', 0)
const fftJIndex = stage.createVariable('fftJIndex', 0)
const fftBit = stage.createVariable('fftBit', 0)
const fftPartner = stage.createVariable('fftPartner', 0)
const fftIndex2 = stage.createVariable('fftIndex2', 0)
const fftAngle = stage.createVariable('fftAngle', 0)
const fftInverse = stage.createVariable('fftInverse', 0)
const fftWlenReal = stage.createVariable('fftWlenReal', 0)
const fftWlenImag = stage.createVariable('fftWlenImag', 0)
const fftWReal = stage.createVariable('fftWReal', 0)
const fftWImag = stage.createVariable('fftWImag', 0)
const fftUReal = stage.createVariable('fftUReal', 0)
const fftUImag = stage.createVariable('fftUImag', 0)
const fftVReal = stage.createVariable('fftVReal', 0)
const fftVImag = stage.createVariable('fftVImag', 0)
const fftTempReal = stage.createVariable('fftTempReal', 0)
const fftTempImag = stage.createVariable('fftTempImag', 0)

const aChunks = stage.createList('aChunks')
const bChunks = stage.createList('bChunks')
const resultChunks = stage.createList('resultChunks')
const quotientChunks = stage.createList('quotientChunks')
const remainderChunks = stage.createList('remainderChunks')
const tmpChunks = stage.createList('tmpChunks')
const fftRealA = stage.createList('fftRealA')
const fftImagA = stage.createList('fftImagA')
const fftRealB = stage.createList('fftRealB')
const fftImagB = stage.createList('fftImagB')
const productDigits = stage.createList('productDigits')

stage.run(() => {
	const defineWarp = (label: string, body: () => void) => {
		return defineProcedure([procedureLabel(label)], () => {
			body()
			return undefined
		}, true)
	}

	const defineTrimList = (label: string, list: ListReference) => {
		return defineWarp(label, () => {
			repeatUntil(
				or(
					equals(lengthOfList(list), 1),
					not(equals(getItemOfList(list, lengthOfList(list)), 0)),
				),
				() => {
					deleteOfList(list, lengthOfList(list))
				},
			)
		})
	}

	const trimResult = defineTrimList('trim result chunks', resultChunks)
	const trimQuotient = defineTrimList('trim quotient chunks', quotientChunks)
	const trimRemainder = defineTrimList('trim remainder chunks', remainderChunks)
	const trimTmp = defineTrimList('trim tmp chunks', tmpChunks)
	const trimProductDigits = defineTrimList('trim product digits', productDigits)

	const defineListToText = (
		label: string,
		list: ListReference,
		out: VariableReference,
		trimProcedure: ReturnType<typeof defineWarp>,
	) => {
		return defineWarp(label, () => {
			callProcedure(trimProcedure, {})
			setVariableTo(out, '')
			setVariableTo(i, lengthOfList(list))
			repeatUntil(lt(read(i), 1), () => {
				setVariableTo(chunkText, getItemOfList(list, read(i)))
				ifElse(
					equals(read(out), ''),
					() => {
						setVariableTo(out, read(chunkText))
					},
					() => {
						ifThen(equals(length(read(chunkText)), 1), () => {
							setVariableTo(chunkText, join('000', read(chunkText)))
						})
						ifThen(equals(length(read(chunkText)), 2), () => {
							setVariableTo(chunkText, join('00', read(chunkText)))
						})
						ifThen(equals(length(read(chunkText)), 3), () => {
							setVariableTo(chunkText, join('0', read(chunkText)))
						})
						setVariableTo(out, join(read(out), read(chunkText)))
					},
				)
				changeVariableBy(i, -1)
			})
		})
	}

	const resultToText = defineListToText(
		'result chunks to text',
		resultChunks,
		result,
		trimResult,
	)
	const quotientToText = defineListToText(
		'quotient chunks to text',
		quotientChunks,
		result,
		trimQuotient,
	)
	const remainderToText = defineListToText(
		'remainder chunks to text',
		remainderChunks,
		remainder,
		trimRemainder,
	)

	const digitsToText = defineWarp('product digits to text', () => {
		callProcedure(trimProductDigits, {})
		setVariableTo(result, '')
		setVariableTo(i, lengthOfList(productDigits))
		repeatUntil(lt(read(i), 1), () => {
			setVariableTo(result, join(read(result), getItemOfList(productDigits, read(i))))
			changeVariableBy(i, -1)
		})
	})

	const measureProductDigits = defineWarp('measure product digits', () => {
		callProcedure(trimProductDigits, {})
		setVariableTo(benchmarkResultDigits, lengthOfList(productDigits))
		ifThen(lt(read(benchmarkResultDigits), 1), () => {
			setVariableTo(benchmarkResultDigits, 1)
		})
	})

	const defineLoadDigits = (
		label: string,
		text: VariableReference,
		realList: ListReference,
		imagList: ListReference,
	) => {
		return defineWarp(label, () => {
			deleteAllOfList(realList)
			deleteAllOfList(imagList)
			setVariableTo(i, length(read(text)))
			repeatUntil(lt(read(i), 1), () => {
				addToList(realList, letterOf(read(i), read(text)))
				addToList(imagList, 0)
				changeVariableBy(i, -1)
			})
		})
	}

	const loadLeftDigits = defineLoadDigits(
		'load left digits',
		leftMag,
		fftRealA,
		fftImagA,
	)
	const loadRightDigits = defineLoadDigits(
		'load right digits',
		rightMag,
		fftRealB,
		fftImagB,
	)

	const definePadComplexLists = (
		label: string,
		realList: ListReference,
		imagList: ListReference,
	) => {
		return defineWarp(label, () => {
			repeatUntil(equals(lengthOfList(realList), read(fftSize)), () => {
				addToList(realList, 0)
				addToList(imagList, 0)
			})
		})
	}

	const padLeftDigits = definePadComplexLists(
		'pad left digits',
		fftRealA,
		fftImagA,
	)
	const padRightDigits = definePadComplexLists(
		'pad right digits',
		fftRealB,
		fftImagB,
	)

	const defineFft = (
		label: string,
		realList: ListReference,
		imagList: ListReference,
	) => {
		return defineWarp(label, () => {
			setVariableTo(fftJIndex, 0)
			setVariableTo(fftIndex, 1)
			repeatUntil(gt(read(fftIndex), subtract(read(fftSize), 1)), () => {
				setVariableTo(fftBit, divide(read(fftSize), 2))
				repeatUntil(
					or(lt(read(fftBit), 1), lt(read(fftJIndex), read(fftBit))),
					() => {
						setVariableTo(fftJIndex, subtract(read(fftJIndex), read(fftBit)))
						setVariableTo(
							fftBit,
							mathop('floor', divide(read(fftBit), 2)),
						)
					},
				)
				setVariableTo(fftJIndex, add(read(fftJIndex), read(fftBit)))
				ifThen(lt(read(fftIndex), read(fftJIndex)), () => {
					setVariableTo(fftTempReal, getItemOfList(realList, add(read(fftIndex), 1)))
					setVariableTo(fftTempImag, getItemOfList(imagList, add(read(fftIndex), 1)))
					replaceItemOfList(
						realList,
						add(read(fftIndex), 1),
						getItemOfList(realList, add(read(fftJIndex), 1)),
					)
					replaceItemOfList(
						imagList,
						add(read(fftIndex), 1),
						getItemOfList(imagList, add(read(fftJIndex), 1)),
					)
					replaceItemOfList(realList, add(read(fftJIndex), 1), read(fftTempReal))
					replaceItemOfList(imagList, add(read(fftJIndex), 1), read(fftTempImag))
				})
				changeVariableBy(fftIndex, 1)
			})

			setVariableTo(fftLen, 2)
			repeatUntil(gt(read(fftLen), read(fftSize)), () => {
				setVariableTo(fftHalf, divide(read(fftLen), 2))
				ifElse(
					equals(read(fftInverse), 1),
					() => {
						setVariableTo(fftAngle, divide(360, read(fftLen)))
					},
					() => {
						setVariableTo(fftAngle, multiply(-1, divide(360, read(fftLen))))
					},
				)
				setVariableTo(fftWlenReal, mathop('cos', read(fftAngle)))
				setVariableTo(fftWlenImag, mathop('sin', read(fftAngle)))
				setVariableTo(fftIndex, 0)
				repeatUntil(gt(read(fftIndex), subtract(read(fftSize), 1)), () => {
					setVariableTo(fftWReal, 1)
					setVariableTo(fftWImag, 0)
					setVariableTo(fftJIndex, 0)
					repeatUntil(gt(read(fftJIndex), subtract(read(fftHalf), 1)), () => {
						setVariableTo(fftIndex2, add(read(fftIndex), read(fftJIndex)))
						setVariableTo(fftPartner, add(read(fftIndex2), read(fftHalf)))
						setVariableTo(
							fftUReal,
							getItemOfList(realList, add(read(fftIndex2), 1)),
						)
						setVariableTo(
							fftUImag,
							getItemOfList(imagList, add(read(fftIndex2), 1)),
						)
						setVariableTo(
							fftVReal,
							subtract(
								multiply(getItemOfList(realList, add(read(fftPartner), 1)), read(fftWReal)),
								multiply(getItemOfList(imagList, add(read(fftPartner), 1)), read(fftWImag)),
							),
						)
						setVariableTo(
							fftVImag,
							add(
								multiply(getItemOfList(realList, add(read(fftPartner), 1)), read(fftWImag)),
								multiply(getItemOfList(imagList, add(read(fftPartner), 1)), read(fftWReal)),
							),
						)
						replaceItemOfList(
							realList,
							add(read(fftIndex2), 1),
							add(read(fftUReal), read(fftVReal)),
						)
						replaceItemOfList(
							imagList,
							add(read(fftIndex2), 1),
							add(read(fftUImag), read(fftVImag)),
						)
						replaceItemOfList(
							realList,
							add(read(fftPartner), 1),
							subtract(read(fftUReal), read(fftVReal)),
						)
						replaceItemOfList(
							imagList,
							add(read(fftPartner), 1),
							subtract(read(fftUImag), read(fftVImag)),
						)
						setVariableTo(
							fftTempReal,
							subtract(
								multiply(read(fftWReal), read(fftWlenReal)),
								multiply(read(fftWImag), read(fftWlenImag)),
							),
						)
						setVariableTo(
							fftTempImag,
							add(
								multiply(read(fftWReal), read(fftWlenImag)),
								multiply(read(fftWImag), read(fftWlenReal)),
							),
						)
						setVariableTo(fftWReal, read(fftTempReal))
						setVariableTo(fftWImag, read(fftTempImag))
						changeVariableBy(fftJIndex, 1)
					})
					changeVariableBy(fftIndex, read(fftLen))
				})
				setVariableTo(fftLen, multiply(read(fftLen), 2))
			})

			ifThen(equals(read(fftInverse), 1), () => {
				setVariableTo(fftIndex, 0)
				repeatUntil(gt(read(fftIndex), subtract(read(fftSize), 1)), () => {
					replaceItemOfList(
						realList,
						add(read(fftIndex), 1),
						divide(getItemOfList(realList, add(read(fftIndex), 1)), read(fftSize)),
					)
					replaceItemOfList(
						imagList,
						add(read(fftIndex), 1),
						divide(getItemOfList(imagList, add(read(fftIndex), 1)), read(fftSize)),
					)
					changeVariableBy(fftIndex, 1)
				})
			})
		})
	}

	const fftLeft = defineFft('fft left', fftRealA, fftImagA)
	const fftRight = defineFft('fft right', fftRealB, fftImagB)

	const fftMultiplyDigits = defineWarp('fft multiply digits', () => {
		callProcedure(loadLeftDigits, {})
		callProcedure(loadRightDigits, {})
		setVariableTo(fftSize, 1)
		repeatUntil(
			not(lt(read(fftSize), add(lengthOfList(fftRealA), lengthOfList(fftRealB)))),
			() => {
				setVariableTo(fftSize, multiply(read(fftSize), 2))
			},
		)
		callProcedure(padLeftDigits, {})
		callProcedure(padRightDigits, {})

		setVariableTo(fftInverse, 0)
		callProcedure(fftLeft, {})
		callProcedure(fftRight, {})

		setVariableTo(fftIndex, 1)
		repeatUntil(gt(read(fftIndex), read(fftSize)), () => {
			setVariableTo(fftUReal, getItemOfList(fftRealA, read(fftIndex)))
			setVariableTo(fftUImag, getItemOfList(fftImagA, read(fftIndex)))
			setVariableTo(fftVReal, getItemOfList(fftRealB, read(fftIndex)))
			setVariableTo(fftVImag, getItemOfList(fftImagB, read(fftIndex)))
			replaceItemOfList(
				fftRealA,
				read(fftIndex),
				subtract(
					multiply(read(fftUReal), read(fftVReal)),
					multiply(read(fftUImag), read(fftVImag)),
				),
			)
			replaceItemOfList(
				fftImagA,
				read(fftIndex),
				add(
					multiply(read(fftUReal), read(fftVImag)),
					multiply(read(fftUImag), read(fftVReal)),
				),
			)
			changeVariableBy(fftIndex, 1)
		})

		setVariableTo(fftInverse, 1)
		callProcedure(fftLeft, {})

		deleteAllOfList(productDigits)
		setVariableTo(carry, 0)
		setVariableTo(fftIndex, 1)
		repeatUntil(
			and(gt(read(fftIndex), read(fftSize)), equals(read(carry), 0)),
			() => {
				setVariableTo(value, read(carry))
				ifThen(not(gt(read(fftIndex), read(fftSize))), () => {
					setVariableTo(
						value,
						add(read(value), round(getItemOfList(fftRealA, read(fftIndex)))),
					)
				})
				addToList(productDigits, mod(read(value), 10))
				setVariableTo(carry, mathop('floor', divide(read(value), 10)))
				changeVariableBy(fftIndex, 1)
			},
		)
		ifThen(equals(lengthOfList(productDigits), 0), () => {
			addToList(productDigits, 0)
		})
		callProcedure(digitsToText, {})
	})

	const fftMultiplyDigitsFast = defineWarp('fft multiply digits fast', () => {
		callProcedure(loadLeftDigits, {})
		callProcedure(loadRightDigits, {})
		setVariableTo(fftSize, 1)
		repeatUntil(
			not(lt(read(fftSize), add(lengthOfList(fftRealA), lengthOfList(fftRealB)))),
			() => {
				setVariableTo(fftSize, multiply(read(fftSize), 2))
			},
		)
		callProcedure(padLeftDigits, {})
		callProcedure(padRightDigits, {})

		setVariableTo(fftInverse, 0)
		callProcedure(fftLeft, {})
		callProcedure(fftRight, {})

		setVariableTo(fftIndex, 1)
		repeatUntil(gt(read(fftIndex), read(fftSize)), () => {
			setVariableTo(fftUReal, getItemOfList(fftRealA, read(fftIndex)))
			setVariableTo(fftUImag, getItemOfList(fftImagA, read(fftIndex)))
			setVariableTo(fftVReal, getItemOfList(fftRealB, read(fftIndex)))
			setVariableTo(fftVImag, getItemOfList(fftImagB, read(fftIndex)))
			replaceItemOfList(
				fftRealA,
				read(fftIndex),
				subtract(
					multiply(read(fftUReal), read(fftVReal)),
					multiply(read(fftUImag), read(fftVImag)),
				),
			)
			replaceItemOfList(
				fftImagA,
				read(fftIndex),
				add(
					multiply(read(fftUReal), read(fftVImag)),
					multiply(read(fftUImag), read(fftVReal)),
				),
			)
			changeVariableBy(fftIndex, 1)
		})

		setVariableTo(fftInverse, 1)
		callProcedure(fftLeft, {})

		deleteAllOfList(productDigits)
		setVariableTo(carry, 0)
		setVariableTo(fftIndex, 1)
		repeatUntil(
			and(gt(read(fftIndex), read(fftSize)), equals(read(carry), 0)),
			() => {
				setVariableTo(value, read(carry))
				ifThen(not(gt(read(fftIndex), read(fftSize))), () => {
					setVariableTo(
						value,
						add(read(value), round(getItemOfList(fftRealA, read(fftIndex)))),
					)
				})
				addToList(productDigits, mod(read(value), 10))
				setVariableTo(carry, mathop('floor', divide(read(value), 10)))
				changeVariableBy(fftIndex, 1)
			},
		)
		ifThen(equals(lengthOfList(productDigits), 0), () => {
			addToList(productDigits, 0)
		})
		callProcedure(measureProductDigits, {})
	})

	const defineCompareLists = (
		label: string,
		leftList: ListReference,
		rightList: ListReference,
		leftTrim: ReturnType<typeof defineWarp>,
		rightTrim: ReturnType<typeof defineWarp>,
	) => {
		return defineWarp(label, () => {
			callProcedure(leftTrim, {})
			callProcedure(rightTrim, {})
			setVariableTo(cmp, 0)
			ifElse(
				gt(lengthOfList(leftList), lengthOfList(rightList)),
				() => {
					setVariableTo(cmp, 1)
				},
				() => {
					ifThen(lt(lengthOfList(leftList), lengthOfList(rightList)), () => {
						setVariableTo(cmp, -1)
					})
				},
			)
			ifThen(equals(read(cmp), 0), () => {
				setVariableTo(i, lengthOfList(leftList))
				repeatUntil(or(lt(read(i), 1), not(equals(read(cmp), 0))), () => {
					ifThen(
						gt(getItemOfList(leftList, read(i)), getItemOfList(rightList, read(i))),
						() => {
							setVariableTo(cmp, 1)
						},
					)
					ifThen(
						lt(getItemOfList(leftList, read(i)), getItemOfList(rightList, read(i))),
						() => {
							setVariableTo(cmp, -1)
						},
					)
					changeVariableBy(i, -1)
				})
			})
		})
	}

	const compareRemainderWithTmp = defineCompareLists(
		'compare remainder with tmp',
		remainderChunks,
		tmpChunks,
		trimRemainder,
		trimTmp,
	)

	const defineMeasureChunkDigits = (
		label: string,
		list: ListReference,
		trimProcedure: ReturnType<typeof defineWarp>,
	) => {
		return defineWarp(label, () => {
			callProcedure(trimProcedure, {})
			ifElse(
				and(equals(lengthOfList(list), 1), equals(getItemOfList(list, 1), 0)),
				() => {
					setVariableTo(benchmarkResultDigits, 1)
				},
				() => {
					setVariableTo(
						benchmarkResultDigits,
						add(
							multiply(subtract(lengthOfList(list), 1), CHUNK_WIDTH),
							length(getItemOfList(list, lengthOfList(list))),
						),
					)
				},
			)
		})
	}

	const measureResultChunkDigits = defineMeasureChunkDigits(
		'measure result chunk digits',
		resultChunks,
		trimResult,
	)
	const measureQuotientChunkDigits = defineMeasureChunkDigits(
		'measure quotient chunk digits',
		quotientChunks,
		trimQuotient,
	)

	const defineParseSigned = (
		label: string,
		sideName: string,
		input: VariableReference,
		mag: VariableReference,
		sign: VariableReference,
	) => {
		return defineWarp(label, () => {
			setVariableTo(sign, 1)
			setVariableTo(mag, '')
			setVariableTo(i, 1)
			ifThen(equals(length(read(input)), 0), () => {
				setVariableTo(inputValid, 0)
				setVariableTo(status, join(sideName, ' operand is empty'))
				setVariableTo(mag, '0')
			})
			ifThen(
				and(equals(read(inputValid), 1), equals(letterOf(1, read(input)), '-')),
				() => {
					setVariableTo(sign, -1)
					setVariableTo(i, 2)
				},
			)
			ifThen(
				and(equals(read(inputValid), 1), equals(letterOf(1, read(input)), '+')),
				() => {
					setVariableTo(sign, 1)
					setVariableTo(i, 2)
				},
			)
			ifThen(
				and(equals(read(inputValid), 1), gt(read(i), length(read(input)))),
				() => {
					setVariableTo(inputValid, 0)
					setVariableTo(status, join(sideName, ' operand has no digits'))
					setVariableTo(sign, 1)
					setVariableTo(mag, '0')
				},
			)
			repeatUntil(
				or(gt(read(i), length(read(input))), equals(read(inputValid), 0)),
				() => {
					setVariableTo(chunkText, letterOf(read(i), read(input)))
					ifElse(
						contains(DIGITS, read(chunkText)),
						() => {
							ifThen(
								or(not(equals(read(mag), '')), not(equals(read(chunkText), '0'))),
								() => {
									setVariableTo(mag, join(read(mag), read(chunkText)))
								},
							)
						},
						() => {
							setVariableTo(inputValid, 0)
							setVariableTo(
								status,
								join(join(sideName, ' operand is not an integer: '), read(input)),
							)
							setVariableTo(sign, 1)
							setVariableTo(mag, '0')
						},
					)
					changeVariableBy(i, 1)
				},
			)
			ifThen(and(equals(read(inputValid), 1), equals(read(mag), '')), () => {
				setVariableTo(sign, 1)
				setVariableTo(mag, '0')
			})
		})
	}

	const parseLeft = defineParseSigned(
		'parse left input',
		'left',
		leftInput,
		leftMag,
		leftSign,
	)
	const parseRight = defineParseSigned(
		'parse right input',
		'right',
		rightInput,
		rightMag,
		rightSign,
	)

	const compareMagnitudeText = defineWarp('compare left and right magnitude', () => {
		setVariableTo(cmp, 0)
		ifElse(
			gt(length(read(leftMag)), length(read(rightMag))),
			() => {
				setVariableTo(cmp, 1)
			},
			() => {
				ifThen(lt(length(read(leftMag)), length(read(rightMag))), () => {
					setVariableTo(cmp, -1)
				})
			},
		)
		ifThen(equals(read(cmp), 0), () => {
			setVariableTo(i, 1)
			repeatUntil(
				or(gt(read(i), length(read(leftMag))), not(equals(read(cmp), 0))),
				() => {
					ifThen(
						gt(letterOf(read(i), read(leftMag)), letterOf(read(i), read(rightMag))),
						() => {
							setVariableTo(cmp, 1)
						},
					)
					ifThen(
						lt(letterOf(read(i), read(leftMag)), letterOf(read(i), read(rightMag))),
						() => {
							setVariableTo(cmp, -1)
						},
					)
					changeVariableBy(i, 1)
				},
			)
		})
	})

	const defineLoadChunks = (
		label: string,
		text: VariableReference,
		list: ListReference,
	) => {
		return defineWarp(label, () => {
			deleteAllOfList(list)
			setVariableTo(i, length(read(text)))
			repeatUntil(lt(read(i), 1), () => {
				setVariableTo(startIndex, add(1, subtract(read(i), CHUNK_WIDTH)))
				ifThen(lt(read(startIndex), 1), () => {
					setVariableTo(startIndex, 1)
				})
				setVariableTo(chunkText, '')
				setVariableTo(k, read(startIndex))
				repeatUntil(gt(read(k), read(i)), () => {
					setVariableTo(chunkText, join(read(chunkText), letterOf(read(k), read(text))))
					changeVariableBy(k, 1)
				})
				addToList(list, read(chunkText))
				changeVariableBy(i, -CHUNK_WIDTH)
			})
			ifThen(equals(lengthOfList(list), 0), () => {
				addToList(list, 0)
			})
		})
	}

	const loadLeftChunks = defineLoadChunks('load left chunks', leftMag, aChunks)
	const loadRightChunks = defineLoadChunks('load right chunks', rightMag, bChunks)

	const addChunkLists = defineWarp('add chunk lists', () => {
		deleteAllOfList(resultChunks)
		setVariableTo(carry, 0)
		setVariableTo(i, 1)
		repeatUntil(
			and(
				and(gt(read(i), lengthOfList(aChunks)), gt(read(i), lengthOfList(bChunks))),
				equals(read(carry), 0),
			),
			() => {
				setVariableTo(value, read(carry))
				ifThen(not(gt(read(i), lengthOfList(aChunks))), () => {
					setVariableTo(value, add(read(value), getItemOfList(aChunks, read(i))))
				})
				ifThen(not(gt(read(i), lengthOfList(bChunks))), () => {
					setVariableTo(value, add(read(value), getItemOfList(bChunks, read(i))))
				})
				addToList(resultChunks, mod(read(value), BASE))
				setVariableTo(carry, mathop('floor', divide(read(value), BASE)))
				changeVariableBy(i, 1)
			},
		)
		callProcedure(trimResult, {})
	})

	const subtractAB = defineWarp('subtract a chunks by b chunks', () => {
		deleteAllOfList(resultChunks)
		setVariableTo(borrow, 0)
		setVariableTo(i, 1)
		repeatUntil(gt(read(i), lengthOfList(aChunks)), () => {
			setVariableTo(value, subtract(getItemOfList(aChunks, read(i)), read(borrow)))
			ifThen(not(gt(read(i), lengthOfList(bChunks))), () => {
				setVariableTo(value, subtract(read(value), getItemOfList(bChunks, read(i))))
			})
			ifElse(
				lt(read(value), 0),
				() => {
					setVariableTo(value, add(read(value), BASE))
					setVariableTo(borrow, 1)
				},
				() => {
					setVariableTo(borrow, 0)
				},
			)
			addToList(resultChunks, read(value))
			changeVariableBy(i, 1)
		})
		callProcedure(trimResult, {})
	})

	const subtractBA = defineWarp('subtract b chunks by a chunks', () => {
		deleteAllOfList(resultChunks)
		setVariableTo(borrow, 0)
		setVariableTo(i, 1)
		repeatUntil(gt(read(i), lengthOfList(bChunks)), () => {
			setVariableTo(value, subtract(getItemOfList(bChunks, read(i)), read(borrow)))
			ifThen(not(gt(read(i), lengthOfList(aChunks))), () => {
				setVariableTo(value, subtract(read(value), getItemOfList(aChunks, read(i))))
			})
			ifElse(
				lt(read(value), 0),
				() => {
					setVariableTo(value, add(read(value), BASE))
					setVariableTo(borrow, 1)
				},
				() => {
					setVariableTo(borrow, 0)
				},
			)
			addToList(resultChunks, read(value))
			changeVariableBy(i, 1)
		})
		callProcedure(trimResult, {})
	})

	const multiplyChunkLists = defineWarp('multiply chunk lists', () => {
		deleteAllOfList(resultChunks)
		setVariableTo(i, 1)
		repeatUntil(
			gt(
				read(i),
				add(lengthOfList(aChunks), add(lengthOfList(bChunks), 1)),
			),
			() => {
				addToList(resultChunks, 0)
				changeVariableBy(i, 1)
			},
		)
		setVariableTo(i, 1)
		repeatUntil(gt(read(i), lengthOfList(aChunks)), () => {
			setVariableTo(carry, 0)
			setVariableTo(j, 1)
			repeatUntil(gt(read(j), lengthOfList(bChunks)), () => {
				setVariableTo(k, add(add(read(i), read(j)), -1))
				setVariableTo(
					value,
					add(
						add(getItemOfList(resultChunks, read(k)), multiply(getItemOfList(aChunks, read(i)), getItemOfList(bChunks, read(j)))),
						read(carry),
					),
				)
				replaceItemOfList(resultChunks, read(k), mod(read(value), BASE))
				setVariableTo(carry, mathop('floor', divide(read(value), BASE)))
				changeVariableBy(j, 1)
			})
			setVariableTo(k, add(read(i), lengthOfList(bChunks)))
			repeatUntil(equals(read(carry), 0), () => {
				ifThen(gt(read(k), lengthOfList(resultChunks)), () => {
					addToList(resultChunks, 0)
				})
				setVariableTo(value, add(getItemOfList(resultChunks, read(k)), read(carry)))
				replaceItemOfList(resultChunks, read(k), mod(read(value), BASE))
				setVariableTo(carry, mathop('floor', divide(read(value), BASE)))
				changeVariableBy(k, 1)
			})
			changeVariableBy(i, 1)
		})
		callProcedure(trimResult, {})
	})

	const multiplyDivisorByTrial = defineWarp('multiply divisor by trial', () => {
		deleteAllOfList(tmpChunks)
		setVariableTo(carry, 0)
		setVariableTo(i, 1)
		repeatUntil(
			and(gt(read(i), lengthOfList(bChunks)), equals(read(carry), 0)),
			() => {
				setVariableTo(value, read(carry))
				ifThen(not(gt(read(i), lengthOfList(bChunks))), () => {
					setVariableTo(value, add(read(value), multiply(getItemOfList(bChunks, read(i)), read(trial))))
				})
				addToList(tmpChunks, mod(read(value), BASE))
				setVariableTo(carry, mathop('floor', divide(read(value), BASE)))
				changeVariableBy(i, 1)
			},
		)
		ifThen(equals(lengthOfList(tmpChunks), 0), () => {
			addToList(tmpChunks, 0)
		})
		callProcedure(trimTmp, {})
	})

	const subtractTmpFromRemainder = defineWarp('subtract tmp from remainder', () => {
		setVariableTo(borrow, 0)
		setVariableTo(i, 1)
		repeatUntil(gt(read(i), lengthOfList(remainderChunks)), () => {
			setVariableTo(
				value,
				subtract(getItemOfList(remainderChunks, read(i)), read(borrow)),
			)
			ifThen(not(gt(read(i), lengthOfList(tmpChunks))), () => {
				setVariableTo(
					value,
					subtract(read(value), getItemOfList(tmpChunks, read(i))),
				)
			})
			ifElse(
				lt(read(value), 0),
				() => {
					setVariableTo(value, add(read(value), BASE))
					setVariableTo(borrow, 1)
				},
				() => {
					setVariableTo(borrow, 0)
				},
			)
			replaceItemOfList(remainderChunks, read(i), read(value))
			changeVariableBy(i, 1)
		})
		callProcedure(trimRemainder, {})
	})

	const divideChunkLists = defineWarp('divide chunk lists', () => {
		deleteAllOfList(quotientChunks)
		deleteAllOfList(remainderChunks)
		addToList(remainderChunks, 0)
		setVariableTo(i, lengthOfList(aChunks))
		repeatUntil(lt(read(i), 1), () => {
			ifElse(
				and(
					equals(lengthOfList(remainderChunks), 1),
					equals(getItemOfList(remainderChunks, 1), 0),
				),
				() => {
					replaceItemOfList(remainderChunks, 1, getItemOfList(aChunks, read(i)))
				},
				() => {
					insertAtList(remainderChunks, 1, getItemOfList(aChunks, read(i)))
				},
			)
			callProcedure(trimRemainder, {})
			setVariableTo(low, 0)
			setVariableTo(high, BASE - 1)
			setVariableTo(candidate, 0)
			repeatUntil(gt(read(low), read(high)), () => {
				setVariableTo(mid, mathop('floor', divide(add(read(low), read(high)), 2)))
				setVariableTo(trial, read(mid))
				callProcedure(multiplyDivisorByTrial, {})
				callProcedure(compareRemainderWithTmp, {})
				ifElse(
					lt(read(cmp), 0),
					() => {
						setVariableTo(high, subtract(read(mid), 1))
					},
					() => {
						setVariableTo(candidate, read(mid))
						setVariableTo(low, add(read(mid), 1))
					},
				)
			})
			setVariableTo(trial, read(candidate))
			callProcedure(multiplyDivisorByTrial, {})
			callProcedure(subtractTmpFromRemainder, {})
			insertAtList(quotientChunks, 1, read(candidate))
			changeVariableBy(i, -1)
		})
		callProcedure(trimQuotient, {})
		callProcedure(trimRemainder, {})
	})

	const applyResultSign = defineWarp('apply result sign', () => {
		ifThen(
			and(equals(read(resultSign), -1), not(equals(read(result), '0'))),
			() => {
				setVariableTo(result, join('-', read(result)))
			},
		)
	})

	const applyRemainderSign = defineWarp('apply remainder sign', () => {
		ifThen(
			and(equals(read(leftSign), -1), not(equals(read(remainder), '0'))),
			() => {
				setVariableTo(remainder, join('-', read(remainder)))
			},
		)
	})

	const normalizeBenchmarkSettings = defineWarp(
		'normalize benchmark settings',
		() => {
			setVariableTo(
				benchmarkDigits,
				mathop('floor', mathop('abs', read(benchmarkDigits))),
			)
			ifThen(lt(read(benchmarkDigits), 1), () => {
				setVariableTo(benchmarkDigits, 1)
			})
			setVariableTo(
				benchmarkRepeats,
				mathop('floor', mathop('abs', read(benchmarkRepeats))),
			)
			ifThen(lt(read(benchmarkRepeats), 1), () => {
				setVariableTo(benchmarkRepeats, 1)
			})
			setVariableTo(
				benchmarkSeed,
				mathop('floor', mathop('abs', read(benchmarkSeed))),
			)
		},
	)

	const generateLeftBenchmarkInput = defineWarp(
		'generate left benchmark input',
		() => {
			setVariableTo(leftInput, '')
			setVariableTo(generatorState, mod(add(multiply(read(benchmarkSeed), 109), 907), 10000))
			setVariableTo(chunkText, add(1, mod(read(generatorState), 9)))
			setVariableTo(leftInput, read(chunkText))
			setVariableTo(i, 2)
			repeatUntil(gt(read(i), read(benchmarkDigits)), () => {
				setVariableTo(
					generatorState,
					mod(add(multiply(read(generatorState), 73), 19), 10000),
				)
				setVariableTo(chunkText, mod(read(generatorState), 10))
				setVariableTo(leftInput, join(read(leftInput), read(chunkText)))
				changeVariableBy(i, 1)
			})
		},
	)

	const generateRightBenchmarkInput = defineWarp(
		'generate right benchmark input',
		() => {
			setVariableTo(rightInput, '')
			setVariableTo(generatorState, mod(add(multiply(read(benchmarkSeed), 131), 571), 10000))
			setVariableTo(chunkText, add(1, mod(read(generatorState), 9)))
			setVariableTo(rightInput, read(chunkText))
			setVariableTo(i, 2)
			repeatUntil(gt(read(i), read(benchmarkDigits)), () => {
				setVariableTo(
					generatorState,
					mod(add(multiply(read(generatorState), 89), 43), 10000),
				)
				setVariableTo(chunkText, mod(add(read(generatorState), read(i)), 10))
				setVariableTo(rightInput, join(read(rightInput), read(chunkText)))
				changeVariableBy(i, 1)
			})
		},
	)

	const generateBenchmarkOperands = defineWarp(
		'generate benchmark operands',
		() => {
			callProcedure(normalizeBenchmarkSettings, {})
			callProcedure(generateLeftBenchmarkInput, {})
			callProcedure(generateRightBenchmarkInput, {})
			setVariableTo(
				benchmarkReport,
				join(
					join('generated digits=', read(benchmarkDigits)),
					join(' seed=', read(benchmarkSeed)),
				),
			)
			setVariableTo(status, 'benchmark operands generated')
		},
	)

	const refreshDigitViews = defineWarp('refresh digit views', () => {
		setVariableTo(leftDigitsView, length(read(leftInput)))
		setVariableTo(rightDigitsView, length(read(rightInput)))
		ifElse(
			and(
				equals(read(benchmarkMode), 'bench'),
				equals(read(benchmarkAccuracy), 'fast'),
			),
			() => {
					setVariableTo(resultDigitsView, read(benchmarkResultDigits))
			},
			() => {
				setVariableTo(resultDigitsView, length(read(result)))
				ifThen(and(gt(length(read(result)), 0), equals(letterOf(1, read(result)), '-')), () => {
					setVariableTo(resultDigitsView, subtract(length(read(result)), 1))
				})
			},
		)
	})

	const updateBenchmarkReport = defineWarp('update benchmark report', () => {
		callProcedure(refreshDigitViews, {})
		setVariableTo(
			benchmarkReport,
			join(
				join(
					join(
						join('mode=', read(benchmarkMode)),
						join(' op=', read(operation)),
					),
					join(
						join(join(' accuracy=', read(benchmarkAccuracy)), join(' L=', read(leftDigitsView))),
						join(' R=', read(rightDigitsView)),
					),
				),
				join(
					join(
						join(' resultDigits=', read(resultDigitsView)),
						join(' totalMs=', read(elapsedMs)),
					),
					join(
						join(' avgMs=', read(avgMs)),
						join(' repeats=', read(benchmarkRepeats)),
					),
				),
			),
		)
	})

	const performSignedSum = defineWarp('perform signed sum', () => {
		callProcedure(compareMagnitudeText, {})
		ifElse(
			equals(read(leftSign), read(effectiveRightSign)),
			() => {
				callProcedure(loadLeftChunks, {})
				callProcedure(loadRightChunks, {})
				callProcedure(addChunkLists, {})
				callProcedure(resultToText, {})
				setVariableTo(resultSign, read(leftSign))
			},
			() => {
				ifElse(
					equals(read(cmp), 0),
					() => {
						setVariableTo(result, '0')
						setVariableTo(resultSign, 1)
					},
					() => {
						ifElse(
							gt(read(cmp), 0),
							() => {
								callProcedure(loadLeftChunks, {})
								callProcedure(loadRightChunks, {})
								callProcedure(subtractAB, {})
								callProcedure(resultToText, {})
								setVariableTo(resultSign, read(leftSign))
							},
							() => {
								callProcedure(loadLeftChunks, {})
								callProcedure(loadRightChunks, {})
								callProcedure(subtractBA, {})
								callProcedure(resultToText, {})
								setVariableTo(resultSign, read(effectiveRightSign))
							},
						)
					},
				)
			},
		)
		callProcedure(applyResultSign, {})
		setVariableTo(remainder, 'exact integer')
		setVariableTo(status, 'ok')
	})

	const performMultiply = defineWarp('perform multiply', () => {
		ifElse(
			or(equals(read(leftMag), '0'), equals(read(rightMag), '0')),
			() => {
				setVariableTo(result, '0')
				setVariableTo(resultSign, 1)
			},
			() => {
				callProcedure(fftMultiplyDigits, {})
				setVariableTo(resultSign, multiply(read(leftSign), read(rightSign)))
				callProcedure(applyResultSign, {})
				setVariableTo(status, 'ok (fft multiply)')
			},
		)
		setVariableTo(remainder, 'exact integer')
		ifThen(equals(read(result), '0'), () => {
			setVariableTo(status, 'ok')
		})
	})

	const performDivide = defineWarp('perform divide', () => {
		ifElse(
			equals(read(rightMag), '0'),
			() => {
				setVariableTo(result, 'error')
				setVariableTo(remainder, '')
				setVariableTo(status, 'division by zero')
			},
			() => {
				callProcedure(compareMagnitudeText, {})
				ifElse(
					equals(read(leftMag), '0'),
					() => {
						setVariableTo(result, '0')
						setVariableTo(remainder, '0')
						setVariableTo(status, 'ok')
					},
					() => {
						ifElse(
							lt(read(cmp), 0),
							() => {
								setVariableTo(result, '0')
								setVariableTo(remainder, read(leftMag))
								callProcedure(applyRemainderSign, {})
								setVariableTo(status, 'ok')
							},
							() => {
								callProcedure(loadLeftChunks, {})
								callProcedure(loadRightChunks, {})
								callProcedure(divideChunkLists, {})
								callProcedure(quotientToText, {})
								callProcedure(remainderToText, {})
								setVariableTo(resultSign, multiply(read(leftSign), read(rightSign)))
								callProcedure(applyResultSign, {})
								callProcedure(applyRemainderSign, {})
								setVariableTo(status, 'ok')
							},
						)
					},
				)
			},
		)
	})

	const performCompare = defineWarp('perform compare', () => {
		ifElse(
			gt(read(leftSign), read(rightSign)),
			() => {
				setVariableTo(result, 1)
			},
			() => {
				ifElse(
					lt(read(leftSign), read(rightSign)),
					() => {
						setVariableTo(result, -1)
					},
					() => {
						callProcedure(compareMagnitudeText, {})
						ifElse(
							equals(read(leftSign), 1),
							() => {
								setVariableTo(result, read(cmp))
							},
							() => {
								setVariableTo(result, multiply(-1, read(cmp)))
							},
						)
					},
				)
			},
		)
		setVariableTo(remainder, 'comparison only')
		setVariableTo(status, 'ok')
	})

	const runFastBenchmarkOperation = defineWarp('run fast benchmark operation', () => {
		setVariableTo(result, '(suppressed)')
		setVariableTo(remainder, '(suppressed)')
		setVariableTo(status, 'running benchmark fast path')
		setVariableTo(inputValid, 1)
		setVariableTo(benchmarkResultDigits, 0)
		callProcedure(parseLeft, {})
		ifThen(equals(read(inputValid), 1), () => {
			callProcedure(parseRight, {})
		})
		ifElse(
			equals(read(inputValid), 0),
			() => {
				setVariableTo(result, 'error')
				setVariableTo(benchmarkResultDigits, 0)
			},
			() => {
				ifElse(
					equals(read(operation), '+'),
					() => {
						setVariableTo(effectiveRightSign, read(rightSign))
						callProcedure(compareMagnitudeText, {})
						ifElse(
							equals(read(leftSign), read(effectiveRightSign)),
							() => {
								callProcedure(loadLeftChunks, {})
								callProcedure(loadRightChunks, {})
								callProcedure(addChunkLists, {})
								callProcedure(measureResultChunkDigits, {})
							},
							() => {
								ifElse(
									equals(read(cmp), 0),
									() => {
										setVariableTo(benchmarkResultDigits, 1)
									},
									() => {
										ifElse(
											gt(read(cmp), 0),
											() => {
												callProcedure(loadLeftChunks, {})
												callProcedure(loadRightChunks, {})
												callProcedure(subtractAB, {})
												callProcedure(measureResultChunkDigits, {})
											},
											() => {
												callProcedure(loadLeftChunks, {})
												callProcedure(loadRightChunks, {})
												callProcedure(subtractBA, {})
												callProcedure(measureResultChunkDigits, {})
											},
										)
									},
								)
							},
						)
						setVariableTo(status, 'benchmark fast mode')
					},
					() => {
						ifElse(
							equals(read(operation), '-'),
							() => {
								setVariableTo(effectiveRightSign, multiply(-1, read(rightSign)))
								callProcedure(compareMagnitudeText, {})
								ifElse(
									equals(read(leftSign), read(effectiveRightSign)),
									() => {
										callProcedure(loadLeftChunks, {})
										callProcedure(loadRightChunks, {})
										callProcedure(addChunkLists, {})
										callProcedure(measureResultChunkDigits, {})
									},
									() => {
										ifElse(
											equals(read(cmp), 0),
											() => {
												setVariableTo(benchmarkResultDigits, 1)
											},
											() => {
												ifElse(
													gt(read(cmp), 0),
													() => {
														callProcedure(loadLeftChunks, {})
														callProcedure(loadRightChunks, {})
														callProcedure(subtractAB, {})
														callProcedure(measureResultChunkDigits, {})
													},
													() => {
														callProcedure(loadLeftChunks, {})
														callProcedure(loadRightChunks, {})
														callProcedure(subtractBA, {})
														callProcedure(measureResultChunkDigits, {})
													},
												)
											},
										)
									},
								)
								setVariableTo(status, 'benchmark fast mode')
							},
							() => {
								ifElse(
									or(equals(read(operation), '*'), equals(read(operation), 'x')),
									() => {
										ifElse(
											or(equals(read(leftMag), '0'), equals(read(rightMag), '0')),
											() => {
												setVariableTo(benchmarkResultDigits, 1)
											},
											() => {
												callProcedure(fftMultiplyDigitsFast, {})
											},
										)
										setVariableTo(status, 'benchmark fast mode')
									},
									() => {
										ifElse(
											or(equals(read(operation), '/'), equals(read(operation), '÷')),
											() => {
												ifElse(
													equals(read(rightMag), '0'),
													() => {
														setVariableTo(result, 'error')
														setVariableTo(remainder, '')
														setVariableTo(status, 'division by zero')
														setVariableTo(benchmarkResultDigits, 0)
													},
													() => {
														callProcedure(compareMagnitudeText, {})
														ifElse(
															equals(read(leftMag), '0'),
															() => {
																setVariableTo(benchmarkResultDigits, 1)
															},
															() => {
																ifElse(
																	lt(read(cmp), 0),
																	() => {
																		setVariableTo(benchmarkResultDigits, 1)
																	},
																	() => {
																		callProcedure(loadLeftChunks, {})
																		callProcedure(loadRightChunks, {})
																		callProcedure(divideChunkLists, {})
																		callProcedure(measureQuotientChunkDigits, {})
																	},
																)
															},
														)
														setVariableTo(status, 'benchmark fast mode')
													},
												)
											},
											() => {
												ifElse(
													or(equals(read(operation), 'cmp'), equals(read(operation), 'compare')),
													() => {
														callProcedure(performCompare, {})
														setVariableTo(result, '(cmp done)')
														setVariableTo(remainder, '(suppressed)')
														setVariableTo(benchmarkResultDigits, 1)
														setVariableTo(status, 'benchmark fast mode')
													},
													() => {
														setVariableTo(result, '?')
														setVariableTo(remainder, '')
														setVariableTo(status, 'unknown op: use +, -, *, /, cmp')
														setVariableTo(benchmarkResultDigits, 0)
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
		callProcedure(refreshDigitViews, {})
	})

	const runOperation = defineWarp('run current operation', () => {
		setVariableTo(result, '')
		setVariableTo(remainder, '')
		setVariableTo(status, 'running exact bigint')
		setVariableTo(inputValid, 1)
		callProcedure(parseLeft, {})
		ifThen(equals(read(inputValid), 1), () => {
			callProcedure(parseRight, {})
		})
		ifElse(
			equals(read(inputValid), 0),
			() => {
				setVariableTo(result, 'error')
			},
			() => {
				ifElse(
					equals(read(operation), '+'),
					() => {
						setVariableTo(effectiveRightSign, read(rightSign))
						callProcedure(performSignedSum, {})
					},
					() => {
						ifElse(
							equals(read(operation), '-'),
							() => {
								setVariableTo(effectiveRightSign, multiply(-1, read(rightSign)))
								callProcedure(performSignedSum, {})
							},
							() => {
								ifElse(
									or(equals(read(operation), '*'), equals(read(operation), 'x')),
									() => {
										callProcedure(performMultiply, {})
									},
									() => {
										ifElse(
											or(equals(read(operation), '/'), equals(read(operation), '÷')),
											() => {
												callProcedure(performDivide, {})
											},
											() => {
												ifElse(
													or(
														equals(read(operation), 'cmp'),
														equals(read(operation), 'compare'),
													),
													() => {
														callProcedure(performCompare, {})
													},
													() => {
														setVariableTo(result, '?')
														setVariableTo(remainder, '')
														setVariableTo(
															status,
															'unknown op: use +, -, *, /, cmp',
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
		callProcedure(refreshDigitViews, {})
	})

	whenFlagClicked(() => {
		showVariable(description)
		showVariable(leftInput)
		showVariable(operation)
		showVariable(rightInput)
		showVariable(result)
		showVariable(remainder)
		showVariable(status)
		showVariable(elapsedMs)
		showVariable(avgMs)
		showVariable(leftDigitsView)
		showVariable(rightDigitsView)
		showVariable(resultDigitsView)
		showVariable(benchmarkMode)
		showVariable(benchmarkDigits)
		showVariable(benchmarkRepeats)
		showVariable(benchmarkSeed)
		showVariable(benchmarkAccuracy)
		showVariable(benchmarkReport)

		setVariableTo(
			description,
			'Exact bigint for Scratch. mode=manual / gen / bench. bench can use accuracy=exact / fast.',
		)
		setVariableTo(
			leftInput,
			'3141592653589793238462643383279502884197169399375105820974944592',
		)
		setVariableTo(operation, '*')
		setVariableTo(
			rightInput,
			'2718281828459045235360287471352662497757247093699959574966967627',
		)
		setVariableTo(result, '')
		setVariableTo(remainder, '')
		setVariableTo(status, 'Choose mode: manual / gen / bench')
		setVariableTo(elapsedMs, 0)
		setVariableTo(avgMs, 0)
		setVariableTo(leftDigitsView, 0)
		setVariableTo(rightDigitsView, 0)
		setVariableTo(resultDigitsView, 0)
		setVariableTo(benchmarkMode, 'manual')
		setVariableTo(benchmarkDigits, 256)
		setVariableTo(benchmarkRepeats, 3)
		setVariableTo(benchmarkSeed, 20260312)
		setVariableTo(benchmarkAccuracy, 'exact')
		setVariableTo(benchmarkResultDigits, 0)
		setVariableTo(benchmarkReport, '')

		askAndWait('Mode: manual / gen / bench (empty = manual)')
		ifThen(not(equals(getAnswer(), '')), () => {
			setVariableTo(benchmarkMode, getAnswer())
		})
		ifThen(
			not(
				or(
					or(equals(read(benchmarkMode), 'manual'), equals(read(benchmarkMode), 'gen')),
					or(
						equals(read(benchmarkMode), 'bench'),
						equals(read(benchmarkMode), 'benchmark'),
					),
				),
			),
			() => {
				setVariableTo(benchmarkMode, 'manual')
			},
		)

		ifElse(
			equals(read(benchmarkMode), 'manual'),
			() => {
				setVariableTo(benchmarkRepeats, 1)
				askAndWait('Left integer (empty = sample)')
				ifThen(not(equals(getAnswer(), '')), () => {
					setVariableTo(leftInput, getAnswer())
				})

				askAndWait('Operation: +  -  *  /  cmp   (empty = sample)')
				ifThen(not(equals(getAnswer(), '')), () => {
					setVariableTo(operation, getAnswer())
				})

				askAndWait('Right integer (empty = sample)')
				ifThen(not(equals(getAnswer(), '')), () => {
					setVariableTo(rightInput, getAnswer())
				})

				resetTimer()
				callProcedure(runOperation, {})
				setVariableTo(elapsedMs, multiply(getTimer(), 1000))
				setVariableTo(avgMs, read(elapsedMs))
				callProcedure(updateBenchmarkReport, {})
			},
			() => {
				ifThen(equals(read(benchmarkMode), 'benchmark'), () => {
					setVariableTo(benchmarkMode, 'bench')
				})
				askAndWait('Operation for generated operands: +  -  *  /  cmp  (empty = current)')
				ifThen(not(equals(getAnswer(), '')), () => {
					setVariableTo(operation, getAnswer())
				})
				askAndWait('Digits per operand (empty = 256)')
				ifThen(not(equals(getAnswer(), '')), () => {
					setVariableTo(benchmarkDigits, getAnswer())
				})
				askAndWait('Seed (empty = 20260312)')
				ifThen(not(equals(getAnswer(), '')), () => {
					setVariableTo(benchmarkSeed, getAnswer())
				})
				ifThen(equals(read(benchmarkMode), 'bench'), () => {
					askAndWait('Repeat count (empty = 3)')
					ifThen(not(equals(getAnswer(), '')), () => {
						setVariableTo(benchmarkRepeats, getAnswer())
					})
					askAndWait('Bench accuracy: exact / fast (empty = exact)')
					ifThen(not(equals(getAnswer(), '')), () => {
						setVariableTo(benchmarkAccuracy, getAnswer())
					})
					ifThen(
						not(
							or(
								equals(read(benchmarkAccuracy), 'exact'),
								equals(read(benchmarkAccuracy), 'fast'),
							),
						),
						() => {
							setVariableTo(benchmarkAccuracy, 'exact')
						},
					)
				})

				callProcedure(generateBenchmarkOperands, {})

				ifElse(
					equals(read(benchmarkMode), 'gen'),
					() => {
						setVariableTo(result, 'generated only')
						setVariableTo(remainder, 'no execution')
						setVariableTo(elapsedMs, 0)
						setVariableTo(avgMs, 0)
						callProcedure(updateBenchmarkReport, {})
					},
					() => {
						callProcedure(normalizeBenchmarkSettings, {})
						resetTimer()
						setVariableTo(repeatCounter, 1)
						repeatUntil(gt(read(repeatCounter), read(benchmarkRepeats)), () => {
							ifElse(
								equals(read(benchmarkAccuracy), 'fast'),
								() => {
									callProcedure(runFastBenchmarkOperation, {})
								},
								() => {
									callProcedure(runOperation, {})
								},
							)
							changeVariableBy(repeatCounter, 1)
						})
						setVariableTo(elapsedMs, multiply(getTimer(), 1000))
						setVariableTo(avgMs, divide(read(elapsedMs), read(benchmarkRepeats)))
						callProcedure(updateBenchmarkReport, {})
						setVariableTo(status, 'benchmark finished')
					},
				)
			},
		)

		setVariableTo(
			description,
			'Done. manual=single run, gen=make benchmark operands, bench=repeated timing run. bench accuracy=exact / fast.',
		)
	})
})

export default project
