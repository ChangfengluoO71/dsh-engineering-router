import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, copyFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

/**
 * Sync durability.
 *
 * `scripts/sync-upstream.mjs` replaces every vendored preset file from upstream.
 * Local behaviour therefore only survives a sync if it lives in a file the sync
 * does NOT own, plus a patch that re-applies the integration. These tests pin
 * that contract so the P1/P2 intent policy and the P3-A completion contract can
 * never be silently deleted by a future upstream sync.
 */
import { patchBootstrap, MOUNTED_BOOTSTRAP } from '../scripts/sync-patches.mjs'

const PRESET = new URL('../agent-presets/engineering-router/', import.meta.url)
const read = (f) => readFileSync(new URL(f, PRESET), 'utf8')
const REPO = new URL('../', import.meta.url)
const readRepo = (f) => readFileSync(new URL(f, REPO), 'utf8')

/**
 * A minimal stand-in for a FRESH upstream bootstrap: it contains only the
 * anchors `patchBootstrap` relies on, with no local modifications. This is the
 * input a real sync feeds the patcher for `router-bootstrap-v34.mjs`.
 */
const FRESH_UPSTREAM_BOOTSTRAP = [
  'export const name = "router-bootstrap"',
  'import {',
  '  bandFor, sessionMode, extractText, isComplexTask, sessionEvents',
  "} from './router-core-v34.mjs'",
  'const STAGES = [',
  "  { name: '了解/对齐', tools: ['read', 'glob'] },",
  "  { name: '验证', tools: ['pwsh', 'bash', 'read_image', 'job_list', 'job_output', 'job_kill'] },",
  ']',
  'const dshHomeForState = () => process.env.DSH_HOME || join(homedir(), ".dsh")',
  "  try { mkdirSync(join(process.env.DSH_HOME || homedir(), 'router-standard'), { recursive: true }) } catch { /* marker */ }",
  "const stageFile = () => process.env.DSH_ROUTER_STAGE_FILE || join(dshHomeForState(), 'router-standard', 'stages.json')",
  "const sharedLift = globalThis[Symbol.for('router-standard.restrictLift')] ??= new Map()",
  'export function apply(ctx, config) {',
  "  ctx.on('system-prompt/assemble', async (_assembly, context, next) => {",
  '    const assembled = await next()',
  "    sections.push({ name: 'router-stage', order: 1, text: stageText(stage, muteAwareList(runtimeCallable(toolsSvc, agent), memoryMuted(session)), memoryMuted(session), firstUserTask(session)) })",
  '    return assembled',
  '  })',
  '}',
  '',
].join('\n')

