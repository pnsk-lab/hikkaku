// tmp ディレクトリを作成

import { mkdir } from 'node:fs/promises'
import { $ } from 'bun'

await mkdir('.tmp', { recursive: true })

// skills をコピーしてくる
await $`cp -r ../skill/hikkaku .tmp/skill`

// node_modules を作成する

await $`mkdir -p .tmp/node_modules`
await $`cp -r ../hikkaku/dist .tmp/node_modules/hikkaku`

const NECESSARY_PACKAGES = ['sb3-types', '@typescript', '@types/node']
await $`mkdir -p .tmp/node_modules/@types`
for (const pkg of NECESSARY_PACKAGES) {
  await $`cp -r ./node_modules/${pkg} .tmp/node_modules/${pkg}`
}

// ファイルを置く
await Bun.write(
  '.tmp/package.json',
  JSON.stringify({
    name: 'my-hikkaku-project',
    scripts: {
      typecheck: 'node ./node_modules/@typescript/native-preview/bin/tsgo.js',
      build:
        'node --experimental-strip-types --experimental-transform-types --experimental-detect-module --no-warnings=ExperimentalWarning ./src/main.ts',
    },
  }),
)

await Bun.write(
  '.tmp/src/main.ts',
  `import { Project } from 'hikkaku'
import { CAT_A } from 'hikkaku/assets'
import { forever, moveSteps, whenFlagClicked } from 'hikkaku/blocks'
import { writeFileSync } from 'node:fs'

const project = new Project()

const cat = project.createSprite('cat')

cat.addCostume({
  ...CAT_A,
  name: 'cat-a',
})
cat.run(() => {
  whenFlagClicked(() => {
    forever(() => {
      moveSteps(1)
    })
  })
})

writeFileSync('./project.json', JSON.stringify(project.toScratch(), null, 2))
`,
)

await Bun.write(
  '.tmp/tsconfig.json',
  JSON.stringify({
    compilerOptions: {
      // Environment setup & latest features
      lib: ['ESNext'],
      target: 'ESNext',
      module: 'Preserve',
      moduleDetection: 'force',
      jsx: 'react-jsx',
      allowJs: true,

      // Bundler mode
      moduleResolution: 'bundler',
      allowImportingTsExtensions: true,
      verbatimModuleSyntax: true,
      noEmit: true,

      // Best practices
      strict: true,
      skipLibCheck: true,
      noFallthroughCasesInSwitch: true,
      noUncheckedIndexedAccess: true,
      noImplicitOverride: true,

      // Some stricter flags (disabled by default)
      noUnusedLocals: false,
      noUnusedParameters: false,
      noPropertyAccessFromIndexSignature: false,
    },
  }),
)

import { readdirSync, readFileSync } from 'node:fs'
// .tmp を zip にする
import { zipSync } from 'fflate'

function getFilesRecursively(
  dir: string,
  basePath = dir,
): Record<string, Uint8Array> {
  const entries = readdirSync(dir, { withFileTypes: true })
  const files: Record<string, Uint8Array> = {}

  for (const entry of entries) {
    const fullPath = `${dir}/${entry.name}`
    const relativePath = fullPath.slice(basePath.length + 1)

    if (entry.isDirectory()) {
      Object.assign(files, getFilesRecursively(fullPath, basePath))
    } else if (entry.isFile()) {
      const content = readFileSync(fullPath)
      files[relativePath] = new Uint8Array(content)
    }
  }

  return files
}

const files = getFilesRecursively('.tmp')
const zipData = zipSync(files)

await Bun.write('dist.zip', zipData)

console.log('Created dist.zip')
