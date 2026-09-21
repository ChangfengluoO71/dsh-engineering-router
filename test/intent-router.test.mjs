import test from 'node:test'
import assert from 'node:assert/strict'
import { classifyIntent, intentGuidance } from '../agent-presets/engineering-router/intent-policy.mjs'

test('classifyIntent recognizes concise daily intents', () => {
  assert.equal(classifyIntent('实现新的封面读取逻辑'), 'implement')
  assert.equal(classifyIntent('修复 Android release 构建失败'), 'fix')
  assert.equal(classifyIntent('调查为什么 release 找不到封面'), 'investigate')
  assert.equal(classifyIntent('研究当前 versionCode 行为，先不要改代码'), 'research')
  assert.equal(classifyIntent('规划这个改动的最小安全方案'), 'plan')
  assert.equal(classifyIntent('审查当前改动的链路完整性'), 'review')
  assert.equal(classifyIntent('继续当前任务'), 'continue')
})

test('classification is guidance only and unknown is safe', () => {
  assert.equal(classifyIntent('帮我看看这个项目'), 'unknown')
  assert.match(intentGuidance('implement'), /do not require the user to spell out the workflow/i)
  assert.match(intentGuidance('unknown'), /minimum necessary workflow/i)
})
