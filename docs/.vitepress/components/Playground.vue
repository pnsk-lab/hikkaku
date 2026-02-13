<template>
  <section class="playground">
    <header class="playground__header">
      <h2 class="playground__title">Hikkaku Playground</h2>
    </header>
    <div class="playground__body">
      <div ref="editorHost" class="playground__editor"></div>
      <div class="playground__output">
        <div class="playground__output-header">
          <h3 class="playground__output-title">Output</h3>
          <div class="playground__tabs" role="tablist" aria-label="Output view">
            <button
              type="button"
              role="tab"
              class="playground__tab"
              :class="{ 'is-active': activeOutputTab === 'json' }"
              :aria-selected="activeOutputTab === 'json'"
              @click="activeOutputTab = 'json'"
            >
              JSON
            </button>
            <button
              type="button"
              role="tab"
              class="playground__tab"
              :class="{ 'is-active': activeOutputTab === 'blocks' }"
              :aria-selected="activeOutputTab === 'blocks'"
              @click="activeOutputTab = 'blocks'"
            >
              Blocks
            </button>
          </div>
        </div>
        <div class="playground__output-content">
          <template v-if="activeOutputTab === 'json'">
            <p v-if="isInitialLoading" class="playground__loading">Loading...</p>
            <p v-else-if="error" class="playground__error">{{ error }}</p>
            <pre v-else class="playground__output-body">{{ output }}</pre>
          </template>
          <div v-else class="playground__blocks-panel">
            <p v-if="isInitialLoading" class="playground__loading">Loading...</p>
            <template v-else-if="blockTargets.length === 0">
              <p class="playground__loading">No targets available.</p>
              <p v-if="error" class="playground__error">{{ error }}</p>
            </template>
            <div v-else class="playground__blocks-shell">
              <div class="playground__blocks-layout">
                <div class="playground__blocks-editor">
                  <p v-if="!selectedTargetBlocks" class="playground__loading">
                    {{ selectedTargetLabel }} has no blocks.
                  </p>
                  <BlocklyAsync v-else :blocks="selectedTargetBlocks" />
                </div>
                <aside class="playground__sprites">
                  <p class="playground__sprites-title">Sprites</p>
                  <ul class="playground__sprites-list">
                    <li
                      v-for="target in blockTargets"
                      :key="target.key"
                      class="playground__sprites-item"
                    >
                      <button
                        type="button"
                        class="playground__sprite-button"
                        :class="{
                          'is-active': target.key === selectedTargetKey,
                        }"
                        @click="selectedTargetKey = target.key"
                      >
                        <span>{{ target.name }}</span>
                        <span
                          v-if="target.isStage"
                          class="playground__sprite-badge"
                        >
                          Stage
                        </span>
                      </button>
                    </li>
                  </ul>
                </aside>
              </div>
              <div v-if="error" class="playground__blocks-overlay">
                <p class="playground__blocks-overlay-title">Compile error</p>
                <p class="playground__blocks-overlay-message">{{ error }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
/// <reference types="vite/client" />

import * as hikkaku from 'hikkaku'
import * as assets from 'hikkaku/assets'
import * as blocks from 'hikkaku/blocks'
import {
  computed,
  defineAsyncComponent,
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
} from 'vue'
import 'monaco-editor/min/vs/editor/editor.main.css'
import type * as ESBuild from 'esbuild-wasm'
import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api'
import type { PackedBlockMap } from './blocklyXmlCompiler'

type ESBuildModule = typeof import('esbuild-wasm')
type MonacoModule = typeof import('monaco-editor/esm/vs/editor/editor.api')
type RuntimeModuleSpecifier = 'hikkaku' | 'hikkaku/blocks' | 'hikkaku/assets'
type RuntimeModuleMap = Record<RuntimeModuleSpecifier, Record<string, unknown>>
type ScratchProjectLike = { toScratch: () => unknown }
type ScratchTargetLike = { isStage?: boolean; name?: string; blocks?: unknown }
type ScratchProjectJsonLike = { targets?: ScratchTargetLike[] }
type ScratchTargetView = {
  key: string
  name: string
  isStage: boolean
  blocks: unknown
}

const monacoTypeLibsRegisteredKey =
  '__HIKKAKU_PLAYGROUND_MONACO_TYPE_LIBS_REGISTERED__' as const
type MonacoTypeLibStore = typeof globalThis & {
  [monacoTypeLibsRegisteredKey]?: boolean
}

const TS_MODULE_KIND_NODE_NEXT =
  199 as unknown as Monaco.languages.typescript.ModuleKind
const TS_MODULE_RESOLUTION_BUNDLER =
  100 as unknown as Monaco.languages.typescript.ModuleResolutionKind

const hikkakuTypeSourceModules = import.meta.glob(
  [
    '../../../packages/hikkaku/dist/index.d.mts',
    '../../../packages/hikkaku/dist/blocks/index.d.mts',
    '../../../packages/hikkaku/dist/assets/index.d.mts',
    '../../../packages/hikkaku/dist/client/index.d.mts',
    '../../../packages/hikkaku/dist/vite/index.d.mts',
    '../../../packages/hikkaku/dist/project-*.d.mts',
  ],
  {
    eager: true,
    query: '?raw',
    import: 'default',
  },
) as Record<string, string>

const sb3TypeSourceModules = import.meta.glob(
  '../../../node_modules/sb3-types/dist/**/*.d.mts',
  {
    eager: true,
    query: '?raw',
    import: 'default',
  },
) as Record<string, string>

const replacePrefix = (value: string, prefix: string, replacement: string) => {
  if (!value.startsWith(prefix)) return null
  return `${replacement}${value.slice(prefix.length)}`
}

const normalizeTypeSource = (source: string) => {
  // Dist declarations import sibling .mjs files; rewrite to declaration paths
  // so Monaco can resolve the full type graph from extra libs.
  return source.replace(/\.mjs(['"])/g, '.d.mts$1')
}

const registerTypeModuleMap = (
  modules: Record<string, string>,
  sourcePrefix: string,
  virtualPrefix: string,
  monaco: MonacoModule,
) => {
  const defaults = monaco.languages.typescript.typescriptDefaults
  for (const [path, source] of Object.entries(modules)) {
    const virtualPath = replacePrefix(path, sourcePrefix, virtualPrefix)
    if (!virtualPath) continue
    defaults.addExtraLib(normalizeTypeSource(source), virtualPath)
  }
}

const registerMonacoTypeLibraries = (monaco: MonacoModule) => {
  const store = globalThis as MonacoTypeLibStore
  if (store[monacoTypeLibsRegisteredKey]) return

  const hikkakuPathPrefix = '../../../packages/hikkaku/dist/'
  const hikkakuVirtualPrefix = 'file:///node_modules/hikkaku/dist/'
  const sb3PathPrefix = '../../../node_modules/sb3-types/dist/'
  const sb3VirtualPrefix = 'file:///node_modules/sb3-types/dist/'

  registerTypeModuleMap(
    hikkakuTypeSourceModules,
    hikkakuPathPrefix,
    hikkakuVirtualPrefix,
    monaco,
  )
  registerTypeModuleMap(
    sb3TypeSourceModules,
    sb3PathPrefix,
    sb3VirtualPrefix,
    monaco,
  )

  if (Object.keys(hikkakuTypeSourceModules).length === 0) {
    console.warn(
      '[playground] no hikkaku dist declarations found. Run `bun --cwd ../packages/hikkaku build`.',
    )
  }
  if (Object.keys(sb3TypeSourceModules).length === 0) {
    console.warn('[playground] no sb3-types declarations found.')
  }

  store[monacoTypeLibsRegisteredKey] = true
}

const BlocklyLoading = defineComponent({
  name: 'BlocklyLoading',
  setup() {
    return () =>
      h(
        'div',
        { class: 'playground__blockly-loading' },
        'Loading block editor...',
      )
  },
})

const BlocklyAsync = defineAsyncComponent({
  loader: () => import('./Blockly.vue'),
  loadingComponent: BlocklyLoading,
  delay: 0,
  suspensible: false,
})

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
const editorModelRef = shallowRef<Monaco.editor.ITextModel | null>(null)
const editorChangeDisposable = shallowRef<Monaco.IDisposable | null>(null)
const resizeObserver = shallowRef<ResizeObserver | null>(null)
const output = ref('')
const error = ref('')
const isInitialLoading = ref(true)
const activeOutputTab = ref<'json' | 'blocks'>('blocks')
const compiledProject = ref<ScratchProjectJsonLike | null>(null)
const selectedTargetKey = ref<string | null>(null)
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

const isPackedBlockMap = (value: unknown): value is PackedBlockMap => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const isScratchProjectJsonLike = (
  value: unknown,
): value is ScratchProjectJsonLike => {
  if (!value || typeof value !== 'object') return false
  if (!('targets' in value)) return false
  const targets = (value as { targets?: unknown }).targets
  return Array.isArray(targets)
}

const blockTargets = computed<ScratchTargetView[]>(() => {
  const targets = compiledProject.value?.targets ?? []
  return targets.map((target, index) => {
    const isStage = target?.isStage === true
    const fallbackName = isStage ? 'Stage' : `Sprite ${index + 1}`
    const name =
      typeof target?.name === 'string' && target.name.length > 0
        ? target.name
        : fallbackName
    return {
      key: `target-${index}`,
      name,
      isStage,
      blocks: target?.blocks,
    }
  })
})

const selectedTarget = computed<ScratchTargetView | null>(() => {
  if (!selectedTargetKey.value) return null
  return (
    blockTargets.value.find(
      (target) => target.key === selectedTargetKey.value,
    ) ?? null
  )
})

const selectedTargetLabel = computed(
  () => selectedTarget.value?.name ?? 'Target',
)

const selectedTargetBlocks = computed<PackedBlockMap | null>(() => {
  const blocks = selectedTarget.value?.blocks
  return isPackedBlockMap(blocks) ? blocks : null
})

watch(
  blockTargets,
  (targets) => {
    if (targets.length === 0) {
      selectedTargetKey.value = null
      return
    }

    const hasSelected = targets.some(
      (target) => target.key === selectedTargetKey.value,
    )
    if (hasSelected) return

    const firstSprite = targets.find((target) => !target.isStage)
    const fallbackTarget = targets[0]
    if (!fallbackTarget) return
    selectedTargetKey.value = firstSprite?.key ?? fallbackTarget.key
  },
  { immediate: true },
)

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
  if (!monacoRef.value || !editorRef.value) {
    if (runId === latestRunId) {
      error.value = 'Editor is not ready yet.'
    }
    return
  }

  const model = editorRef.value.getModel()
  if (!model) {
    if (runId === latestRunId) {
      error.value = 'Editor model is missing.'
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
      const scratchProject = project.toScratch()
      output.value = JSON.stringify(scratchProject, null, 2)
      if (isScratchProjectJsonLike(scratchProject)) {
        compiledProject.value = scratchProject
      } else {
        error.value = 'Compiled result is not a valid Scratch project JSON.'
      }
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
        'monaco-editor/esm/vs/editor/contrib/suggest/browser/suggestController'
      ),
      import(
        'monaco-editor/esm/vs/editor/contrib/hover/browser/hoverContribution'
      ),
      import(
        'monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution'
      ),
      import('monaco-editor/esm/vs/language/typescript/monaco.contribution'),
    ])

  const existingMonacoEnvironment =
    (
      globalThis as {
        MonacoEnvironment?: {
          getWorker?: (moduleId: string, label: string) => Worker
        }
      }
    ).MonacoEnvironment ?? {}
  ;(
    globalThis as {
      MonacoEnvironment?: {
        getWorker?: (moduleId: string, label: string) => Worker
      }
    }
  ).MonacoEnvironment = {
    ...existingMonacoEnvironment,
    getWorker: (_, label) => {
      if (
        label === 'typescript' ||
        label === 'javascript' ||
        label === 'ts' ||
        label === 'js'
      ) {
        return new TsWorker()
      }
      return new EditorWorker()
    },
  }

  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.ES2020,
    module: TS_MODULE_KIND_NODE_NEXT,
    moduleResolution: TS_MODULE_RESOLUTION_BUNDLER,
    strict: false,
    allowNonTsExtensions: true,
    allowImportingTsExtensions: true,
    baseUrl: 'file:///',
    paths: {
      hikkaku: ['node_modules/hikkaku/dist/index.d.mts'],
      'hikkaku/*': ['node_modules/hikkaku/dist/*'],
      'hikkaku/blocks': ['node_modules/hikkaku/dist/blocks/index.d.mts'],
      'hikkaku/assets': ['node_modules/hikkaku/dist/assets/index.d.mts'],
      'hikkaku/client': ['node_modules/hikkaku/dist/client/index.d.mts'],
      'hikkaku/vite': ['node_modules/hikkaku/dist/vite/index.d.mts'],
      'sb3-types': ['node_modules/sb3-types/dist/mod.d.mts'],
      'sb3-types/enum': ['node_modules/sb3-types/dist/enums/index.d.mts'],
      'sb3-types/*': ['node_modules/sb3-types/dist/*'],
    },
  })
  monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true)
  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSyntaxValidation: false,
  })
  registerMonacoTypeLibraries(monaco)

  const editorModel = monaco.editor.createModel(
    defaultCode,
    'typescript',
    monaco.Uri.parse('file:///playground/main.ts'),
  )

  const editor = monaco.editor.create(editorHost.value, {
    model: editorModel,
    automaticLayout: false,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    suggestOnTriggerCharacters: true,
    quickSuggestions: {
      other: true,
      comments: false,
      strings: true,
    },
    hover: {
      enabled: true,
    },
    fontSize: 14,
  })

  monacoRef.value = monaco
  editorRef.value = editor
  editorModelRef.value = editorModel

  try {
    const getTsWorker = await monaco.languages.typescript.getTypeScriptWorker()
    await getTsWorker(editorModel.uri)
  } catch (caught) {
    console.error('[playground] failed to initialize TypeScript worker', caught)
  }

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
  editorModelRef.value?.dispose()
  disposeRuntimeModules()
})
</script>

