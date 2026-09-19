import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'

const script = fileURLToPath(new URL('../skills/engineering-review-gate/scripts/review-package.mjs', import.meta.url))

function run(exe, args, cwd, allowFail = false) {
  const r = spawnSync(exe, args, {
    cwd,
    encoding: 'utf8',
    shell: false,
  })
  if (r.error) throw r.error
  if (!allowFail && r.status !== 0) {
    throw new Error(exe + ' ' + args.join(' ') + ' failed: ' + (r.stderr || r.stdout))
  }
  return r
}

function git(args, cwd) {
  return run('git', args, cwd).stdout.trim()
}

test('review package captures committed, staged/unstaged, untracked, requirements, evidence, and commit bodies', () => {
  const root = mkdtempSync(join(tmpdir(), 'engineering-review-package-'))
  try {
    git(['init'], root)
    git(['config', 'user.email', 'review-test@example.invalid'], root)
    git(['config', 'user.name', 'Review Test'], root)

    writeFileSync(join(root, 'app.txt'), 'one\n', 'utf8')
    writeFileSync(join(root, 'requirements.md'), '# AC\n- app changes\n', 'utf8')
    writeFileSync(join(root, 'evidence.md'), '# Evidence\n- focused test PASS\n', 'utf8')
    git(['add', '.'], root)
    git(['commit', '-m', 'feat: baseline'], root)
    const base = git(['rev-parse', 'HEAD'], root)

    writeFileSync(join(root, 'app.txt'), 'one\ntwo\n', 'utf8')
    git(['add', 'app.txt'], root)
    git(['commit', '-m', 'feat: connect behavior', '-m', 'WHY: reviewer must see this commit body'], root)

    writeFileSync(join(root, 'app.txt'), 'one\ntwo\nthree\n', 'utf8')
    writeFileSync(join(root, 'new.txt'), 'untracked\n', 'utf8')

    const result = run(process.execPath, [
      script,
      '--mode', 'task',
      '--base', base,
      '--requirements', 'requirements.md',
      '--evidence', 'evidence.md',
    ], root)

    const packagePath = result.stdout.trim().split(/\r?\n/).at(-1)
    assert.ok(packagePath)
    assert.equal(existsSync(packagePath), true)

    const dir = dirname(packagePath)
    const review = readFileSync(packagePath, 'utf8')
    const diff = readFileSync(join(dir, 'diff.patch'), 'utf8')
    const commits = readFileSync(join(dir, 'commits.txt'), 'utf8')
    const untracked = readFileSync(join(dir, 'untracked.txt'), 'utf8')

    assert.match(review, /requirements\.md/)
    assert.match(review, /evidence\.md/)
    assert.match(diff, /\+two/)
    assert.match(diff, /\+three/)
    assert.match(commits, /WHY: reviewer must see this commit body/)
    assert.match(untracked, /new\.txt/)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('review package rejects an empty review set', () => {
  const root = mkdtempSync(join(tmpdir(), 'engineering-review-empty-'))
  try {
    git(['init'], root)
    git(['config', 'user.email', 'review-test@example.invalid'], root)
    git(['config', 'user.name', 'Review Test'], root)
    writeFileSync(join(root, 'app.txt'), 'one\n', 'utf8')
    git(['add', '.'], root)
    git(['commit', '-m', 'feat: baseline'], root)

    const result = run(process.execPath, [script, '--base', 'HEAD'], root, true)
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /empty review set/)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
