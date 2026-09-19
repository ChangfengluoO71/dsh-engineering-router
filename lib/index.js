import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { createHash } from 'node:crypto'
import { homedir } from 'node:os'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

export const name = 'dsh-engineering-router-installer'

const PACKAGE_NAME = 'dsh-engineering-router'
const PRESET_ID = 'engineering-router'
const SKILLS = [
  { id: 'engineering-project-bootstrap', option: 'installBootstrapSkill' },
  { id: 'engineering-review-gate', option: 'installReviewSkill' },
]
const MARKER = '.dsh-engineering-router.json'
const RULE_START = '<!-- DSH-ENGINEERING-ROUTER:START -->'
const RULE_END = '<!-- DSH-ENGINEERING-ROUTER:END -->'

const ROOT = fileURLToPath(new URL('../', import.meta.url))
const PRESET_SOURCE = join(ROOT, 'agent-presets', PRESET_ID)
const RULES_SOURCE = join(ROOT, 'assets', 'AGENTS.block.md')
const PKG = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))
const LOCK = JSON.parse(readFileSync(join(ROOT, 'upstream.lock.json'), 'utf8'))

function dshHome() {
  return process.env.DSH_HOME || join(homedir(), '.dsh')
}

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, '-')
}

function filesUnder(root) {
  const out = []
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const abs = join(dir, entry.name)
      if (entry.isDirectory()) walk(abs)
      else if (entry.isFile()) out.push(relative(root, abs).replaceAll('\\', '/'))
    }
  }
  walk(root)
  return out.sort()
}

function hashFiles(root, files) {
  const h = createHash('sha256')
  for (const rel of files) {
    const abs = join(root, ...rel.split('/'))
    h.update(rel)
    h.update('\0')
    if (!existsSync(abs)) h.update('<missing>')
    else h.update(readFileSync(abs))
    h.update('\0')
  }
  return h.digest('hex')
}

function readJson(path) {
  try { return JSON.parse(readFileSync(path, 'utf8')) } catch { return null }
}

function copyManagedFiles(source, target, files) {
  for (const rel of files) {
    const src = join(source, ...rel.split('/'))
    const dst = join(target, ...rel.split('/'))
    mkdirSync(dirname(dst), { recursive: true })
    cpSync(src, dst, { force: true })
  }
}

function removeManagedFiles(root, files) {
  for (const rel of files || []) {
    const abs = join(root, ...String(rel).split('/'))
    try { rmSync(abs, { force: true }) } catch {}
  }
}

function validateRequired(root, required) {
  const missing = required.filter((rel) => !existsSync(join(root, ...rel.split('/'))))
  if (missing.length) throw new Error('missing required files: ' + missing.join(', '))
}

function backupDir(label, sourceDir) {
  const root = join(dshHome(), 'backups', PACKAGE_NAME)
  mkdirSync(root, { recursive: true })
  const target = join(root, label + '-' + stamp())
  cpSync(sourceDir, target, { recursive: true })
  return target
}

function pruneBackups(prefix, keep = 3) {
  const root = join(dshHome(), 'backups', PACKAGE_NAME)
  if (!existsSync(root)) return
  const dirs = readdirSync(root)
    .filter((n) => n.startsWith(prefix + '-') && statSync(join(root, n)).isDirectory())
    .sort()
  for (const n of dirs.slice(0, Math.max(0, dirs.length - keep))) {
    rmSync(join(root, n), { recursive: true, force: true })
  }
}

