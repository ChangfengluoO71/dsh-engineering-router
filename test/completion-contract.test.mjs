import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

/**
 * P3-A Completion Contract.
 *
 * The completion contract must be a COMPLETION CONDITION, never a workflow.
 * These tests therefore check four separate things: that the contract exists
 * where it should, that it costs nothing where it should not, that it cannot
 * re-introduce a fixed pipeline, and that it leaves the existing phase gate,
 * tool surface, and read-only intents exactly as they were.
 *
 * The last group drives the real `system-prompt/assemble` hook registered by
 * `apply()` — not just the pure functions — because "the string exists" and
 * "the string reaches the assembled prompt" are different claims.
 *
 * DSH_HOME is redirected to a throwaway temp directory so the user's real
 * Harness home is never touched (and so this works on CI for any OS).
 */
const home = mkdtempSync(join(tmpdir(), 'dsh-p3a-completion-'))
process.env.DSH_HOME = home
process.env.DSH_ROUTER_STAGE_FILE = join(home, 'engineering-router', 'stages.json')
mkdirSync(join(home, 'engineering-router'), { recursive: true })
writeFileSync(process.env.DSH_ROUTER_STAGE_FILE, JSON.stringify({ version: 2, sessions: {} }), 'utf8')
process.on('exit', () => { try { rmSync(home, { recursive: true, force: true }) } catch { /* best effort */ } })

const { classifyIntent, intentGuidance, completionContract } = await import('../agent-presets/engineering-router/intent-policy.mjs')
const boot = await import('../agent-presets/engineering-router/router-bootstrap-v34.mjs')

const handlers = new Map()
const fakeCtx = {
  on: (name, fn) => { if (!handlers.has(name)) handlers.set(name, []); handlers.get(name).push(fn) },
  inject: () => {},
  effect: () => {},
  get: () => undefined,
}
boot.apply(fakeCtx, {})
const assemble = handlers.get('system-prompt/assemble')?.[0]

const SESSION_ID = 'session-p3a-test'
const userMessage = (text) => ({
  type: 'user/message',
  data: { content: [{ type: 'text', text }], source: { kind: 'user' }, role: 'user', id: 'm1' },
})
const sessionFor = (text, promoted) => {
  const events = [userMessage(text)]
  if (promoted) events.push({ type: 'tool/call', data: { name: 'phase_begin', callId: 'c1', step: 1 } })
  return { id: SESSION_ID, header: {}, events }
}
const toolsStub = {
  view: () => ({ restrictableNames: ['phase_begin', 'read', 'glob', 'grep', 'pwsh', 'write', 'edit'] }),
  restrict: () => () => {},
  get: () => undefined,
}
const assembledBase = {
  variables: { provider: 'deepseek-official', model: 'deepseek-flash' },
  sections: [{ name: 'persona', order: 0, text: 'base persona' }],
  tools: [{ name: 'phase_begin' }, { name: 'read' }, { name: 'write' }, { name: 'pwsh' }],
}
const runAssemble = async (text, promoted) =>
  assemble({}, { agent: { session: sessionFor(text, promoted), ctx: { get: (k) => (k === 'tools' ? toolsStub : undefined) } } }, async () => assembledBase)
const intentSectionOf = (out) => out.sections.find((s) => s.name === 'router-intent')

const CONTRACTED = ['implement', 'fix', 'investigate', 'research', 'plan', 'review', 'continue']
const PROMPTS = {
  implement: '实现一个用户登录失败次数限制。',
  fix: '修复上传大文件时偶发失败的问题。',
  investigate: '调查为什么这个 API 在并发情况下会超时。',
  research: '研究这个项目应该如何接入 Graphify，但不要修改代码。',
  plan: '规划把当前配置系统迁移到新的 schema。',
  review: '审查这次 API 改动是否完整。',
  continue: '继续当前任务。',
}

/* ── 1. Contract presence ─────────────────────────────────────────────────── */

test('completion contract is present for every intent that delivers a result', () => {
  for (const intent of CONTRACTED) {
    const contract = completionContract(intent)
    assert.ok(contract.length > 0, `${intent}: contract must be present`)
    assert.match(contract, /^Done means:/, `${intent}: must state a completion condition`)
  }
})

test('contracts are not all the same text', () => {
  const seen = new Set(CONTRACTED.map((i) => completionContract(i)))
  assert.equal(seen.size, CONTRACTED.length, 'each intent must state its own completion condition')
})

/* ── 2. Contract absence / minimality ─────────────────────────────────────── */

test('unknown intent carries no contract, so simple paths do not inflate', () => {
  assert.equal(completionContract('unknown'), '')
  assert.equal(completionContract('not-an-intent'), '')
  assert.equal(completionContract(undefined), '')
})

test('the first turn carries no intent or completion section at all', async () => {
  const out = await runAssemble(PROMPTS.implement, false)
  assert.equal(intentSectionOf(out), undefined, 'initial turn must not inject router-intent')
  assert.equal(out.sections.some((s) => s.name === 'router-completion'), false, 'no completion section may exist')
})

