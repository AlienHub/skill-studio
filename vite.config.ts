import { defineConfig, type Plugin, type PreviewServer, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { dirname, resolve, relative } from 'path'
import { fileURLToPath } from 'url'
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  statSync,
  writeFileSync,
} from 'fs'
import { homedir } from 'os'
import matter from 'gray-matter'

type LocalSkill = {
  id: string
  slug: string
  name: string
  description: string
  content: string
  location: string
  sourceDirectory: string
  metadata: Record<string, unknown>
}

type SkillManagerState = {
  configuredDirectories: string[]
  discoveredDirectories: string[]
  skills: LocalSkill[]
}

const DEFAULT_SKILLS_DIRECTORY = resolve(homedir(), '.agents/skills')
const SKILL_MANAGER_CONFIG_PATH = resolve(homedir(), '.agents', 'skill-manager.json')
const SKILL_MANAGER_API_BASE = '/__skill_manager__'
const VIRTUAL_SKILL_MANAGER_STATE = 'virtual:skill-manager-state'
const RESOLVED_VIRTUAL_SKILL_MANAGER_STATE = '\0virtual:skill-manager-state'
const projectRoot = dirname(fileURLToPath(import.meta.url))

function sendJson(res: NodeJS.WritableStream & {
  statusCode?: number
  setHeader?: (name: string, value: string) => void
  end: (chunk?: string) => void
}, statusCode: number, payload: unknown) {
  res.statusCode = statusCode
  res.setHeader?.('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

function expandHomeDirectory(input: string) {
  if (input === '~') {
    return homedir()
  }

  if (input.startsWith('~/')) {
    return resolve(homedir(), input.slice(2))
  }

  return input
}

function normalizeConfiguredDirectories(directories: string[]) {
  const seen = new Set<string>()

  return directories
    .map((directory) => directory.trim())
    .filter(Boolean)
    .map((directory) => resolve(expandHomeDirectory(directory)))
    .filter((directory) => {
      if (seen.has(directory)) {
        return false
      }

      seen.add(directory)
      return true
    })
}

function readConfiguredDirectories() {
  if (!existsSync(SKILL_MANAGER_CONFIG_PATH)) {
    return [DEFAULT_SKILLS_DIRECTORY]
  }

  try {
    const raw = readFileSync(SKILL_MANAGER_CONFIG_PATH, 'utf8')
    const parsed = JSON.parse(raw) as { skillDirectories?: unknown }
    if (!Array.isArray(parsed.skillDirectories)) {
      return [DEFAULT_SKILLS_DIRECTORY]
    }

    const normalized = normalizeConfiguredDirectories(
      parsed.skillDirectories.filter((directory): directory is string => typeof directory === 'string')
    )

    return normalized.length > 0 ? normalized : []
  } catch {
    return [DEFAULT_SKILLS_DIRECTORY]
  }
}

function writeConfiguredDirectories(directories: string[]) {
  mkdirSync(dirname(SKILL_MANAGER_CONFIG_PATH), { recursive: true })
  writeFileSync(
    SKILL_MANAGER_CONFIG_PATH,
    JSON.stringify({ skillDirectories: normalizeConfiguredDirectories(directories) }, null, 2),
    'utf8'
  )
}

function loadSkillManagerState(): SkillManagerState {
  const configuredDirectories = readConfiguredDirectories()
  const ignoredDirectoryNames = new Set(['cache', 'logs', 'scenarios', '.skills-manager'])
  const discoveredSkillFiles: Array<{ skillFile: string; sourceDirectory: string }> = []

  function collectSkillFiles(directory: string, sourceDirectory: string) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const entryPath = resolve(directory, entry.name)

      if (entry.isDirectory()) {
        if (ignoredDirectoryNames.has(entry.name)) {
          continue
        }

        collectSkillFiles(entryPath, sourceDirectory)
        continue
      }

      if (entry.isSymbolicLink()) {
        let stats
        try {
          stats = statSync(entryPath)
        } catch {
          continue
        }

        if (stats.isDirectory()) {
          if (ignoredDirectoryNames.has(entry.name)) {
            continue
          }

          collectSkillFiles(entryPath, sourceDirectory)
          continue
        }
      }

      if (entry.name === 'SKILL.md') {
        discoveredSkillFiles.push({ skillFile: entryPath, sourceDirectory })
      }
    }
  }

  for (const configuredDirectory of configuredDirectories) {
    if (!existsSync(configuredDirectory)) {
      continue
    }

    let stats
    try {
      stats = statSync(configuredDirectory)
    } catch {
      continue
    }

    if (!stats.isDirectory()) {
      continue
    }

    collectSkillFiles(configuredDirectory, configuredDirectory)
  }

  const seenSkillDirectories = new Set<string>()
  const discoveredDirectories = new Set<string>()

  const skills = discoveredSkillFiles
    .map(({ skillFile, sourceDirectory }) => {
      const skillDirectory = dirname(skillFile)
      let resolvedSkillDirectory = skillDirectory
      let resolvedSourceDirectory = sourceDirectory

      try {
        resolvedSkillDirectory = realpathSync(skillDirectory)
      } catch {
        resolvedSkillDirectory = skillDirectory
      }

      try {
        resolvedSourceDirectory = realpathSync(sourceDirectory)
      } catch {
        resolvedSourceDirectory = sourceDirectory
      }

      if (seenSkillDirectories.has(resolvedSkillDirectory)) {
        return null
      }

      seenSkillDirectories.add(resolvedSkillDirectory)
      discoveredDirectories.add(resolvedSourceDirectory)

      let source: string
      let parsed: ReturnType<typeof matter>
      try {
        source = readFileSync(skillFile, 'utf8')
        parsed = matter(source)
      } catch {
        return null
      }

      const location = relative(resolvedSourceDirectory, resolvedSkillDirectory) || resolvedSkillDirectory

      return {
        id: `${resolvedSourceDirectory}::${resolvedSkillDirectory}`,
        slug: location,
        name:
          typeof parsed.data.name === 'string'
            ? parsed.data.name.trim()
            : location,
        description:
          typeof parsed.data.description === 'string'
            ? parsed.data.description.trim()
            : '',
        content: parsed.content.trim(),
        location,
        sourceDirectory: resolvedSourceDirectory,
        metadata: parsed.data,
      } satisfies LocalSkill
    })
    .filter((skill): skill is LocalSkill => skill !== null)
    .sort((left, right) => left.name.localeCompare(right.name, 'zh-CN'))

  return {
    configuredDirectories,
    discoveredDirectories: Array.from(discoveredDirectories).sort((left, right) =>
      left.localeCompare(right, 'zh-CN')
    ),
    skills,
  }
}