function installManagedDirectory({ source, target, label, required, force = false }) {
  validateRequired(source, required)
  const sourceFiles = filesUnder(source)
  const sourceHash = hashFiles(source, sourceFiles)
  const markerPath = join(target, MARKER)
  const previous = existsSync(markerPath) ? readJson(markerPath) : null

  if (existsSync(target) && (!previous || previous.manager !== PACKAGE_NAME) && !force) {
    console.warn('[' + name + '] preserve unmanaged ' + label + ': ' + target)
    return { changed: false, reason: 'unmanaged-target' }
  }

  if (existsSync(target) && previous?.manager === PACKAGE_NAME) {
    const previousFiles = Array.isArray(previous.managedFiles) ? previous.managedFiles : []
    const currentHash = previousFiles.length ? hashFiles(target, previousFiles) : ''
    const locallyModified = Boolean(previous.sourceHash && currentHash !== previous.sourceHash)
    const alreadyCurrent = previous.sourceHash === sourceHash && currentHash === sourceHash
    if (alreadyCurrent) return { changed: false, reason: 'current' }
    if (locallyModified && !force) {
      console.warn('[' + name + '] preserve locally modified ' + label + '; set force:true to replace managed files')
      return { changed: false, reason: 'local-modifications' }
    }
  }

  mkdirSync(dirname(target), { recursive: true })
  const stage = join(dirname(target), '.' + label + '.stage-' + process.pid + '-' + Date.now())
  rmSync(stage, { recursive: true, force: true })

  let backup = null
  try {
    if (existsSync(target)) {
      backup = backupDir(label, target)
      cpSync(target, stage, { recursive: true })
      removeManagedFiles(stage, previous?.managedFiles || [])
    } else {
      mkdirSync(stage, { recursive: true })
    }

    copyManagedFiles(source, stage, sourceFiles)
    validateRequired(stage, required)
    writeFileSync(join(stage, MARKER), JSON.stringify({
      manager: PACKAGE_NAME,
      packageVersion: PKG.version,
      sourceHash,
      managedFiles: sourceFiles,
      upstream: LOCK.dshRoutingSuite,
      installedAt: new Date().toISOString(),
    }, null, 2) + '\n', 'utf8')

    rmSync(target, { recursive: true, force: true })
    renameSync(stage, target)
    pruneBackups(label)
    return { changed: true, backup }
  } catch (error) {
    rmSync(stage, { recursive: true, force: true })
    if (!existsSync(target) && backup && existsSync(backup)) {
      cpSync(backup, target, { recursive: true })
    }
    throw error
  }
}

function backupFile(label, file) {
  if (!existsSync(file)) return null
  const root = join(dshHome(), 'backups', PACKAGE_NAME)
  mkdirSync(root, { recursive: true })
  const target = join(root, label + '-' + stamp() + '.md')
  cpSync(file, target, { force: true })
  return target
}

function installGlobalRules() {
  const file = join(dshHome(), 'AGENTS.md')
  const block = readFileSync(RULES_SOURCE, 'utf8').trim()
  const old = existsSync(file) ? readFileSync(file, 'utf8') : ''
  const a = old.indexOf(RULE_START)
  const b = old.indexOf(RULE_END)

  let next
  if (a === -1 && b === -1) {
    next = (old.trimEnd() ? old.trimEnd() + '\n\n' : '') + block + '\n'
  } else if (a >= 0 && b > a) {
    next = old.slice(0, a) + block + old.slice(b + RULE_END.length)
    if (!next.endsWith('\n')) next += '\n'
  } else {
    console.warn('[' + name + '] AGENTS.md has a malformed managed block; preserving it unchanged')
    return { changed: false, reason: 'malformed-marker' }
  }

  if (next === old) return { changed: false, reason: 'current' }
  backupFile('AGENTS', file)
  mkdirSync(dirname(file), { recursive: true })
  const temp = file + '.tmp-' + process.pid
  writeFileSync(temp, next, 'utf8')
  renameSync(temp, file)
  return { changed: true }
}

export function apply(_ctx, config = {}) {
  const home = dshHome()
  const force = config.force === true

  const preset = installManagedDirectory({
    source: PRESET_SOURCE,
    target: join(home, '.agent-presets', PRESET_ID),
    label: PRESET_ID,
    required: ['agent.cordis.yml', 'preset.yml', 'router-bootstrap-v34.mjs', 'router-core-v34.mjs'],
    force,
  })

  let rules = { changed: false, reason: 'disabled' }
  if (config.installGlobalRules !== false) rules = installGlobalRules()

  const skills = []
  for (const spec of SKILLS) {
    if (config[spec.option] === false) {
      skills.push(spec.id + ':disabled')
      continue
    }
    const result = installManagedDirectory({
      source: join(ROOT, 'skills', spec.id),
      target: join(home, 'skills', spec.id),
      label: spec.id,
      required: ['SKILL.md'],
      force,
    })
    skills.push(spec.id + ':' + (result.changed ? 'updated' : result.reason))
  }

  console.log('[' + name + '] ready: preset=' + (preset.changed ? 'updated' : preset.reason)
    + ' rules=' + (rules.changed ? 'updated' : rules.reason)
    + ' skills=' + skills.join(','))
}
