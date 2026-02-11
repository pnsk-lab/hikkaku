import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

async function updateExamples() {
  const examplesDir = './examples'
  const dirs = await readdir(examplesDir, { withFileTypes: true })

  for (const dir of dirs) {
    if (dir.isDirectory()) {
      const pkgPath = join(examplesDir, dir.name, 'package.json')
      try {
        const content = await readFile(pkgPath, 'utf8')
        const pkg = JSON.parse(content)
        pkg.scripts = {
          dev: 'vite',
          build: 'vite build',
          typecheck: 'tsgo',
        }
        await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`)
        console.log(`Updated ${pkgPath}`)
      } catch (e) {
        const err = e as NodeJS.ErrnoException
        if (err && err.code === 'ENOENT') {
          // Skip if not a project with package.json
        } else {
          console.error(`Failed to update ${pkgPath}`, e)
        }
      }
    }
  }
}

async function updateGptsZip() {
  const pkgPath = './packages/gpts-zip/package.json'
  try {
    const content = await readFile(pkgPath, 'utf8')
    const pkg = JSON.parse(content)
    delete pkg.scripts.build
    await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`)
    console.log(`Updated ${pkgPath}`)
  } catch (e) {
    console.error(`Failed to update ${pkgPath}`, e)
  }
}

await updateExamples()
await updateGptsZip()
