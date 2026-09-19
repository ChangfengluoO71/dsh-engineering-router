#!/usr/bin/env node
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { isAbsolute, join, relative, resolve } from 'node:path'

function fail(message, code = 2) {
  console.error('review-package: ' + message)
  process.exit(code)
}

function git(args, cwd, options = {}) {
  const r = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    shell: false,
    maxBuffer: 64 * 1024 * 1024,
  })
  if (r.error) throw r.error
  if (r.status !== 0 && !options.allowFail) {
    fail('git ' + args.join(' ') + ' failed:\n' + (r.stderr || r.stdout || '').trim(), 3)
  }
  return { status: r.status ?? 1, stdout: r.stdout || '', stderr: r.stderr || '' }
}

function parseArgs(argv) {
  const out = { mode: 'task', requirements: [], evidence: [], focus: [], previous: [] }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--mode' || a === '--base' || a === '--head') {
      const v = argv[++i]
      if (!v) fail(a + ' requires a value')
      out[a.slice(2)] = v
    } else if (a === '--requirements' || a === '--evidence' || a === '--focus' || a === '--previous-review') {
      const v = argv[++i]
      if (!v) fail(a + ' requires a value')
      const key = a === '--previous-review' ? 'previous' : a.slice(2)
      out[key].push(v)
    } else if (a === '--help' || a === '-h') {
      console.log('Usage: review-package.mjs [--mode task|final|re-review] [--base REF] [--head REF] [--requirements FILE]... [--evidence FILE]... [--focus FILE]... [--previous-review FILE]...')
      process.exit(0)
    } else {
      fail('unknown argument: ' + a)
    }
  }
  if (!['task', 'final', 're-review'].includes(out.mode)) fail('--mode must be task|final|re-review')
  return out
}

const args = parseArgs(process.argv.slice(2))
const root = git(['rev-parse', '--show-toplevel'], process.cwd()).stdout.trim()
if (!root) fail('not inside a Git worktree', 3)

function commit(ref) {
  return git(['rev-parse', '--verify', ref + '^{commit}'], root).stdout.trim()
}

const head = commit(args.head || 'HEAD')

let base
if (args.base) {
  base = commit(args.base)
} else {
  const originMain = git(['rev-parse', '--verify', 'origin/main^{commit}'], root, { allowFail: true })
  if (originMain.status === 0) {
    base = git(['merge-base', originMain.stdout.trim(), head], root).stdout.trim()
  } else {
    const parent = git(['rev-parse', '--verify', head + '^'], root, { allowFail: true })
    if (parent.status !== 0) fail('cannot infer BASE; pass --base explicitly', 3)
    base = parent.stdout.trim()
  }
}

if (git(['merge-base', '--is-ancestor', base, head], root, { allowFail: true }).status !== 0) {
  fail('HEAD is not a descendant of BASE; choose the task/branch baseline explicitly', 3)
}

function normalizeWorkspaceFile(p, label) {
  const abs = isAbsolute(p) ? resolve(p) : resolve(root, p)
  const rel = relative(root, abs).replaceAll('\\', '/')
  if (rel === '..' || rel.startsWith('../')) fail(label + ' must be inside the worktree: ' + p)
  if (!existsSync(abs)) fail(label + ' not found: ' + p)
  return rel
}

const requirements = args.requirements.map((p) => normalizeWorkspaceFile(p, 'requirements'))
const evidence = args.evidence.map((p) => normalizeWorkspaceFile(p, 'evidence'))
const focus = args.focus.map((p) => normalizeWorkspaceFile(p, 'focus'))
const previous = args.previous.map((p) => normalizeWorkspaceFile(p, 'previous review'))

const status = git(['status', '--short'], root).stdout
const stat = git(['diff', '--stat', '--find-renames', base, '--'], root).stdout
const nameStatus = git(['diff', '--name-status', '--find-renames', base, '--'], root).stdout
const diff = git(['diff', '--find-renames', '--unified=10', base, '--'], root).stdout
const diffCheckResult = git(['diff', '--check', base, '--'], root, { allowFail: true })
const untracked = git(['ls-files', '--others', '--exclude-standard'], root).stdout
const commits = base === head
  ? '(no committed changes in BASE..HEAD; working-tree delta may still be under review)\n'
  : git(['log', '--format=commit %H%nsubject: %s%nbody:%n%b%n---END-COMMIT---', base + '..' + head], root).stdout

if (!diff.trim() && !untracked.trim() && base === head) {
  fail('empty review set: BASE equals HEAD and the working tree has no tracked or untracked changes', 3)
}

const gitDirRaw = git(['rev-parse', '--git-dir'], root).stdout.trim()
const gitDir = isAbsolute(gitDirRaw) ? gitDirRaw : resolve(root, gitDirRaw)
const id = new Date().toISOString().replace(/[:.]/g, '-') + '-' + process.pid
const outDir = join(gitDir, 'dsh-engineering-review', id)
mkdirSync(outDir, { recursive: true })

writeFileSync(join(outDir, 'diff.patch'), diff, 'utf8')
writeFileSync(join(outDir, 'stat.txt'), stat, 'utf8')
writeFileSync(join(outDir, 'name-status.txt'), nameStatus, 'utf8')
writeFileSync(join(outDir, 'status.txt'), status, 'utf8')
writeFileSync(join(outDir, 'commits.txt'), commits, 'utf8')
writeFileSync(join(outDir, 'untracked.txt'), untracked, 'utf8')
writeFileSync(join(outDir, 'diff-check.txt'), (diffCheckResult.stdout || diffCheckResult.stderr || '(clean)\n'), 'utf8')

const relOut = relative(root, outDir).replaceAll('\\', '/')
const lines = [
  '# Engineering Review Package',
  '',
  '- Mode: ' + args.mode,
  '- Worktree: ' + root,
  '- Base: ' + base,
  '- Head: ' + head,
  '- Candidate includes current working tree relative to Base: yes',
  '',
  '## Review inputs',
  '',
  '- Diff: ' + relOut + '/diff.patch',
  '- Diff stat: ' + relOut + '/stat.txt',
  '- Name/status: ' + relOut + '/name-status.txt',
  '- Git status: ' + relOut + '/status.txt',
  '- Commit subjects + bodies: ' + relOut + '/commits.txt',
  '- Untracked files: ' + relOut + '/untracked.txt',
  '- git diff --check output: ' + relOut + '/diff-check.txt',
  '',
  '### Requirements',
  ...(requirements.length ? requirements.map((p) => '- ' + p) : ['- (none supplied)']),
  '',
  '### Test / verification evidence',
  ...(evidence.length ? evidence.map((p) => '- ' + p) : ['- (none supplied)']),
  '',
  '### Review focus',
  ...(focus.length ? focus.map((p) => '- ' + p) : ['- (none supplied)']),
  '',
  '### Previous review artifacts',
  ...(previous.length ? previous.map((p) => '- ' + p) : ['- (none supplied)']),
  '',
  '## Reviewer contract',
  '',
  'Treat implementer claims as unverified. Read the diff and relevant requirements/evidence before judging.',
  'For behavior changes, build a Chain Evidence Matrix and verify actual source links rather than matching names.',
  'Do not modify the worktree. Missing proof is UNVERIFIED, not PASS.',
  '',
]
const packagePath = join(outDir, 'review-package.md')
writeFileSync(packagePath, lines.join('\n'), 'utf8')

console.log(packagePath)
