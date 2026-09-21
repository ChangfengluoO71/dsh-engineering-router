#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { patchAgentCordis, patchBootstrap } from './sync-patches.mjs'

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

/**
 * Files replaced from upstream on every sync. Everything here is upstream-owned
 * and may be overwritten; local additions must NOT be carried by any of these
 * files, or they will be lost. Local, project-owned code belongs in modules that
 * are absent from this list — currently `intent-policy.mjs`. Do not add it here:
 * it does not exist upstream.
 */
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

for (const file of files) {
  const url = 'https://raw.githubusercontent.com/' + repo + '/' + ref + '/preset/router-standard/' + file
  let c = await text(url)
  if (file.startsWith('router-bootstrap')) {
    c = '// Modified by dsh-engineering-router: isolate persistent/global router state from router-standard.\n' + patchBootstrap(c, file)
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
