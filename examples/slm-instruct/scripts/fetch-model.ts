import { mkdir } from 'node:fs/promises'

const readEnv = (primary: string, legacy: string, fallback: string) =>
  process.env[primary] ?? process.env[legacy] ?? fallback

const DEFAULT_REVISION = 'main'
const DEFAULT_REPO = 'SmallDoge/Doge-60M-Instruct'
const REPO = readEnv('SLM_MODEL_REPO', 'DOGE_MODEL_REPO', DEFAULT_REPO)
const REVISION = readEnv(
  'SLM_MODEL_REVISION',
  'DOGE_MODEL_REVISION',
  DEFAULT_REVISION,
)
const FILES = [
  'config.json',
  'configuration_doge.py',
  'generation_config.json',
  'modeling_doge.py',
  'special_tokens_map.json',
  'tokenizer.json',
  'tokenizer_config.json',
  'model.safetensors',
] as const

const artifactDir = new URL('../artifacts/', import.meta.url)

await mkdir(artifactDir, { recursive: true })
await Bun.write(new URL('.keep', artifactDir), '')
await Bun.write(new URL('revision.txt', artifactDir), `${REVISION}\n`)
await Bun.write(
  new URL('model-source.json', artifactDir),
  `${JSON.stringify(
    {
      repo: REPO,
      revision: REVISION,
      files: FILES,
    },
    null,
    2,
  )}\n`,
)

for (const file of FILES) {
  const url = `https://huggingface.co/${REPO}/resolve/${REVISION}/${file}`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${file}: ${response.status} ${response.statusText}`,
    )
  }
  const path = new URL(file, artifactDir)
  await Bun.write(path, await response.bytes())
  console.log(`fetched ${file}`)
}
