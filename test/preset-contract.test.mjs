import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { assertPersonaConfig, normalizePersonaConfig } from '../scripts/compat-patches.mjs'

const shipped = readFileSync(new URL('../agent-presets/engineering-router/agent.cordis.yml', import.meta.url), 'utf8')

test('shipped Engineering Router uses dsh-persona config.prefix', () => {
  assert.equal(assertPersonaConfig(shipped), true)
  const start = shipped.indexOf('- id: persona')
  const next = shipped.indexOf('\n- id:', start + 8)
  const block = shipped.slice(start, next)
  assert.match(block, /\n    prefix:\s/)
  assert.doesNotMatch(block, /\n    text:\s/)
})

test('upstream legacy persona config.text is normalized to prefix', () => {
  const input = [
    '- id: persona',
    "  name: '@deepseek-ai/dsh-persona'",
    '  config:',
    '    text: >-',
    '      hello',
    '',
    '- id: next',
    "  name: 'example'",
    '',
  ].join('\n')
  const out = normalizePersonaConfig(input)
  assert.match(out, /\n    prefix: >-/)
  assert.doesNotMatch(out, /\n    text: >-/)
  assert.equal(assertPersonaConfig(out), true)
})

test('already-correct persona config.prefix is idempotent', () => {
  const input = [
    '- id: persona',
    "  name: '@deepseek-ai/dsh-persona'",
    '  config:',
    '    prefix: >-',
    '      hello',
    '',
  ].join('\n')
  assert.equal(normalizePersonaConfig(input), input)
})

test('unknown future persona config shape fails loud', () => {
  const input = [
    '- id: persona',
    "  name: '@deepseek-ai/dsh-persona'",
    '  config:',
    '    body: >-',
    '      hello',
    '',
  ].join('\n')
  assert.throws(() => normalizePersonaConfig(input), /neither required prefix nor known legacy text key/)
})
