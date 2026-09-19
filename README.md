# dsh-engineering-router

A personal DeepSeek Harness engineering preset for `ChangfengluoO71`.

It combines four layers without turning them into one giant prompt:

- **Runtime routing:** a pinned derivative of `dsh-routing-suite/router-standard`.
- **Engineering policy:** a compact managed block in `$DSH_HOME/AGENTS.md`.
- **Project workflow:** Trellis when a repository uses `.trellis/`.
- **Code knowledge:** Graphify through DSH-compatible Agent Skills, used on demand.
- **Independent review:** a fresh read-only DSH reviewer plus Chain Integrity evidence for behavior changes.

The router code stays intentionally close to upstream. The only runtime fork required by default is **namespace isolation**: disk/global state named `router-standard` is changed to `engineering-router` so the original Router Standard and this preset can coexist safely.

A second compatibility patch is intentionally maintained: the raw Router Standard fallback currently uses `@deepseek-ai/dsh-persona` with `config.text`, while the DSH runtime schema requires `config.prefix`. Engineering Router normalizes that row during upstream sync and fails loud if the upstream shape changes unexpectedly.

## Install

```powershell
dsh plugin --profile web add github:ChangfengluoO71/dsh-engineering-router
```

Then restart the `web` profile once and create a new session with **Engineering Router**.

The bundle installs:

```text
$DSH_HOME/
├─ AGENTS.md                                  # managed rules block; unrelated content preserved
├─ .agent-presets/
│  └─ engineering-router/                    # complete DSH agent preset
└─ skills/
   ├─ engineering-project-bootstrap/
   │  └─ SKILL.md
   └─ engineering-review-gate/
      ├─ SKILL.md
      ├─ references/
      └─ scripts/review-package.mjs
```

It does **not** overwrite an unmanaged `engineering-router` directory. If a managed preset was edited locally, upgrades preserve those edits and log a warning unless the bundle config explicitly sets `force: true`.

## Upgrade

```powershell
dsh plugin --profile web update dsh-engineering-router
```

Restart the profile after changing bundle membership/version. On the next boot, the installer updates only files it manages. Before replacing a managed preset it creates a backup under:

```text
$DSH_HOME/backups/dsh-engineering-router/
```

and keeps the most recent three preset/skill backup generations.

## Project setup: Trellis + Graphify

The bundle deliberately does not auto-install external developer tools into every repository.

For a substantial project, invoke the installed **engineering-project-bootstrap** skill. It first inspects existing state and the current CLI help, then uses the project-native integration when appropriate.

Current upstream capabilities researched for this repository include:

```powershell
trellis init --dsh -u <user>
graphify install --project --platform agents
```

Do not blindly run these commands if the installed versions expose different CLI contracts; inspect `--help` first.

Graphify is a **derived navigation layer**, not a source of truth. Use query/path/explain to locate code, then verify against current source/contracts/tests. Do not rebuild the graph on every small task.

## Independent Review Gate

For non-trivial behavior changes, cross-module/API/schema/persistence/security work, major bug fixes, and final review of multi-task branches, use the installed **engineering-review-gate** skill.

The preset exposes `engineering_review` only in the verification phase. It is implemented with DSH's in-process `spawn` provider so the reviewer starts with a **fresh conversation**, not the implementer's reasoning history. Its child tool surface is mechanically restricted to the Router bootstrap control plus read-only workspace tools:

```text
phase_begin
read
glob
grep
```

The one `phase_begin` call is required because an in-process child joins the parent's preset and therefore inherits Router bootstrap; it does not grant workspace mutation. The reviewer is foreground, one-shot, and capped at `maxDepth: 1`: the first-level reviewer may be created, while its filtered tool surface contains no delegation, shell, or mutation tools and it cannot recursively create another reviewer.

The gate checks three distinct things:

1. **Spec compliance** — was the requested behavior actually implemented?
2. **Code quality** — correctness, error paths, compatibility, security, maintainability.
3. **Chain Integrity** — does each behavior-level AC connect through the real implementation path?

```text
Requirement / AC
  -> Entry Point
  -> Boundary / Interface
  -> Core Logic
  -> State / Persistence
  -> Downstream Consumer
  -> Observable Result
  -> Verification Evidence
```

Reviewer judgment is not acceptance authority. Tests, contracts, builds, and required real runs remain the evidence that proves behavior. Missing chain evidence is reported as **UNVERIFIED**, never guessed into PASS.

A deterministic helper creates a compact review package under the repository's Git metadata directory, including exact base/head, commit subjects **and bodies**, working-tree diff, status, untracked names, and references to requirements/evidence. This keeps the reviewer focused without copying the implementer's entire session.

## Design rules

The global managed AGENTS block enforces the cross-project behavior we want:

- understand before editing;
- Research → Design/Plan → Implement → Verify;
- **Adopt → Adapt → Build**;
- Search before Ask;
- Minimum Sufficient Context;
- Trellis as project workflow/control plane when present;
- Graphify/LSP/symbol search before broad repository scans;
- subagents only for real parallelism/expertise/context isolation, not as a low-level token-saving trick;
- no idle sleep/polling while independent work exists;
- Evidence Before Claims;
- `Implemented ≠ Verified ≠ Committed ≠ Pushed ≠ Released ≠ Accepted`;
- STOP is a valid quality result;
- Git/worktree safety;
- end-of-task cleanup of only task-owned junk;
- durable knowledge goes to ADR/spec/task/test/workspace/code knowledge, not only chat history.

See `docs/DESIGN.md` and `docs/COMPATIBILITY.md`.

## Upstream maintenance

The pinned source snapshot is recorded in `upstream.lock.json`.

To resync the vendored preset from another upstream commit:

```powershell
node scripts/sync-upstream.mjs <40-char-commit-sha>
npm test
git diff
```

You may pass `main`; the script resolves it to an exact SHA before writing the lock. Always review the diff and tests before publishing an upgrade.

## Tests

```powershell
npm run check
npm test
```

The test suite uses temporary `DSH_HOME` directories and does not modify your real DSH home.

## Optional ecosystem integrations

`dsh-trellis`, recovery/watchdog, hot-installer, additional memory layers, and extra compaction/capability-menu plugins are intentionally **not** hard dependencies. Add them only when their benefit is concrete and their ownership of session/context/tool lifecycle does not conflict with the router.

## License

Original project glue is MIT. Vendored Router Standard files retain their upstream MIT attribution; see `THIRD_PARTY_NOTICES.md` and `licenses/`.
