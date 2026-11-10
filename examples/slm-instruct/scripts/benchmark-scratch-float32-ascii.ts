import { copyFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import VM from '@scratch/scratch-vm'
import { Project } from 'hikkaku'
import { IMAGES } from 'hikkaku/assets'
import {
  add,
  addToList,
  callProcedure,
  changeVariableBy,
  defineProcedure,
  deleteAllOfList,
  divide,
  equals,
  forEach,
  getBackdropNumberName,
  getItemOfList,
  getVariable,
  gt,
  ifElse,
  ifThen,
  join,
  length,
  letterOf,
  mathop,
  mod,
  multiply,
  procedureLabel,
  procedureStringOrNumber,
  repeatUntil,
  setVariableTo,
  subtract,
  switchBackdropTo,
  whenFlagClicked,
} from 'hikkaku/blocks'
import { SafetensorsFile } from '../src/build/safetensors'

const ROOT = new URL('..', import.meta.url)
const ARTIFACTS = new URL('../artifacts/', import.meta.url)
const DEFAULT_TENSOR_NAME = 'model.layers.0.feed_forward.down_proj.weight'
const DEFAULT_COUNTS = [16, 64, 256]
const BASE64URL_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
const BLANK_COSTUME = '__blank__'
const LN_2 = Math.log(2)
const TWO_POW_23 = 8388608
const TWO_POW_31 = 2147483648

const read = getVariable

const ensureScratchVmCss = async () => {
  const repoRoot = join(new URL('../../..', ROOT).pathname)
  const target = join(
    repoRoot,
    'node_modules/@scratch/scratch-vm/browser/default-stylesheet.css',
  )
  const source = join(
    repoRoot,
    'node_modules/.bun/@scratch+scratch-vm@12.6.2+3e0676dcaea4cbfb/node_modules/@scratch/scratch-vm/browser/default-stylesheet.css',
  )
  await mkdir(dirname(target), { recursive: true })
  await copyFile(source, target)
}

const encodeBase64Url = (bytes: Uint8Array) =>
  Buffer.from(bytes)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')

const floatsToBytes = (values: Float32Array) =>
  new Uint8Array(values.buffer, values.byteOffset, values.byteLength)

const loadSampleValues = async (tensorName: string, count: number) => {
  const safetensors = await SafetensorsFile.fromFile(new URL('model.safetensors', ARTIFACTS))
  return safetensors.getTensorData(tensorName).slice(0, count)
}

const runProject = async (project: Project) => {
  const json = project.toScratch()
  const jsonText = JSON.stringify(json)
  const vm = new VM()
  const loadStart = performance.now()
  await vm.loadProject(json)
  const loadMs = performance.now() - loadStart

  const runMs = await new Promise<number>((resolve, reject) => {
    const runStart = performance.now()
    const timer = setTimeout(() => {
      vm.quit()
      reject(new Error('Benchmark timed out'))
    }, 60_000)

    vm.on('PROJECT_RUN_STOP', () => {
      clearTimeout(timer)
      const elapsed = performance.now() - runStart
      vm.quit()
      resolve(elapsed)
    })

    vm.start()
    vm.greenFlag()
  })

  return {
    jsonBytes: Buffer.byteLength(jsonText),
    loadMs,
    runMs,
  }
}

const createDirectProject = (values: number[]) => {
  const project = new Project()
  const stage = project.stage
  stage.addCostume({ ...IMAGES.BLANK_SVG, name: BLANK_COSTUME })
  const source = stage.createList('source', values)
  const sink = stage.createVariable('sink', 0)
  const index = stage.createVariable('index', 1)

  stage.run(() => {
    whenFlagClicked(() => {
      setVariableTo(sink, 0)
      forEach(index, values.length, () => {
        setVariableTo(sink, add(read(sink), getItemOfList(source, read(index))))
      })
    })
  })

  return project
}

const createAsciiProject = (encoded: string, floatCount: number) => {
  const project = new Project()
  const stage = project.stage
  stage.addCostume({ ...IMAGES.BLANK_SVG, name: BLANK_COSTUME })
  for (const char of BASE64URL_ALPHABET) {
    stage.addCostume({ ...IMAGES.BLANK_SVG, name: char })
  }

  const encodedText = stage.createVariable('encoded', encoded)
  const checksum = stage.createVariable('checksum', 0)
  const charIndex = stage.createVariable('charIndex', 1)
  const byteIndex = stage.createVariable('byteIndex', 1)
  const outputIndex = stage.createVariable('outputIndex', 1)
  const sextetValue = stage.createVariable('sextetValue', 0)
  const sextet1 = stage.createVariable('sextet1', 0)
  const sextet2 = stage.createVariable('sextet2', 0)
  const sextet3 = stage.createVariable('sextet3', 0)
  const sextet4 = stage.createVariable('sextet4', 0)
  const byte0 = stage.createVariable('byte0', 0)
  const byte1 = stage.createVariable('byte1', 0)
  const byte2 = stage.createVariable('byte2', 0)
  const byte3 = stage.createVariable('byte3', 0)
  const bits = stage.createVariable('bits', 0)
  const signFlag = stage.createVariable('signFlag', 0)
  const exponent = stage.createVariable('exponent', 0)
  const mantissa = stage.createVariable('mantissa', 0)
  const decodedValue = stage.createVariable('decodedValue', 0)
  const currentChar = stage.createVariable('currentChar', '')
  const backdropNumber = stage.createVariable('backdropNumber', 0)
  const byteBuffer = stage.createList('byteBuffer', [])
  const decoded = stage.createList('decoded', [])
  stage.run(() => {
    const resolveBase64Char = defineProcedure(
      [procedureLabel('resolve base64 char'), procedureStringOrNumber('char')],
      ({ char }) => {
        setVariableTo(currentChar, char.getter())
        ifElse(equals(read(currentChar), '='), () => {
          setVariableTo(sextetValue, -1)
        }, () => {
          switchBackdropTo(BLANK_COSTUME)
          switchBackdropTo(read(currentChar))
          setVariableTo(backdropNumber, getBackdropNumberName('number'))
          setVariableTo(sextetValue, add(read(backdropNumber), -2))
        })
        return undefined
      },
      true,
    )

    const decodeAscii = defineProcedure(
      [procedureLabel('decode ascii')],
      () => {
        deleteAllOfList(byteBuffer)
        deleteAllOfList(decoded)

        setVariableTo(charIndex, 1)
        repeatUntil(gt(read(charIndex), length(read(encodedText))), () => {
          callProcedure(resolveBase64Char, {
            [resolveBase64Char.reference.arguments.char.id]: letterOf(read(charIndex), read(encodedText)),
          })
          setVariableTo(sextet1, read(sextetValue))
          callProcedure(resolveBase64Char, {
            [resolveBase64Char.reference.arguments.char.id]: letterOf(add(read(charIndex), 1), read(encodedText)),
          })
          setVariableTo(sextet2, read(sextetValue))
          callProcedure(resolveBase64Char, {
            [resolveBase64Char.reference.arguments.char.id]: letterOf(add(read(charIndex), 2), read(encodedText)),
          })
          setVariableTo(sextet3, read(sextetValue))
          callProcedure(resolveBase64Char, {
            [resolveBase64Char.reference.arguments.char.id]: letterOf(add(read(charIndex), 3), read(encodedText)),
          })
          setVariableTo(sextet4, read(sextetValue))

          addToList(
            byteBuffer,
            add(multiply(read(sextet1), 4), mathop('floor', divide(read(sextet2), 16))),
          )
          ifThen(gt(read(sextet3), -1), () => {
            addToList(
              byteBuffer,
              add(multiply(mod(read(sextet2), 16), 16), mathop('floor', divide(read(sextet3), 4))),
            )
            ifThen(gt(read(sextet4), -1), () => {
              addToList(
                byteBuffer,
                add(multiply(mod(read(sextet3), 4), 64), read(sextet4)),
              )
            })
          })
          changeVariableBy(charIndex, 4)
        })

        setVariableTo(byteIndex, 1)
        repeatUntil(gt(read(byteIndex), multiply(floatCount, 4)), () => {
          setVariableTo(byte0, getItemOfList(byteBuffer, read(byteIndex)))
          setVariableTo(byte1, getItemOfList(byteBuffer, add(read(byteIndex), 1)))
          setVariableTo(byte2, getItemOfList(byteBuffer, add(read(byteIndex), 2)))
          setVariableTo(byte3, getItemOfList(byteBuffer, add(read(byteIndex), 3)))
          setVariableTo(
            bits,
            add(
              add(read(byte0), multiply(read(byte1), 256)),
              add(multiply(read(byte2), 65536), multiply(read(byte3), 16777216)),
            ),
          )
          setVariableTo(signFlag, mathop('floor', divide(read(bits), TWO_POW_31)))
          ifThen(equals(read(signFlag), 1), () => {
            setVariableTo(bits, subtract(read(bits), TWO_POW_31))
          })
          setVariableTo(exponent, mathop('floor', divide(read(bits), TWO_POW_23)))
          setVariableTo(mantissa, mod(read(bits), TWO_POW_23))
          ifElse(equals(read(exponent), 0), () => {
            setVariableTo(
              decodedValue,
              multiply(
                divide(read(mantissa), TWO_POW_23),
                mathop('e ^', multiply(LN_2, -126)),
              ),
            )
          }, () => {
            setVariableTo(
              decodedValue,
              multiply(
                add(1, divide(read(mantissa), TWO_POW_23)),
                mathop('e ^', multiply(LN_2, add(read(exponent), -127))),
              ),
            )
          })
          ifThen(equals(read(signFlag), 1), () => {
            setVariableTo(decodedValue, multiply(-1, read(decodedValue)))
          })
          addToList(decoded, read(decodedValue))
          changeVariableBy(byteIndex, 4)
        })

        setVariableTo(checksum, 0)
        forEach(outputIndex, floatCount, () => {
          changeVariableBy(checksum, getItemOfList(decoded, read(outputIndex)))
        })
        return undefined
      },
      true,
    )

    whenFlagClicked(() => {
      callProcedure(decodeAscii, {})
    })
  })

  return project
}

const benchmarkCount = async (tensorName: string, count: number) => {
  const values = await loadSampleValues(tensorName, count)
  const numbers = Array.from(values)
  const encoded = encodeBase64Url(floatsToBytes(values))
  const direct = await runProject(createDirectProject(numbers))
  const ascii = await runProject(createAsciiProject(encoded, count))
  return {
    count,
    encodedLength: encoded.length,
    direct,
    ascii,
  }
}

const main = async () => {
  await ensureScratchVmCss()

  const tensorName = process.argv[2] ?? DEFAULT_TENSOR_NAME
  const counts = process.argv.slice(3).map(Number).filter(Number.isFinite)
  const selectedCounts = counts.length > 0 ? counts : DEFAULT_COUNTS
  const results = []

  for (const count of selectedCounts) {
    results.push(await benchmarkCount(tensorName, count))
  }

  console.log(JSON.stringify({ tensorName, results }, null, 2))
}

await main()
