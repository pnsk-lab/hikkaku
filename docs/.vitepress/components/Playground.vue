<template>
  <section class="playground">
    <header class="playground__header">
      <h2 class="playground__title">Hikkaku Playground</h2>
    </header>
    <div class="playground__body">
      <div ref="editorHost" class="playground__editor"></div>
      <div class="playground__output">
        <h3 class="playground__output-title">project.json</h3>
        <p v-if="isInitialLoading" class="playground__loading">Loading...</p>
        <p v-if="error" class="playground__error">{{ error }}</p>
        <pre class="playground__output-body">{{ output }}</pre>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import * as hikkaku from 'hikkaku'
import * as assets from 'hikkaku/assets'
import * as blocks from 'hikkaku/blocks'
import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import 'monaco-editor/min/vs/editor/editor.main.css'

import type * as ESBuild from 'esbuild-wasm'
import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api'

type ESBuildModule = typeof import('esbuild-wasm')
type MonacoModule = typeof import('monaco-editor/esm/vs/editor/editor.api')
type RuntimeModuleSpecifier = 'hikkaku' | 'hikkaku/blocks' | 'hikkaku/assets'
type RuntimeModuleMap = Record<RuntimeModuleSpecifier, Record<string, unknown>>
type ScratchProjectLike = { toScratch: () => unknown }

const defaultCode = `import { Project } from 'hikkaku'
import { whenFlagClicked, say } from 'hikkaku/blocks'

const project = new Project()

project.stage.run(() => {
  whenFlagClicked(() => {
    say('Hello from Hikkaku!')
  })
})

export default project
`

const editorHost = ref<HTMLDivElement | null>(null)
const monacoRef = shallowRef<MonacoModule | null>(null)
const editorRef = shallowRef<Monaco.editor.IStandaloneCodeEditor | null>(null)
const editorChangeDisposable = shallowRef<Monaco.IDisposable | null>(null)
const resizeObserver = shallowRef<ResizeObserver | null>(null)
const output = ref('')
const error = ref('')
const isInitialLoading = ref(true)
let runDebounceTimer: ReturnType<typeof setTimeout> | null = null
let latestRunId = 0
const esbuildInitPromiseKey =
  '__HIKKAKU_PLAYGROUND_ESBUILD_INIT_PROMISE__' as const
const runtimeGlobalKey = `__HIKKAKU_PLAYGROUND_RUNTIME__${Math.random()
  .toString(36)
  .slice(2)}`
const runtimeModuleUrls = new Map<RuntimeModuleSpecifier, string>()
const runtimeModules: RuntimeModuleMap = {
  hikkaku: hikkaku as Record<string, unknown>,
  'hikkaku/blocks': blocks as Record<string, unknown>,
  'hikkaku/assets': assets as Record<string, unknown>,
}

const isProjectLike = (value: unknown): value is ScratchProjectLike => {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { toScratch?: unknown }).toScratch === 'function'
  )
}

const escapeRegExp = (value: string) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const isIdentifierName = (value: string) => {
  return /^[$A-Z_][0-9A-Z_$]*$/i.test(value)
}

const createRuntimeModuleSource = (
  specifier: RuntimeModuleSpecifier,
  moduleObject: Record<string, unknown>,
) => {
  const runtimeAccessor = `globalThis[${JSON.stringify(runtimeGlobalKey)}][${JSON.stringify(specifier)}]`
  const lines = [`export default ${runtimeAccessor}`]

  const exportNames = Object.keys(moduleObject)
    .filter((name) => name !== 'default' && isIdentifierName(name))
    .sort((a, b) => a.localeCompare(b))
  for (const exportName of exportNames) {
    lines.push(
      `export const ${exportName} = ${runtimeAccessor}[${JSON.stringify(exportName)}]`,
    )
  }

  return lines.join('\n')
}

const getRuntimeModuleUrl = (specifier: RuntimeModuleSpecifier) => {
  const cachedUrl = runtimeModuleUrls.get(specifier)
  if (cachedUrl) {
    return cachedUrl
  }

  const source = createRuntimeModuleSource(specifier, runtimeModules[specifier])
  const url = URL.createObjectURL(
    new Blob([source], { type: 'text/javascript' }),
  )
  runtimeModuleUrls.set(specifier, url)
  return url
}

