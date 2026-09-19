import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const preset = readFileSync(new URL('../agent-presets/engineering-router/agent.cordis.yml', import.meta.url), 'utf8')

test('engineering reviewer is a fresh one-shot spawn with a read-only tool surface', () => {
  const start = preset.indexOf('- id: tool-subagent-engineering-review')
  assert.notEqual(start, -1, 'reviewer row must exist')
  const next = preset.indexOf('\n    - id:', start + 8)
  const block = preset.slice(start, next === -1 ? undefined : next)

  assert.match(block, /provider: spawn/)
  assert.match(block, /toolName: engineering_review/)
  assert.match(block, /enableRunInBackground: false/)
  assert.match(block, /backgroundMode: one-shot/)
  assert.match(block, /maxDepth: 0/)

  const filterStart = block.indexOf('toolFilter:')
  const personaStart = block.indexOf('persona:')
  assert.ok(filterStart >= 0 && personaStart > filterStart)
  const filter = block.slice(filterStart, personaStart)
  for (const name of ['read', 'glob', 'grep']) assert.match(filter, new RegExp('- ' + name + '\\b'))
  for (const name of ['write', 'edit', 'bash', 'pwsh', 'skill', 'subagent']) {
    assert.doesNotMatch(filter, new RegExp('- ' + name + '\\b'))
  }

  assert.match(block, /fresh context/i)
  assert.match(block, /Chain Integrity/i)
  assert.match(block, /UNVERIFIED/)
})

test('progressive router exposes engineering_review only in verification stage', () => {
  for (const file of ['router-bootstrap.mjs', 'router-bootstrap-v34.mjs']) {
    const src = readFileSync(new URL('../agent-presets/engineering-router/' + file, import.meta.url), 'utf8')
    const validation = src.split('\n').find((line) => line.includes("name: '验证'"))
    assert.ok(validation, file + ': validation stage missing')
    assert.match(validation, /engineering_review/)
    const earlier = src.split('\n').filter((line) =>
      line.includes("name: '了解/对齐'") ||
      line.includes("name: '拟合方案'") ||
      line.includes("name: '开发'")
    ).join('\n')
    assert.doesNotMatch(earlier, /engineering_review/)
  }
})
