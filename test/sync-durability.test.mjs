import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

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
