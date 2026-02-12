import { spawn } from 'node:child_process'
import {
  access,
  mkdir,
  readdir,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadPackager } from '../../packages/vite-plugin-turbowarp-packager/src/packager.ts'

type ShowcaseEntry = {
  id: string
  title: string
  path: string
  status: 'ok' | 'error'
  error?: string
}

const decoder = new TextDecoder()
const SCRATCH_ASSET_TEST_URL =
  'https://assets.scratch.mit.edu/internalapi/asset/cd21514d0531fdffb22204e0ec5ed84a.svg/get/'
const scriptsDir = path.dirname(fileURLToPath(import.meta.url))
const docsDir = path.resolve(scriptsDir, '..')
const repoRoot = path.resolve(docsDir, '..')
const examplesDir = path.join(repoRoot, 'examples')
const showcaseDir = path.join(docsDir, 'public', 'showcase')

const pathExists = async (targetPath: string) => {
  try {
    await access(targetPath)
    return true
  } catch {
    return false
  }
}

const runCommand = async (command: string, args: string[], cwd: string) =>
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: process.env,
      stdio: 'inherit',
    })
    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) {
        resolve()
        return
      }
      reject(
        new Error(
          `Command failed (${code}): ${[command, ...args].join(' ')} in ${cwd}`,
        ),
      )
    })
  })

const toTitle = (id: string) =>
  id
    .split('-')
    .map((segment) =>
      segment.length === 0
        ? segment
        : `${segment[0]?.toUpperCase() ?? ''}${segment.slice(1)}`,
    )
    .join(' ')

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

const createFallbackHtml = (
  exampleId: string,
  reason: string,
) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(exampleId)} - showcase error</title>
    <style>
      :root {
        color-scheme: light;
      }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
        background: #111827;
        color: #f8fafc;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
          'Liberation Mono', 'Courier New', monospace;
      }
      main {
        width: min(800px, 100%);
        border: 1px solid #334155;
        border-radius: 12px;
        background: #0f172a;
        padding: 16px;
      }
      h1 {
        margin: 0 0 12px;
        font-size: 18px;
      }
      pre {
        margin: 0;
        white-space: pre-wrap;
        word-break: break-word;
        color: #fca5a5;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Failed to build ${escapeHtml(exampleId)} with TurboWarp Packager</h1>
      <pre>${escapeHtml(reason)}</pre>
    </main>
  </body>
</html>
`

const canReachScratchAssets = async () => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 2000)
  try {
    const response = await fetch(SCRATCH_ASSET_TEST_URL, {
      signal: controller.signal,
    })
    return response.ok
  } catch {
    return false
  } finally {
    clearTimeout(timeout)
  }
}

const collectExampleIds = async () => {
  const entries = await readdir(examplesDir, { withFileTypes: true })
  const exampleIds: string[] = []

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue
    }

    const projectDir = path.join(examplesDir, entry.name)
    const packageJsonPath = path.join(projectDir, 'package.json')
    const mainPath = path.join(projectDir, 'src', 'main.ts')
    if (!(await pathExists(packageJsonPath)) || !(await pathExists(mainPath))) {
      continue
    }

    exampleIds.push(entry.name)
  }

  return exampleIds.sort()
}

const main = async () => {
  const exampleIds = await collectExampleIds()
  if (exampleIds.length === 0) {
    throw new Error('No examples were found in examples/.')
  }

  await rm(showcaseDir, { recursive: true, force: true })
  await mkdir(showcaseDir, { recursive: true })

  const { loadProject, Packager } = await loadPackager()
  const manifest: ShowcaseEntry[] = []
  let successCount = 0
  let fallbackCount = 0
  const canPackage = await canReachScratchAssets()

  if (!canPackage) {
    console.warn(
      '[showcase] scratch asset host is unreachable. Generating fallback pages instead of packaged HTML.',
    )
  }

  for (const exampleId of exampleIds) {
    const projectDir = path.join(examplesDir, exampleId)
    const sb3Path = path.join(projectDir, 'dist', 'project.sb3')
    const outputDir = path.join(showcaseDir, exampleId)
    let html = ''
    let status: ShowcaseEntry['status'] = 'ok'
    let error: string | undefined

    try {
      console.log(`[showcase] building ${exampleId}`)
      await runCommand('bun', ['run', 'build'], projectDir)

      if (canPackage) {
        const sb3Buffer = await readFile(sb3Path)
        const project = await loadProject(sb3Buffer)
        const packager = new Packager()
        packager.options = {
          ...packager.options,
          target: 'html',
        }
        packager.project = project

        const packageResult = await packager.package()
        html =
          typeof packageResult.data === 'string'
            ? packageResult.data
            : decoder.decode(packageResult.data)
        successCount += 1
      } else {
        status = 'error'
        error = 'Scratch asset host is unreachable in this environment.'
        html = createFallbackHtml(exampleId, error)
        fallbackCount += 1
      }
    } catch (caughtError) {
      status = 'error'
      error =
        caughtError instanceof Error ? caughtError.message : String(caughtError)
      html = createFallbackHtml(exampleId, error)
      fallbackCount += 1
      console.warn(`[showcase] fallback ${exampleId}: ${error}`)
    }

    await mkdir(outputDir, { recursive: true })
    await writeFile(path.join(outputDir, 'index.html'), html)

    manifest.push({
      id: exampleId,
      title: toTitle(exampleId),
      path: `/showcase/${exampleId}/index.html`,
      status,
      error,
    })
  }

  await writeFile(
    path.join(showcaseDir, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  )

  console.log(
    `[showcase] generated ${manifest.length} examples (${successCount} packaged, ${fallbackCount} fallback)`,
  )
}

await main()
