#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../', import.meta.url))
const LOCK_FILE = join(ROOT, 'upstream.lock.json')
const lock = JSON.parse(readFileSync(LOCK_FILE, 'utf8'))
const repo = lock.dshRoutingSuite.repository
let ref = process.argv[2] || lock.dshRoutingSuite.ref

async function json(url) {
  const r = await fetch(url, { headers: { 'user-agent': 'dsh-engineering-router-sync' } })
  if (!r.ok) throw new Error(url + ': HTTP ' + r.status)
  return r.json()
}
async function text(url) {
  const r = await fetch(url, { headers: { 'user-agent': 'dsh-engineering-router-sync' } })
  if (!r.ok) throw new Error(url + ': HTTP ' + r.status)
  return r.text()
}

if (!/^[0-9a-f]{40}$/i.test(ref)) {
  const meta = await json('https://api.github.com/repos/' + repo + '/commits/' + encodeURIComponent(ref))
  ref = meta.sha
}

const files = [
  'agent.cordis.yml',
  'preset.yml',
  'gitbash-executor.mjs',
  'router-bootstrap.mjs',
  'router-bootstrap-v34.mjs',
  'router-bootstrap-v34.selftest.mjs',
  'router-core.mjs',
  'router-core-v34.mjs',
]

function replaceRequired(c, before, after, label) {
  if (!c.includes(before)) throw new Error('upstream shape changed; cannot apply local patch: ' + label)
  return c.replace(before, after)
}

const REVIEW_TOOL_YAML = [
  '    # Fresh, read-only reviewer: no implementer history, mutation, or delegation.',
  '    - id: tool-subagent-engineering-review',
  "      name: '@deepseek-ai/dsh-tool-subagent'",
  '      config:',
  '        provider: spawn',
  '        toolName: engineering_review',
  '        enableRunInBackground: false',
  '        backgroundMode: one-shot',
  '        maxDepth: 1',
  '        toolFilter:',
  '          allow:',
  '            - read',
  '            - glob',
  '            - grep',
  '        persona: |',
  '          You are an independent senior engineering reviewer operating in a fresh context.',
  '          Treat implementer claims as unverified. Review spec compliance, code quality, chain integrity, and evidence.',
  '          Use only read, glob, and grep. Never modify files, run commands, or delegate.',
  '          Missing evidence is UNVERIFIED, never PASS. Require file:line findings and an explicit Chain Evidence matrix.',
  '',
].join('\n')

function patchBootstrap(c) {
  let out = c
    .replaceAll("process.env.DSH_HOME || homedir()", "dshHomeForState()")
    .replaceAll("join(dshHomeForState(), 'router-standard',", "join(dshHomeForState(), 'engineering-router',")
    .replaceAll("Symbol.for('router-standard.restrictLift')", "Symbol.for('engineering-router.restrictLift')")
    .replaceAll("Symbol.for('router-standard.overrides')", "Symbol.for('engineering-router.overrides')")

  if (!out.includes("'engineering_review'")) {
    out = replaceRequired(
      out,
      "{ name: '验证', tools: ['pwsh', 'bash', 'read_image', 'job_list', 'job_output', 'job_kill'] },",
      "{ name: '验证', tools: ['pwsh', 'bash', 'read_image', 'job_list', 'job_output', 'job_kill', 'engineering_review'] },",
      'verification stage reviewer tool',
    )
  }
  return out
}

function patchAgentCordis(c) {
  let out = c.replace(
    '# The `router-standard` agent preset:',
    '# The `engineering-router` agent preset (derived from router-standard):',
  )
  if (out.includes('toolName: engineering_review')) return out

  const anchor = [
    '    - id: tool-subagent-fork',
    "      name: '@deepseek-ai/dsh-tool-subagent'",
    '      config:',
    '        provider: fork',
    '        toolName: subagent_fork',
    '        backgroundMode: continuable',
    '',
  ].join('\n')
  return replaceRequired(out, anchor, anchor + REVIEW_TOOL_YAML, 'reviewer subagent row')
}

for (const file of files) {
  const url = 'https://raw.githubusercontent.com/' + repo + '/' + ref + '/preset/router-standard/' + file
  let c = await text(url)
  if (file.startsWith('router-bootstrap')) {
    c = '// Modified by dsh-engineering-router: isolate persistent/global router state from router-standard.\n' + patchBootstrap(c)
  } else if (file === 'agent.cordis.yml') {
    c = patchAgentCordis(c)
    c = '# Upstream snapshot: ' + repo + '@' + ref + '\n# Personal engineering policy is intentionally kept in $DSH_HOME/AGENTS.md and skills.\n' + c
  } else if (file === 'preset.yml') {
    c = 'name: Engineering Router\n'
      + 'description: "Personal engineering preset: upstream Router Standard runtime + global research-first/context/evidence rules + Trellis/Graphify project workflow integration."\n'
      + 'order: 2\n'
  }
  const dest = join(ROOT, 'agent-presets', 'engineering-router', file)
  mkdirSync(dirname(dest), { recursive: true })
  writeFileSync(dest, c, 'utf8')
}

lock.dshRoutingSuite.ref = ref
lock.dshRoutingSuite.syncedAt = new Date().toISOString()
writeFileSync(LOCK_FILE, JSON.stringify(lock, null, 2) + '\n', 'utf8')
console.log('Synced router-standard -> engineering-router @ ' + ref)
console.log('Run npm test and review the diff before committing.')