const rewriteRuntimeImports = (source: string) => {
  let rewrittenSource = source
  for (const specifier of Object.keys(
    runtimeModules,
  ) as RuntimeModuleSpecifier[]) {
    const url = getRuntimeModuleUrl(specifier)
    const escapedSpecifier = escapeRegExp(specifier)
    const fromPattern = new RegExp(
      `(from\\s*['"])${escapedSpecifier}(['"])`,
      'g',
    )
    const dynamicImportPattern = new RegExp(
      `(import\\(\\s*['"])${escapedSpecifier}(['"]\\s*\\))`,
      'g',
    )

    rewrittenSource = rewrittenSource
      .replace(fromPattern, `$1${url}$2`)
      .replace(dynamicImportPattern, `$1${url}$2`)
  }

  return rewrittenSource
}

const importUserModule = async (source: string) => {
  const runtimeStore = globalThis as Record<string, unknown>
  runtimeStore[runtimeGlobalKey] = runtimeModules

  const rewrittenSource = rewriteRuntimeImports(source)
  const moduleUrl = URL.createObjectURL(
    new Blob([rewrittenSource], { type: 'text/javascript' }),
  )

  try {
    return await import(/* @vite-ignore */ moduleUrl)
  } finally {
    URL.revokeObjectURL(moduleUrl)
  }
}

const disposeRuntimeModules = () => {
  for (const url of runtimeModuleUrls.values()) {
    URL.revokeObjectURL(url)
  }
  runtimeModuleUrls.clear()

  const runtimeStore = globalThis as Record<string, unknown>
  delete runtimeStore[runtimeGlobalKey]
}

type EsbuildGlobalStore = typeof globalThis & {
  [esbuildInitPromiseKey]?: Promise<ESBuildModule>
}

const loadEsbuild = async () => {
  const globalStore = globalThis as EsbuildGlobalStore
  if (!globalStore[esbuildInitPromiseKey]) {
    globalStore[esbuildInitPromiseKey] = (async () => {
      const [{ default: wasmURL }, esbuild] = await Promise.all([
        import('esbuild-wasm/esbuild.wasm?url'),
        import('esbuild-wasm'),
      ])

      await esbuild.initialize({
        wasmURL,
        worker: true,
      })

      return esbuild
    })()
  }

  try {
    return await globalStore[esbuildInitPromiseKey]
  } catch (caught) {
    delete globalStore[esbuildInitPromiseKey]
    throw caught
  }
}

const getEsbuildErrorMessage = (failure: ESBuild.TransformFailure) => {
  const firstError = failure.errors[0]
  if (!firstError) {
    return failure.message
  }

  const location = firstError.location
  if (!location) {
    return firstError.text
  }

  return `${firstError.text} (line ${location.line}, column ${location.column + 1})`
}

const scheduleRun = () => {
  if (runDebounceTimer) {
    clearTimeout(runDebounceTimer)
  }

  runDebounceTimer = setTimeout(() => {
    runDebounceTimer = null
    void run()
  }, 250)
}

const run = async () => {
  const runId = ++latestRunId
  error.value = ''
  output.value = ''
  if (!monacoRef.value || !editorRef.value) {
    if (runId === latestRunId) {
      error.value = 'Editor is not ready yet.'
    }
    return
  }

  const monaco = monacoRef.value
  const model = editorRef.value.getModel()
  if (!model) {
    if (runId === latestRunId) {
      error.value = 'Editor model is missing.'
    }
    return
  }

  const markers = monaco.editor.getModelMarkers({ resource: model.uri })
  const errorMarker = markers.find(
    (marker) => marker.severity === monaco.MarkerSeverity.Error,
  )
  if (errorMarker) {
    if (runId === latestRunId) {
      error.value = `${errorMarker.message} (line ${errorMarker.startLineNumber})`
    }
    return
  }

  try {
    const esbuild = await loadEsbuild()
    const result = await esbuild.transform(model.getValue(), {
      loader: 'ts',
      format: 'esm',
      target: 'es2020',
      sourcefile: model.uri.toString(),
    })

    if (runId !== latestRunId) {
      return
    }

    const userModule = await importUserModule(result.code)
    const project = userModule.default

    if (!isProjectLike(project)) {
      if (runId === latestRunId) {
        error.value = 'Export a Project instance with `export default project`.'
      }
      return
    }

    if (runId === latestRunId) {
      output.value = JSON.stringify(project.toScratch(), null, 2)
    }
  } catch (caught) {
    console.error(caught)
    const message =
      caught &&
      typeof caught === 'object' &&
      'errors' in caught &&
      Array.isArray((caught as { errors?: unknown }).errors)
        ? getEsbuildErrorMessage(caught as ESBuild.TransformFailure)
        : caught instanceof Error
          ? caught.message
          : 'Unknown error'
    if (runId === latestRunId) {
      error.value = message
    }
  } finally {
    if (runId === latestRunId) {
      isInitialLoading.value = false
    }
  }
}

