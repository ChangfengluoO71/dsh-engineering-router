import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { apply } from '../lib/index.js'

test('installer materializes preset, skill, and preserves unrelated AGENTS content', () => {
  const root = mkdtempSync(join(tmpdir(), 'dsh-engineering-router-'))
  const oldHome = process.env.DSH_HOME
  process.env.DSH_HOME = root
  try {
    writeFileSync(join(root, 'AGENTS.md'), '# My existing rules\n', 'utf8')
    apply({}, {})
    assert.match(readFileSync(join(root, 'AGENTS.md'), 'utf8'), /# My existing rules/)
    assert.match(readFileSync(join(root, 'AGENTS.md'), 'utf8'), /DSH-ENGINEERING-ROUTER:START/)
    assert.match(readFileSync(join(root, '.agent-presets', 'engineering-router', 'preset.yml'), 'utf8'), /Engineering Router/)
    assert.match(readFileSync(join(root, 'skills', 'engineering-project-bootstrap', 'SKILL.md'), 'utf8'), /name: engineering-project-bootstrap/)
  } finally {
    if (oldHome === undefined) delete process.env.DSH_HOME
    else process.env.DSH_HOME = oldHome
    rmSync(root, { recursive: true, force: true })
  }
})

test('managed preset refuses to overwrite local edits unless force is explicit', () => {
  const root = mkdtempSync(join(tmpdir(), 'dsh-engineering-router-'))
  const oldHome = process.env.DSH_HOME
  process.env.DSH_HOME = root
  try {
    apply({}, { installGlobalRules: false, installBootstrapSkill: false })
    const file = join(root, '.agent-presets', 'engineering-router', 'preset.yml')
    writeFileSync(file, 'name: Local Customization\n', 'utf8')
    apply({}, { installGlobalRules: false, installBootstrapSkill: false })
    assert.match(readFileSync(file, 'utf8'), /Local Customization/)
    apply({}, { force: true, installGlobalRules: false, installBootstrapSkill: false })
    assert.match(readFileSync(file, 'utf8'), /Engineering Router/)
  } finally {
    if (oldHome === undefined) delete process.env.DSH_HOME
    else process.env.DSH_HOME = oldHome
    rmSync(root, { recursive: true, force: true })
  }
})

test('router persistent namespace is isolated from router-standard', () => {
  const root = new URL('../agent-presets/engineering-router/', import.meta.url)
  for (const f of ['router-bootstrap.mjs', 'router-bootstrap-v34.mjs']) {
    const c = readFileSync(new URL(f, root), 'utf8')
    assert.match(c, /engineering-router/)
    assert.doesNotMatch(c, /Symbol\.for\('router-standard\./)
    assert.doesNotMatch(c, /join\(dshHomeForState\(\), 'router-standard'/)
  }
})