<style scoped>
:global(.Layout.playground-page .VPDoc) {
  padding: 0;
}

:global(.Layout.playground-page .VPDoc .content-container) {
  width: 100%;
  max-width: none;
}

:global(.Layout.playground-page .VPDoc .VPDocFooter) {
  display: none;
}

:global(.Layout.playground-page .VPDoc:not(.has-sidebar) .container) {
  max-width: none;
}

:global(.Layout.playground-page .VPDoc:not(.has-sidebar) .content) {
  width: 100%;
  max-width: none;
}

@media (min-width: 960px) {
  :global(.Layout.playground-page .VPDoc .content) {
    padding: 0;
  }
}

.playground {
  --playground-page-padding: clamp(16px, 4vw, 3rem);
  --playground-viewport-height: calc(
    100dvh - var(--vp-nav-height) - var(--vp-layout-top-height, 0px)
  );
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 100%;
  margin-inline: 0;
  height: var(--playground-viewport-height);
  max-height: var(--playground-viewport-height);
  min-height: 0;
  padding-bottom: 3rem;
  padding-inline: var(--playground-page-padding);
  box-sizing: border-box;
  overflow-x: clip;
  overflow-y: hidden;
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
  flex: 1;
  min-height: 0;
}

.playground__editor {
  height: 100%;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
}