/* ── 3. No workflow regression ────────────────────────────────────────────── */

test('contracts contain no steps and no mandatory-pipeline verbs', () => {
  const all = CONTRACTED.map((i) => completionContract(i)).join('\n')
  assert.doesNotMatch(all, /\bstep\s*\d/iu, 'must not contain step lists')
  assert.doesNotMatch(all, /always\s+(research|plan|review|verify)/iu, 'must not mandate always-do stages')
  assert.doesNotMatch(all, /first\b.*\bthen\b.*\bfinally\b/iu, 'must not prescribe an ordered pipeline')
  assert.doesNotMatch(all, /research\s*(->|→|,)\s*plan/iu, 'must not hard-code research -> plan')
  assert.doesNotMatch(all, /\b(1\)|2\)|3\))/u, 'must not contain numbered ordering')
})

test('a contract does not resurrect the removed AGENTS workflow prescription', () => {
  for (const intent of CONTRACTED) {
    assert.doesNotMatch(completionContract(intent), /research\s*→\s*design/iu)
    assert.doesNotMatch(completionContract(intent), /implement\s*→\s*verify/iu)
  }
})

/* ── 4. Gate regression (real assemble) ───────────────────────────────────── */

test('phase gate unchanged: initial exposes phase_begin only', async () => {
  const out = await runAssemble(PROMPTS.implement, false)
  assert.deepEqual(out.tools.map((t) => t.name), ['phase_begin'])
})

test('promoted turn keeps the existing sections and adds intent guidance with the contract', async () => {
  for (const intent of CONTRACTED) {
    const out = await runAssemble(PROMPTS[intent], true)
    const names = out.sections.map((s) => s.name)
    for (const required of ['router-stage', 'router-intent', 'router-decl', 'router-proactivity']) {
      assert.ok(names.includes(required), `${intent}: ${required} section must survive`)
    }
    assert.equal(names.includes('router-completion'), false, 'contract must not add a new section')
    const text = intentSectionOf(out).text
    assert.equal(text, `${intentGuidance(intent)} ${completionContract(intent)}`, `${intent}: contract must ride inside router-intent`)
  }
})

test('promoted turn actually classifies and injects the matching contract', async () => {
  for (const intent of CONTRACTED) {
    const prompt = PROMPTS[intent]
    assert.equal(classifyIntent(prompt), intent, `${prompt} must classify as ${intent}`)
    const out = await runAssemble(prompt, true)
    assert.ok(intentSectionOf(out).text.includes(completionContract(intent)), `${intent}: contract must reach the assembled prompt`)
  }
})

test('promoted turn for an unclassified prompt injects guidance only, no contract', async () => {
  const prompt = '帮我看看这个项目'
  assert.equal(classifyIntent(prompt), 'unknown')
  const out = await runAssemble(prompt, true)
  assert.equal(intentSectionOf(out).text, intentGuidance('unknown'))
  for (const intent of CONTRACTED) {
    assert.equal(intentSectionOf(out).text.includes(completionContract(intent)), false, `${intent}: no contract may leak into an unknown turn`)
  }
})

/* ── 5. Read-only regression ──────────────────────────────────────────────── */

test('read-only intents keep their boundary and gain no mutation permission', () => {
  const readOnly = {
    research: /before proposing or changing implementation/i,
    plan: /without modifying the repository/i,
    review: /do not repair it unless asked/i,
  }
  for (const [intent, boundary] of Object.entries(readOnly)) {
    const composed = `${intentGuidance(intent)} ${completionContract(intent)}`
    assert.match(composed, boundary, `${intent}: existing read-only boundary must survive`)
    assert.doesNotMatch(completionContract(intent), /\byou may (change|modify|edit|write)\b/iu, `${intent}: contract must not grant mutation`)
  }
})

test('investigate stays diagnostic unless the user asks otherwise', () => {
  assert.match(intentGuidance('investigate'), /diagnostic unless the user explicitly asks/i)
})

test('completion contract does not change intent classification or guidance', async () => {
  const out = await runAssemble(PROMPTS.fix, true)
  const text = intentSectionOf(out).text
  assert.ok(text.startsWith(intentGuidance('fix')), 'guidance must stay the prefix of the section')
})

test('continue remains a session-level intent', () => {
  const resumed = {
    id: SESSION_ID,
    header: {},
    events: [userMessage('实现一个用户登录失败次数限制。'), { type: 'tool/call', data: { name: 'phase_begin' } }],
  }
  assert.equal(boot.firstUserTask(resumed), '实现一个用户登录失败次数限制。')
  assert.equal(classifyIntent(boot.firstUserTask(resumed)), 'implement', 'a resumed session keeps its original task intent')
  assert.equal(classifyIntent('继续当前任务。'), 'continue')
})
