#!/usr/bin/env node

import { spawn } from 'node:child_process'
import { createWriteStream } from 'node:fs'
import {
  access,
  copyFile,
  cp,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { stdin as input, stdout as output } from 'node:process'
import { createInterface } from 'node:readline/promises'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'
import { detect, getUserAgent } from 'package-manager-detector/detect'
import pc from 'picocolors'

const REPO_OWNER = 'pnsk-lab'
const REPO_NAME = 'hikkaku'
const CREATE_HIKKAKU_TAG_PREFIX = 'create-hikkaku@'
const TEMPLATE_DIR_IN_REPO = ['examples', 'base']
const DEFAULT_PROJECT_DIR = 'my-hikkaku-app'
const SEMVER_PATTERN =
  /^[0-9]+\.[0-9]+\.[0-9]+([.-][0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$/
const SELF_PACKAGE_JSON_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../package.json',
)

const STANDALONE_TSCONFIG = {
  compilerOptions: {
    lib: ['ESNext', 'DOM'],
    target: 'ESNext',
    module: 'Preserve',
    moduleDetection: 'force',
    jsx: 'react-jsx',
    allowJs: true,
    moduleResolution: 'bundler',
    allowImportingTsExtensions: true,
    verbatimModuleSyntax: true,
    noEmit: true,
    strict: true,
    skipLibCheck: true,
    noFallthroughCasesInSwitch: true,
    noUncheckedIndexedAccess: true,
    noImplicitOverride: true,
    noUnusedLocals: false,
    noUnusedParameters: false,
    noPropertyAccessFromIndexSignature: false,
    types: ['vite/client'],
  },
  include: ['src'],
}

const PM_VALUES = ['bun', 'deno', 'npm', 'pnpm', 'yarn']

const banner = () => {
  console.log(pc.bold(pc.cyan('create-hikkaku')))
  console.log(pc.dim('Scaffold a new Hikkaku project from examples/base'))
  console.log('')
}

const log = (message) => {
  console.log(`${pc.blue('>')} ${message}`)
}

const success = (message) => {
  console.log(`${pc.green('[ok]')} ${message}`)
}

const warning = (message) => {
  console.log(`${pc.yellow('[warn]')} ${message}`)
}

const fatal = (message) => {
  console.error(`${pc.red('[error]')} ${message}`)
}

const pathExists = async (filePath) => {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

const normalizePackageManager = (value) => {
  if (!value) return undefined

  const normalized = value.toLowerCase()
  if (normalized.startsWith('pnpm')) return 'pnpm'
  if (normalized.startsWith('yarn')) return 'yarn'
  if (normalized.startsWith('npm')) return 'npm'
  if (normalized.startsWith('bun')) return 'bun'
  if (normalized.startsWith('deno')) return 'deno'
  return undefined
}

const detectPackageManagerFromRuntimeFallback = () => {
  if (process.versions?.bun) return 'bun'
  if (process.versions?.deno) return 'deno'

  // Deno runtime can expose this even in Node-compat mode.
  const denoVersion = (globalThis as { Deno?: { version?: { deno?: string } } })
    .Deno?.version?.deno
  if (denoVersion) return 'deno'

  return undefined
}

const detectPackageManager = async () => {
  const userAgent = normalizePackageManager(getUserAgent())
  if (userAgent) return userAgent

  const runtime = detectPackageManagerFromRuntimeFallback()
  if (runtime) return runtime

  const detected = await detect({
    cwd: process.cwd(),
    strategies: [
      'install-metadata',
      'lockfile',
      'packageManager-field',
      'devEngines-field',
    ],
  })
  const fromDetector = normalizePackageManager(
    detected?.agent ?? detected?.name,
  )
  if (fromDetector) return fromDetector

  return 'npm'
}

const toPackageName = (value) => {
  const cleaned = value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/^[._-]+/, '')
    .replace(/[^a-z0-9~-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/-$/, '')

  if (!cleaned) return 'hikkaku-app'
  if (/^[a-z~]/.test(cleaned)) return cleaned
  return `hikkaku-${cleaned}`
}

const shellQuote = (value) => {
  if (!value) return "''"
  if (/^[A-Za-z0-9_./:@-]+$/.test(value)) return value
  return `'${value.replace(/'/g, "'\\''")}'`
}

const parseBooleanOption = (arg, enabled, disabled) => {
  if (arg === enabled) return true
  if (arg === disabled) return false
  return undefined
}

const parseCliArgs = (argv) => {
  const parsed = {
    help: false,
    yes: false,
    projectDir: undefined,
    packageManager: undefined,
    includeAgents: undefined,
    linkClaude: undefined,
    addSkills: undefined,
    ref: undefined,
  }

  const positionals = []
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    const includeAgents = parseBooleanOption(arg, '--agents', '--no-agents')
    const linkClaude = parseBooleanOption(
      arg,
      '--link-claude',
      '--no-link-claude',
    )
    const addSkills = parseBooleanOption(arg, '--skills', '--no-skills')

    if (includeAgents !== undefined) {
      parsed.includeAgents = includeAgents
      continue
    }

    if (linkClaude !== undefined) {
      parsed.linkClaude = linkClaude
      continue
    }

    if (addSkills !== undefined) {
      parsed.addSkills = addSkills
      continue
    }

    if (arg === '-h' || arg === '--help') {
      parsed.help = true
      continue
    }

    if (arg === '-y' || arg === '--yes') {
      parsed.yes = true
      continue
    }

    if (arg === '--pm' || arg === '--package-manager') {
      const next = argv[i + 1]
      if (!next) {
        throw new Error(`${arg} requires a value`)
      }
      parsed.packageManager = next
      i++
      continue
    }

    if (arg.startsWith('--pm=')) {
      parsed.packageManager = arg.slice('--pm='.length)
      continue
    }

    if (arg.startsWith('--package-manager=')) {
      parsed.packageManager = arg.slice('--package-manager='.length)
      continue
    }

    if (arg === '--ref') {
      const next = argv[i + 1]
      if (!next) {
        throw new Error('--ref requires a value')
      }
      parsed.ref = next
      i++
      continue
    }

    if (arg.startsWith('--ref=')) {
      parsed.ref = arg.slice('--ref='.length)
      continue
    }

    if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`)
    }

    positionals.push(arg)
  }

  if (positionals.length > 1) {
    throw new Error(
      `Expected at most 1 positional argument, got ${positionals.length}`,
    )
  }

  if (positionals[0]) {
    parsed.projectDir = positionals[0]
  }

  if (parsed.packageManager) {
    const normalized = normalizePackageManager(parsed.packageManager)
    if (!normalized) {
      throw new Error(
        `Unsupported package manager "${parsed.packageManager}". Use one of: ${PM_VALUES.join(
          ', ',
        )}`,
      )
    }
    parsed.packageManager = normalized
  }

  return parsed
}

const printHelp = () => {
  console.log(
    `Usage: create-hikkaku [project-name] [options]

Options:
  -y, --yes                    Skip prompts and use defaults
  -h, --help                   Show this help
  --pm, --package-manager <pm> Force package manager (${PM_VALUES.join(', ')})
  --agents / --no-agents       Include AGENTS.md
  --link-claude / --no-link-claude
                               Create CLAUDE.md -> AGENTS.md symlink
  --skills / --no-skills       Add hikkaku skills after scaffolding
  --ref <git-tag>              GitHub tag to download (default: create-hikkaku@<version>)
`,
  )
}

const getDefaultRefFromPackageVersion = async () => {
  const pkg = JSON.parse(await readFile(SELF_PACKAGE_JSON_PATH, 'utf8'))
  const version = typeof pkg.version === 'string' ? pkg.version.trim() : ''
  if (!version || !SEMVER_PATTERN.test(version)) {
    throw new Error(
      `Invalid create-hikkaku version "${version}". Expected semver for default ref resolution.`,
    )
  }
  return `${CREATE_HIKKAKU_TAG_PREFIX}${version}`
}

const createPrompter = () => {
  const rl = createInterface({ input, output })

  const askText = async (question, defaultValue) => {
    const label = defaultValue
      ? `${question} ${pc.dim(`(${defaultValue})`)}`
      : question

    const answer = (await rl.question(`${pc.magenta('?')} ${label}: `)).trim()
    return answer || defaultValue || ''
  }

  const askYesNo = async (question, defaultValue) => {
    while (true) {
      const suffix = defaultValue ? 'Y/n' : 'y/N'
      const answer = (
        await rl.question(
          `${pc.magenta('?')} ${question} ${pc.dim(`(${suffix})`)}: `,
        )
      )
        .trim()
        .toLowerCase()

      if (!answer) return defaultValue
      if (answer === 'y' || answer === 'yes') return true
      if (answer === 'n' || answer === 'no') return false
      console.log(pc.yellow('Please answer with y or n.'))
    }
  }

  return {
    askText,
    askYesNo,
    close: () => rl.close(),
  }
}

const runCommand = async (command, args, options = {}) => {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      ...options,
    })

    child.on('error', (error) => {
      reject(error)
    })

    child.on('close', (code) => {
      if (code === 0) {
        resolve(undefined)
        return
      }
      reject(new Error(`"${command}" exited with code ${code}`))
    })
  })
}

const downloadTarball = async (url, destinationPath) => {
  const response = await fetch(url)
  if (!response.ok || !response.body) {
    throw new Error(
      `Failed to download template: ${response.status} ${response.statusText}`,
    )
  }

  await pipeline(
    Readable.fromWeb(response.body),
    createWriteStream(destinationPath),
  )
}

const resolveRepositoryRoot = async (tempDir) => {
  const entries = await readdir(tempDir, { withFileTypes: true })
  const repoDir = entries.find(
    (entry) => entry.isDirectory() && entry.name.startsWith(`${REPO_NAME}-`),
  )
  if (!repoDir) {
    throw new Error(
      'Could not find extracted repository directory from tarball',
    )
  }
  return path.join(tempDir, repoDir.name)
}

const fetchAndCopyTemplate = async ({ targetDir, ref }) => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'create-hikkaku-'))
  const tarballPath = path.join(tempDir, 'template.tar.gz')
  const url = `https://codeload.github.com/${REPO_OWNER}/${REPO_NAME}/tar.gz/refs/tags/${ref}`

  try {
    log(`Downloading template tarball (${pc.dim(url)})`)
    await downloadTarball(url, tarballPath)

    log('Extracting template')
    await runCommand('tar', ['-xzf', tarballPath, '-C', tempDir])

    const repositoryRoot = await resolveRepositoryRoot(tempDir)
    const templateDir = path.join(repositoryRoot, ...TEMPLATE_DIR_IN_REPO)
    if (!(await pathExists(templateDir))) {
      throw new Error(
        `Template directory "${TEMPLATE_DIR_IN_REPO.join('/')}" not found in tarball`,
      )
    }

    await cp(templateDir, targetDir, { recursive: true, force: true })
  } finally {
    await rm(tempDir, { recursive: true, force: true })
  }
}

const patchPackageJson = async ({ targetDir, packageName }) => {
  const packageJsonPath = path.join(targetDir, 'package.json')
  if (!(await pathExists(packageJsonPath))) return

  const pkg = JSON.parse(await readFile(packageJsonPath, 'utf8'))
  pkg.name = packageName
  if (pkg.dependencies?.hikkaku === 'workspace:*') {
    pkg.dependencies.hikkaku = 'latest'
  }
  await writeFile(packageJsonPath, `${JSON.stringify(pkg, null, 2)}\n`)
}

const patchTsConfig = async ({ targetDir }) => {
  const tsconfigPath = path.join(targetDir, 'tsconfig.json')
  if (!(await pathExists(tsconfigPath))) return
  await writeFile(
    tsconfigPath,
    `${JSON.stringify(STANDALONE_TSCONFIG, null, 2)}\n`,
  )
}

const patchAgentsFiles = async ({ targetDir, includeAgents, linkClaude }) => {
  const agentsPath = path.join(targetDir, 'AGENTS.md')

  if (!includeAgents) {
    await rm(agentsPath, { force: true })
    await rm(path.join(targetDir, 'CLAUDE.md'), { force: true })
    return
  }

  if (!linkClaude) return

  const hasAgents = await pathExists(agentsPath)
  if (!hasAgents) {
    warning('AGENTS.md is missing, skipped CLAUDE.md symlink')
    return
  }

  const claudePath = path.join(targetDir, 'CLAUDE.md')
  await rm(claudePath, { force: true })

  try {
    await symlink('AGENTS.md', claudePath)
  } catch {
    warning('Could not create symlink, copied AGENTS.md to CLAUDE.md instead')
    await copyFile(agentsPath, claudePath)
  }
}

const getSkillsCommand = (pm) => {
  if (pm === 'bun') {
    return {
      command: 'bunx',
      args: ['skills', 'add', 'pnsk-lab/hikkaku'],
    }
  }

  if (pm === 'deno') {
    return {
      command: 'deno',
      args: [
        'run',
        '-NRWE',
        '--allow-run=git',
        '--allow-sys=homedir',
        'npm:skills',
        'add',
        'pnsk-lab/hikkaku',
      ],
    }
  }

  if (pm === 'pnpm') {
    return {
      command: 'pnpx',
      args: ['skills', 'add', 'pnsk-lab/hikkaku'],
    }
  }

  if (pm === 'yarn') {
    return {
      command: 'yarn',
      args: ['dlx', 'skills', 'add', 'pnsk-lab/hikkaku'],
    }
  }

  return {
    command: 'npx',
    args: ['skills', 'add', 'pnsk-lab/hikkaku'],
  }
}

const getInstallCommand = (pm) => {
  if (pm === 'deno') return 'deno install'
  if (pm === 'npm') return 'npm install'
  if (pm === 'pnpm') return 'pnpm install'
  if (pm === 'yarn') return 'yarn install'
  return 'bun install'
}

const getDevCommand = (pm) => {
  if (pm === 'deno') return 'deno task dev'
  if (pm === 'npm') return 'npm run dev'
  return `${pm} dev`
}

const printNextSteps = ({ projectPath, pm }) => {
  const relative = path.relative(process.cwd(), projectPath) || '.'
  const steps = []
  if (relative !== '.') {
    steps.push(`cd ${shellQuote(relative)}`)
  }
  steps.push(getInstallCommand(pm))
  steps.push(getDevCommand(pm))

  console.log('')
  console.log(pc.bold('Next steps:'))
  for (const step of steps) {
    console.log(`  ${pc.green('$')} ${step}`)
  }
}

const main = async () => {
  const cli = parseCliArgs(process.argv.slice(2))
  if (cli.help) {
    printHelp()
    return
  }

  const detectedPackageManager =
    cli.packageManager ?? (await detectPackageManager())
  const packageManager =
    normalizePackageManager(detectedPackageManager) ?? 'npm'
  const interactive = process.stdin.isTTY && process.stdout.isTTY && !cli.yes
  const prompter = interactive ? createPrompter() : undefined

  try {
    banner()
    log(
      `Package manager: ${pc.bold(packageManager)} ${pc.dim(
        cli.packageManager ? '(from --pm)' : '(auto-detected)',
      )}`,
    )

    let projectDir = cli.projectDir
    if (!projectDir) {
      if (interactive && prompter) {
        projectDir = await prompter.askText(
          'Project directory',
          DEFAULT_PROJECT_DIR,
        )
      } else {
        projectDir = DEFAULT_PROJECT_DIR
        warning(
          `Project directory not provided. Using "${DEFAULT_PROJECT_DIR}"`,
        )
      }
    }

    projectDir = projectDir.trim()
    if (!projectDir) {
      throw new Error('Project directory cannot be empty')
    }

    const includeAgents =
      cli.includeAgents ??
      (interactive && prompter
        ? await prompter.askYesNo('Include AGENTS.md?', true)
        : true)

    const linkClaude =
      includeAgents &&
      (cli.linkClaude ??
        (interactive && prompter
          ? await prompter.askYesNo(
              'Create CLAUDE.md symlink to AGENTS.md?',
              false,
            )
          : false))

    const addSkills =
      cli.addSkills ??
      (interactive && prompter
        ? await prompter.askYesNo('Run skills add after scaffolding?', false)
        : false)

    const projectPath = path.resolve(process.cwd(), projectDir)
    await mkdir(projectPath, { recursive: true })
    const entries = await readdir(projectPath)
    if (entries.length > 0 && !cli.yes && interactive && prompter) {
      const overwrite = await prompter.askYesNo(
        `Directory "${projectDir}" is not empty. Continue and overwrite conflicting files?`,
        false,
      )
      if (!overwrite) {
        throw new Error('Operation cancelled by user')
      }
    } else if (entries.length > 0 && !cli.yes && !interactive) {
      throw new Error(
        `Directory "${projectDir}" is not empty. Run with --yes to allow overwrite.`,
      )
    }

    if (!includeAgents && cli.linkClaude === true) {
      warning('--link-claude was ignored because AGENTS.md is disabled')
    }

    const ref = cli.ref ?? (await getDefaultRefFromPackageVersion())
    log(
      `Template tag: ${pc.bold(ref)} ${pc.dim(
        cli.ref ? '(from --ref)' : '(from create-hikkaku@<version>)',
      )}`,
    )

    const packageNameSource =
      projectDir === '.'
        ? path.basename(process.cwd())
        : path.basename(projectPath)
    const packageName = toPackageName(packageNameSource)

    log(`Scaffolding project in ${pc.bold(projectPath)}`)
    await fetchAndCopyTemplate({
      targetDir: projectPath,
      ref,
    })
    await patchPackageJson({ targetDir: projectPath, packageName })
    await patchTsConfig({ targetDir: projectPath })
    await patchAgentsFiles({
      targetDir: projectPath,
      includeAgents,
      linkClaude,
    })

    success(`Project created: ${pc.bold(projectDir)}`)

    if (addSkills) {
      const command = getSkillsCommand(packageManager)
      const shownCommand = `${command.command} ${command.args
        .map((arg) => shellQuote(arg))
        .join(' ')}`

      log(`Running skills setup: ${pc.bold(shownCommand)}`)
      try {
        await runCommand(command.command, command.args, { cwd: projectPath })
        success('Skills added')
      } catch (error) {
        warning(
          `Failed to add skills automatically: ${error instanceof Error ? error.message : String(error)}`,
        )
        warning(`Run it manually later: ${shownCommand}`)
      }
    }

    printNextSteps({ projectPath, pm: packageManager })
  } finally {
    prompter?.close()
  }
}

main().catch((error) => {
  fatal(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