.playground__output {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 12px;
  background: var(--vp-c-bg-soft);
  overflow: hidden;
}

.playground__output-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 0 0 8px;
}

.playground__output-title {
  margin: 0;
  font-size: 1rem;
}

.playground__tabs {
  display: inline-flex;
  gap: 4px;
  padding: 3px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  background: var(--vp-c-bg);
}

.playground__tab {
  border: 0;
  background: transparent;
  color: var(--vp-c-text-2);
  border-radius: 999px;
  padding: 4px 10px;
  line-height: 1.2;
  cursor: pointer;
  font-size: 0.85rem;
}

.playground__tab.is-active {
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-soft);
}

.playground__error {
  margin: 0 0 8px;
  color: var(--vp-c-danger-1);
  font-size: 0.95rem;
}

.playground__output-content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
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

.playground__blocks-panel {
  flex: 1;
  min-height: 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
  background: var(--vp-c-bg);
}

.playground__blocks-shell {
  position: relative;
  height: 100%;
  min-height: 0;
}

.playground__blocks-layout {
  height: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 220px;
  min-height: 0;
}

.playground__blocks-editor {
  min-height: 0;
}

.playground__blockly-loading {
  height: 100%;
  display: grid;
  place-items: center;
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
}

.playground__blocks-panel > .playground__loading,
.playground__blocks-panel > .playground__error {
  margin: 0;
  padding: 12px;
}