test('a fresh upstream sync keeps the local intent policy wired in', () => {
  const synced = patchBootstrap(FRESH_UPSTREAM_BOOTSTRAP, MOUNTED_BOOTSTRAP)

  assert.match(synced, /from '\.\/intent-policy\.mjs'/, 'bootstrap must import the local intent policy after sync')
  assert.match(synced, /classifyIntent/, 'classifyIntent must be used after sync')
  assert.match(synced, /intentGuidance/, 'intentGuidance must be used after sync')
  assert.match(synced, /completionContract/, 'completionContract must be used after sync')
  assert.match(synced, /name: 'router-intent'/, 'the router-intent section must be re-applied after sync')
  assert.match(synced, /'engineering_review'/, 'the reviewer stage tool must be re-applied after sync')
  assert.ok(synced.includes("join(dshHomeForState(), 'engineering-router', 'stages.json')"), 'namespace isolation must survive')
  assert.ok(synced.includes("join(dshHomeForState(), 'engineering-router')"), 'the comma-less marker call site must be renamed too')
  assert.ok(!/join\(dshHomeForState\(\), 'router-standard'/.test(synced), 'no router-standard state path may survive a sync')
  assert.ok(!synced.includes("Symbol.for('router-standard.restrictLift')"), 'router-standard symbols must be renamed')
})

test('patching is idempotent', () => {
  const once = patchBootstrap(FRESH_UPSTREAM_BOOTSTRAP, MOUNTED_BOOTSTRAP)
  const twice = patchBootstrap(once, MOUNTED_BOOTSTRAP)
  assert.equal(twice, once)
})

test('the local intent policy is not a vendored file, so sync cannot overwrite it', () => {
  const sync = readRepo('scripts/sync-upstream.mjs')
  const listStart = sync.indexOf('const files = [')
  const listEnd = sync.indexOf(']', listStart)
  const synced = sync.slice(listStart, listEnd)
  assert.ok(!synced.includes('intent-policy.mjs'), 'intent-policy.mjs must never be added to the synced file list')
  for (const vendored of ['router-core-v34.mjs', 'router-core.mjs', 'router-bootstrap-v34.mjs']) {
    assert.ok(synced.includes(vendored), `${vendored} must still be synced from upstream`)
  }
})

test('the vendored core is upstream-clean: no local symbols live in it', () => {
  const core = read('router-core-v34.mjs')
  for (const symbol of ['classifyIntent', 'intentGuidance', 'completionContract', 'INTENT_PATTERNS', 'COMPLETION_CONTRACTS']) {
    assert.ok(!core.includes(symbol), `${symbol} must NOT live in the vendored core (sync would delete it)`)
  }
  const local = read('intent-policy.mjs')
  for (const symbol of ['export function classifyIntent', 'export function intentGuidance', 'export function completionContract']) {
    assert.ok(local.includes(symbol), `${symbol} must live in the local intent policy`)
  }
})

test('the committed bootstrap consumes the local module, not the core', () => {
  const boot = read('router-bootstrap-v34.mjs')
  assert.match(boot, /import \{ classifyIntent, intentGuidance, completionContract \} from '\.\/intent-policy\.mjs'/)
  assert.match(boot, /name: 'router-intent'/)
  const coreImportBlock = boot.slice(0, boot.indexOf("from './router-core-v34.mjs'"))
  assert.ok(!/classifyIntent|intentGuidance|completionContract/.test(coreImportBlock), 'core import must not reference local symbols')
})

test('the sync no longer aborts on the selftest file', () => {
  const selftest = read('router-bootstrap-v34.selftest.mjs')
  // Regression: the selftest starts with "router-bootstrap" but has no STAGES
  // table, so the structural patches used to throw and abort the entire sync.
  const patched = patchBootstrap(selftest, 'router-bootstrap-v34.selftest.mjs')
  assert.ok(!patched.includes("'engineering_review'"), 'no reviewer stage may be injected into a checker file')
  assert.ok(!patched.includes('intent-policy.mjs'), 'no intent import may be injected into a checker file')
  // and the real modules still receive the structural patches
  assert.throws(() => patchBootstrap('no anchors here', MOUNTED_BOOTSTRAP), /upstream shape changed/)
})

test('an upstream sync cannot break the link between bootstrap and local policy', async () => {
  // Simulate the post-sync tree: fresh upstream core + fresh upstream bootstrap
  // (patched) + the untouched local overlay, then actually load the bootstrap.
  const home = mkdtempSync(join(tmpdir(), 'dsh-sync-durability-'))
  const dir = join(home, 'preset')
  mkdirSync(dir, { recursive: true })
  const upstreamCore = ["export function bandFor() {}", "export function sessionMode() {}", "export function extractText() {}", "export function isComplexTask() {}", "export function sessionEvents() {}", ''].join('\n')
  writeFileSync(join(dir, 'router-core-v34.mjs'), upstreamCore, 'utf8')
  writeFileSync(join(dir, 'router-bootstrap-v34.mjs'), patchBootstrap(FRESH_UPSTREAM_BOOTSTRAP, MOUNTED_BOOTSTRAP), 'utf8')
  writeFileSync(join(dir, 'intent-policy.mjs'), read('intent-policy.mjs'), 'utf8')

  try {
    const local = await import(new URL(`file://${join(dir, 'intent-policy.mjs')}`).href)
    assert.equal(local.classifyIntent('实现一个用户登录失败次数限制。'), 'implement')
    assert.equal(local.completionContract('unknown'), '')
    assert.match(local.completionContract('implement'), /^Done means:/)
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

test('the real bootstrap loads and still emits the intent section (no link-time failure)', async () => {
  const home = mkdtempSync(join(tmpdir(), 'dsh-sync-esm-'))
  process.env.DSH_HOME = home
  process.env.DSH_ROUTER_STAGE_FILE = join(home, 'engineering-router', 'stages.json')
  mkdirSync(join(home, 'engineering-router'), { recursive: true })
  writeFileSync(process.env.DSH_ROUTER_STAGE_FILE, JSON.stringify({ version: 2, sessions: {} }), 'utf8')

  try {
    const boot = await import(new URL('router-bootstrap-v34.mjs', PRESET).href)
    assert.equal(typeof boot.apply, 'function')

    const handlers = new Map()
    boot.apply({ on: (n, f) => { if (!handlers.has(n)) handlers.set(n, []); handlers.get(n).push(f) }, inject() {}, effect() {}, get() {} }, {})
    const assemble = handlers.get('system-prompt/assemble')?.[0]
    assert.equal(typeof assemble, 'function', 'the bootstrap must register system-prompt/assemble')

    const events = [
      { type: 'user/message', data: { content: [{ type: 'text', text: '实现一个用户登录失败次数限制。' }], source: { kind: 'user' }, role: 'user', id: 'm' } },
      { type: 'tool/call', data: { name: 'phase_begin' } },
    ]
    const agent = { session: { id: 'session-sync-esm', header: {}, events }, ctx: { get: () => ({ view: () => ({ restrictableNames: [] }), restrict: () => () => {} }) } }
    const out = await assemble({}, { agent }, async () => ({ variables: {}, sections: [], tools: [] }))
    const intent = out.sections.find((s) => s.name === 'router-intent')
    assert.ok(intent, 'router-intent must still be emitted after the overlay move')
    assert.match(intent.text, /^User intent: implement\./)
    assert.match(intent.text, /Done means:/, 'the P3-A contract must still be attached')
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

/* ── 7. Mutation barrier: fetch-all -> patch-all -> write-all ─────────────── */

/**
 * `sync-upstream.mjs` used to fetch, patch and write one file per iteration, so
 * a patch failure at target N left targets 1..N-1 already rewritten on disk.
 * P3-B failure injection confirmed that: a mid-loop anchor failure produced a
 * partial sync (worktree straddling two revisions, the mounted bootstrap losing
 * the local overlay, npm test 30/38). The sync now renders everything in memory
 * before the first write, so fetch and patch failures mutate nothing.
 *
 * These tests run the REAL `scripts/sync-upstream.mjs` (copied byte-for-byte
 * into a temp tree) with only the network transport replaced by a local shim.
 */
const SYNC_TARGETS = [
  'agent.cordis.yml',
  'preset.yml',
  'gitbash-executor.mjs',
  'router-bootstrap.mjs',
  'router-bootstrap-v34.mjs',
  'router-bootstrap-v34.selftest.mjs',
  'router-core.mjs',
  'router-core-v34.mjs',
]

/** Files the sync patches; the rest are copied verbatim from upstream. */
const PATCHED_TARGETS = ['agent.cordis.yml', 'preset.yml', 'router-bootstrap.mjs', 'router-bootstrap-v34.mjs']
/** Gets the standard header comment, but no structural patch (it is a checker). */
const HEADER_ONLY_TARGETS = ['router-bootstrap-v34.selftest.mjs']
/** Copied byte-for-byte from upstream with no patch and no header. */
const VERBATIM_TARGETS = ['gitbash-executor.mjs', 'router-core.mjs', 'router-core-v34.mjs']

/** Minimal upstream-shaped agent.cordis.yml: persona row + fork anchor. */
const UP_AGENT_CORDIS = [
  '# The `router-standard` agent preset:',
  '- id: persona',
  "  name: '@deepseek-ai/dsh-persona'",
  '  config:',
  '    text: >-',
  '      pre-assembly fallback',
  '    - id: tool-subagent-fork',
  "      name: '@deepseek-ai/dsh-tool-subagent'",
  '      config:',
  '        provider: fork',
  '        toolName: subagent_fork',
  '        backgroundMode: continuable',
  '',
].join('\n')

const UPSTREAM_BODIES = {
  'agent.cordis.yml': UP_AGENT_CORDIS,
  'preset.yml': 'name: Router Standard\ndescription: upstream\n',
  'gitbash-executor.mjs': 'export const name = "gitbash-executor"\n',
  'router-bootstrap.mjs': FRESH_UPSTREAM_BOOTSTRAP,
  'router-bootstrap-v34.mjs': FRESH_UPSTREAM_BOOTSTRAP,
  'router-bootstrap-v34.selftest.mjs': 'import { readFileSync } from "node:fs"\n',
  'router-core.mjs': 'export function bandFor() { return "core" }\n',
  'router-core-v34.mjs': 'export function bandFor() { return "core-v34" }\n',
}

/** Serves the upstream bodies from disk; optionally doctors one file's shape. */
const SYNC_HARNESS = `
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('.', import.meta.url))
const doctor = process.argv[2] || ''
const ANCHOR = "{ name: '验证', tools: ['pwsh', 'bash', 'read_image', 'job_list', 'job_output', 'job_kill'] },"
const DOCTORED = "{ name: '验证', tools: ['pwsh', 'read_image', 'job_list', 'job_output', 'job_kill'] },"

globalThis.fetch = async (url) => {
  const file = String(url).split('/').pop()
  let body = readFileSync(join(ROOT, 'bodies', file), 'utf8')
  if (doctor && file === doctor) body = body.replace(ANCHOR, DOCTORED)
  return new Response(body, { status: 200, headers: { 'content-type': 'text/plain; charset=utf-8' } })
}

// sync-upstream.mjs reads process.argv[2] as the upstream ref; pin it to the
// already-resolved ref so no GitHub API call is attempted.
const lock = JSON.parse(readFileSync(join(ROOT, 'upstream.lock.json'), 'utf8'))
process.argv = [process.argv[0], 'sync-upstream.mjs', lock.dshRoutingSuite.ref]
await import(new URL('./scripts/sync-upstream.mjs', import.meta.url).href)
`

/** Build an isolated tree with the real sync script and run it once. */
function runIsolatedSync({ doctor = '' } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'dsh-sync-barrier-'))
  mkdirSync(join(root, 'scripts'), { recursive: true })
  mkdirSync(join(root, 'bodies'), { recursive: true })
  mkdirSync(join(root, 'agent-presets', 'engineering-router'), { recursive: true })
  for (const f of ['sync-upstream.mjs', 'sync-patches.mjs', 'compat-patches.mjs']) {
    copyFileSync(new URL(`../scripts/${f}`, import.meta.url), join(root, 'scripts', f))
  }
  copyFileSync(new URL('../upstream.lock.json', import.meta.url), join(root, 'upstream.lock.json'))
  for (const f of SYNC_TARGETS) {
    writeFileSync(join(root, 'bodies', f), UPSTREAM_BODIES[f], 'utf8')
    writeFileSync(join(root, 'agent-presets', 'engineering-router', f), UPSTREAM_BODIES[f], 'utf8')
  }
  writeFileSync(join(root, 'harness.mjs'), SYNC_HARNESS, 'utf8')

  const target = (f) => join(root, 'agent-presets', 'engineering-router', f)
  const before = new Map(SYNC_TARGETS.map((f) => [f, readFileSync(target(f))]))
  const lockBefore = readFileSync(join(root, 'upstream.lock.json'))
  const run = spawnSync(process.execPath, [join(root, 'harness.mjs'), doctor], { encoding: 'utf8' })
  const after = new Map(SYNC_TARGETS.map((f) => [f, readFileSync(target(f))]))
  const lockAfter = readFileSync(join(root, 'upstream.lock.json'))
  return { root, run, before, after, lockBefore, lockAfter }
}

test('a mid-sync patch failure mutates nothing (mutation barrier)', () => {
  // Injection point is target #5 — exactly where the P3-B research run observed
  // agent.cordis.yml, preset.yml, gitbash-executor.mjs and router-bootstrap.mjs
  // already rewritten, i.e. a partial sync.
  const { root, run, before, after, lockBefore, lockAfter } = runIsolatedSync({ doctor: MOUNTED_BOOTSTRAP })
  try {
    assert.notEqual(run.status, 0, 'a sync with a failing patch must exit non-zero')
    assert.match(
      `${run.stdout}${run.stderr}`,
      /upstream shape changed; cannot apply local patch: verification stage reviewer tool/,
      'the injected anchor failure must be the actual cause (guards against a vacuous pass)',
    )
    for (const f of SYNC_TARGETS) {
      assert.ok(before.get(f).equals(after.get(f)), `${f} must be byte-identical after a failed sync`)
    }
    assert.ok(lockBefore.equals(lockAfter), 'upstream.lock.json must be byte-identical after a failed sync')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('a fetch failure mutates nothing either (mutation barrier)', () => {
  const root = mkdtempSync(join(tmpdir(), 'dsh-sync-fetchfail-'))
  mkdirSync(join(root, 'scripts'), { recursive: true })
  mkdirSync(join(root, 'bodies'), { recursive: true })
  mkdirSync(join(root, 'agent-presets', 'engineering-router'), { recursive: true })
  for (const f of ['sync-upstream.mjs', 'sync-patches.mjs', 'compat-patches.mjs']) {
    copyFileSync(new URL(`../scripts/${f}`, import.meta.url), join(root, 'scripts', f))
  }
  copyFileSync(new URL('../upstream.lock.json', import.meta.url), join(root, 'upstream.lock.json'))
  for (const f of SYNC_TARGETS) {
    writeFileSync(join(root, 'bodies', f), UPSTREAM_BODIES[f], 'utf8')
    writeFileSync(join(root, 'agent-presets', 'engineering-router', f), UPSTREAM_BODIES[f], 'utf8')
  }
  // Serve every body except the LAST target, so the failure happens after seven
  // successful fetches — the worst case for a non-barriered implementation.
  const harness = SYNC_HARNESS.replace(
    "  let body = readFileSync(join(ROOT, 'bodies', file), 'utf8')",
    `  if (file === '${SYNC_TARGETS.at(-1)}') throw new Error('injected upstream fetch failure')\n  let body = readFileSync(join(ROOT, 'bodies', file), 'utf8')`,
  )
  writeFileSync(join(root, 'harness.mjs'), harness, 'utf8')

  const target = (f) => join(root, 'agent-presets', 'engineering-router', f)
  const before = new Map(SYNC_TARGETS.map((f) => [f, readFileSync(target(f))]))
  const lockBefore = readFileSync(join(root, 'upstream.lock.json'))
  try {
    const run = spawnSync(process.execPath, [join(root, 'harness.mjs'), ''], { encoding: 'utf8' })
    assert.notEqual(run.status, 0, 'a sync with a failing fetch must exit non-zero')
    assert.match(`${run.stdout}${run.stderr}`, /injected upstream fetch failure/, 'the injected fetch failure must be the cause')
    for (const f of SYNC_TARGETS) {
      assert.ok(before.get(f).equals(readFileSync(target(f))), `${f} must be byte-identical after a failed fetch`)
    }
    assert.ok(lockBefore.equals(readFileSync(join(root, 'upstream.lock.json'))), 'upstream.lock.json must be byte-identical after a failed fetch')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('a successful sync still rewrites every patched target (barrier control)', () => {
  const { root, run, before, after, lockBefore, lockAfter } = runIsolatedSync()
  try {
    assert.equal(run.status, 0, `sync must succeed: ${run.stdout}${run.stderr}`)
    for (const f of PATCHED_TARGETS) {
      assert.ok(!before.get(f).equals(after.get(f)), `${f} must be rewritten by a successful sync`)
    }
    // the selftest gets the standard header but NO structural patch
    const selftest = after.get('router-bootstrap-v34.selftest.mjs').toString('utf8')
    assert.match(selftest, /^\/\/ Modified by dsh-engineering-router:/, 'the selftest receives the standard header')
    assert.doesNotMatch(selftest, /engineering_review|intent-policy\.mjs/, 'no structural patch may be injected into a checker file')
    for (const f of HEADER_ONLY_TARGETS) {
      assert.ok(!before.get(f).equals(after.get(f)), `${f} must receive the header comment`)
    }
    // files the sync copies verbatim must pass through untouched
    for (const f of VERBATIM_TARGETS) {
      assert.ok(before.get(f).equals(after.get(f)), `${f} is copied verbatim and must be unchanged`)
    }
    assert.ok(!lockBefore.equals(lockAfter), 'upstream.lock.json must be updated on success')
    const boot = after.get('router-bootstrap-v34.mjs').toString('utf8')
    assert.match(boot, /from '\.\/intent-policy\.mjs'/, 'the local overlay must still be wired in')
    assert.match(boot, /name: 'router-intent'/, 'the intent section must still be re-applied')
    assert.match(after.get('agent.cordis.yml').toString('utf8'), /prefix:/, 'persona must be normalised to config.prefix')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