async function readRequestJson(req: NodeJS.ReadableStream & {
  on: (event: 'data' | 'end' | 'error', listener: (...args: any[]) => void) => void
}) {
  const chunks: Buffer[] = []

  return await new Promise<unknown>((resolvePromise, rejectPromise) => {
    req.on('data', (chunk: Buffer | string) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    })

    req.on('end', () => {
      try {
        const body = Buffer.concat(chunks).toString('utf8')
        resolvePromise(body ? JSON.parse(body) : {})
      } catch (error) {
        rejectPromise(error)
      }
    })

    req.on('error', rejectPromise)
  })
}

function installSkillManagerApi(server: ViteDevServer) {
  server.middlewares.use(async (req, res, next) => {
    const url = req.url?.split('?')[0]

    if (url === `${SKILL_MANAGER_API_BASE}/state` && req.method === 'GET') {
      sendJson(res, 200, loadSkillManagerState())
      return
    }

    if (url === `${SKILL_MANAGER_API_BASE}/directories` && req.method === 'POST') {
      try {
        const body = (await readRequestJson(req)) as { directories?: unknown }
        if (!Array.isArray(body.directories)) {
          sendJson(res, 400, { error: 'directories must be an array' })
          return
        }

        const normalized = normalizeConfiguredDirectories(
          body.directories.filter((directory): directory is string => typeof directory === 'string')
        )

        writeConfiguredDirectories(normalized)
        sendJson(res, 200, loadSkillManagerState())
      } catch (error) {
        sendJson(res, 400, {
          error: error instanceof Error ? error.message : 'Failed to update directories',
        })
      }

      return
    }

    next()
  })
}

function installSkillManagerPreviewApi(server: PreviewServer) {
  server.middlewares.use(async (req, res, next) => {
    const url = req.url?.split('?')[0]

    if (url === `${SKILL_MANAGER_API_BASE}/state` && req.method === 'GET') {
      sendJson(res, 200, loadSkillManagerState())
      return
    }

    if (url === `${SKILL_MANAGER_API_BASE}/directories` && req.method === 'POST') {
      try {
        const body = (await readRequestJson(req)) as { directories?: unknown }
        if (!Array.isArray(body.directories)) {
          sendJson(res, 400, { error: 'directories must be an array' })
          return
        }

        const normalized = normalizeConfiguredDirectories(
          body.directories.filter((directory): directory is string => typeof directory === 'string')
        )

        writeConfiguredDirectories(normalized)
        sendJson(res, 200, loadSkillManagerState())
      } catch (error) {
        sendJson(res, 400, {
          error: error instanceof Error ? error.message : 'Failed to update directories',
        })
      }

      return
    }

    next()
  })
}

function skillManagerStatePlugin(): Plugin {
  return {
    name: 'skill-manager-state-plugin',
    resolveId(id) {
      if (id === VIRTUAL_SKILL_MANAGER_STATE) {
        return RESOLVED_VIRTUAL_SKILL_MANAGER_STATE
      }

      return null
    },
    load(id) {
      if (id !== RESOLVED_VIRTUAL_SKILL_MANAGER_STATE) {
        return null
      }

      return `export const skillManagerApiBase = ${JSON.stringify(SKILL_MANAGER_API_BASE)};
export const initialSkillManagerState = ${JSON.stringify(loadSkillManagerState())};`
    },
    configureServer(server) {
      installSkillManagerApi(server)
    },
    configurePreviewServer(server) {
      installSkillManagerPreviewApi(server)
    },
  }
}

export default defineConfig({
  plugins: [skillManagerStatePlugin(), react(), tailwindcss()],
  base: './',
  build: {
    outDir: resolve(projectRoot, 'dist'),
    emptyDirBeforeWrite: true,
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        'skill-manager': resolve(projectRoot, 'index.html'),
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
  server: {
    host: '127.0.0.1',
    port: 5176,
    open: false,
  },
  preview: {
    host: '127.0.0.1',
    port: 5177,
  },
})