.playground__blocks-editor > .playground__loading {
  margin: 0;
  padding: 12px;
}

.playground__blocks-overlay {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.85);
  background: color-mix(in srgb, var(--vp-c-bg) 85%, transparent);
  backdrop-filter: blur(2px);
}

.playground__blocks-overlay-title {
  margin: 0;
  color: var(--vp-c-danger-1);
  font-weight: 600;
  font-size: 0.95rem;
}

.playground__blocks-overlay-message {
  margin: 0;
  color: var(--vp-c-danger-1);
  font-size: 0.9rem;
  line-height: 1.4;
  white-space: pre-wrap;
  overflow: auto;
}

.playground__sprites {
  border-left: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.playground__sprites-title {
  margin: 0;
  padding: 10px 12px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--vp-c-text-2);
  border-bottom: 1px solid var(--vp-c-divider);
}

.playground__sprites-list {
  margin: 0;
  padding: 8px;
  list-style: none;
  overflow: auto;
  display: grid;
  gap: 6px;
}

.playground__sprites-item {
  margin: 0;
}

.playground__sprite-button {
  width: 100%;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  text-align: left;
  padding: 8px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  cursor: pointer;
}

.playground__sprite-button.is-active {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 0 1px var(--vp-c-brand-1) inset;
}

.playground__sprite-badge {
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
}

@media (max-width: 960px) {
  .playground__body {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 680px) {
  .playground__blocks-layout {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(0, 1fr) auto;
  }

  .playground__sprites {
    border-left: 0;
    border-top: 1px solid var(--vp-c-divider);
    max-height: 180px;
  }
}
</style>