onMounted(async () => {
  if (!editorHost.value) {
    return
  }

  const [monaco, { default: EditorWorker }, { default: TsWorker }] =
    await Promise.all([
      import('monaco-editor/esm/vs/editor/editor.api'),
      import('monaco-editor/esm/vs/editor/editor.worker?worker'),
      import('monaco-editor/esm/vs/language/typescript/ts.worker?worker'),
      import(
        'monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution'
      ),
      import('monaco-editor/esm/vs/language/typescript/monaco.contribution'),
    ])

  if (!globalThis.MonacoEnvironment) {
    globalThis.MonacoEnvironment = {
      getWorker: (_, label) => {
        if (label === 'typescript' || label === 'javascript') {
          return new TsWorker()
        }
        return new EditorWorker()
      },
    }
  }

  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.ES2020,
    module: monaco.languages.typescript.ModuleKind.ESNext,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    strict: false,
    allowNonTsExtensions: true,
  })
  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: false,
  })

  const editor = monaco.editor.create(editorHost.value, {
    value: defaultCode,
    language: 'typescript',
    automaticLayout: false,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    fontSize: 14,
  })

  monacoRef.value = monaco
  editorRef.value = editor
  editorChangeDisposable.value = editor.onDidChangeModelContent(() => {
    scheduleRun()
  })
  resizeObserver.value = new ResizeObserver(() => {
    editor.layout()
  })
  resizeObserver.value.observe(editorHost.value)

  await run()
})

onBeforeUnmount(() => {
  if (runDebounceTimer) {
    clearTimeout(runDebounceTimer)
  }
  editorChangeDisposable.value?.dispose()
  resizeObserver.value?.disconnect()
  editorRef.value?.dispose()
  disposeRuntimeModules()
})
</script>

<style scoped>
.playground {
  --playground-page-padding: clamp(16px, 2.8vw, 32px);
  --playground-panel-height: max(
    320px,
    min(720px, calc(100dvh - var(--vp-nav-height) - 190px))
  );
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100dvw;
  max-width: 100dvw;
  margin-inline: calc(50% - 50dvw);
  padding-inline: var(--playground-page-padding);
  box-sizing: border-box;
}

.playground__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.playground__title {
  margin: 0;
  font-size: 1.25rem;
}

.playground__loading {
  margin: 0 0 8px;
  color: var(--vp-c-text-2);
  font-size: 0.95rem;
}

.playground__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px;
}

.playground__editor {
  height: var(--playground-panel-height);
  max-height: 100dvh;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
}

.playground__output {
  height: var(--playground-panel-height);
  max-height: 100dvh;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 12px;
  background: var(--vp-c-bg-soft);
  overflow: hidden;
}

.playground__output-title {
  margin: 0 0 8px;
  font-size: 1rem;
}

.playground__error {
  margin: 0 0 8px;
  color: var(--vp-c-danger-1);
  font-size: 0.95rem;
}

.playground__output-body {
  margin: 0;
  flex: 1;
  min-height: 0;
  overflow: auto;
  font-size: 0.85rem;
  line-height: 1.4;
  white-space: pre;
}

@media (max-width: 960px) {
  .playground__body {
    grid-template-columns: 1fr;
  }
}
</style>
