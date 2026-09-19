import { spawnSync } from 'node:child_process'

const exe = 'npm'
const r = spawnSync(exe, ['pack', '--dry-run', '--json'], {
  cwd: new URL('../', import.meta.url),
  encoding: 'utf8',
  shell: process.platform === 'win32',
})
if (r.error) throw r.error
if (r.status !== 0) {
  process.stderr.write(r.stderr || r.stdout)
  process.exit(r.status ?? 1)
}
const report = JSON.parse(r.stdout)
const names = new Set((report[0]?.files || []).map((f) => f.path))
const required = [
  'package.json',
  'cordis.patch.yml',
  'lib/index.js',
  'assets/AGENTS.block.md',
  'skills/engineering-project-bootstrap/SKILL.md',
  'skills/engineering-review-gate/SKILL.md',
  'skills/engineering-review-gate/references/chain-integrity.md',
  'skills/engineering-review-gate/references/task-reviewer.md',
  'skills/engineering-review-gate/references/final-reviewer.md',
  'skills/engineering-review-gate/references/re-reviewer.md',
  'skills/engineering-review-gate/scripts/review-package.mjs',
  'agent-presets/engineering-router/agent.cordis.yml',
  'agent-presets/engineering-router/preset.yml',
  'agent-presets/engineering-router/router-bootstrap-v34.mjs',
  'licenses/dsh-routing-suite.LICENSE',
  'licenses/dsh-gitbash-preset.LICENSE',
]
const missing = required.filter((p) => !names.has(p))
if (missing.length) {
  console.error('npm pack missing required files:', missing.join(', '))
  process.exit(1)
}
console.log('package dry-run OK:', names.size, 'files')
