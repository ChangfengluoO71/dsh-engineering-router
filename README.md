# dsh-engineering-router

A personal DeepSeek Harness engineering preset for `ChangfengluoO71`.

It combines four layers without turning them into one giant prompt:

- **Runtime routing:** a pinned derivative of `dsh-routing-suite/router-standard`.
- **Engineering policy:** a compact managed block in `$DSH_HOME/AGENTS.md`.
- **Project workflow:** Trellis when a repository uses `.trellis/`.
- **Code knowledge:** Graphify through DSH-compatible Agent Skills, used on demand.

The router code stays intentionally close to upstream. The only runtime fork required by default is **namespace isolation**: disk/global state named `router-standard` is changed to `engineering-router` so the original Router Standard and this preset can coexist safely.

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
   └─ engineering-project-bootstrap/
      └─ SKILL.md
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
npm test
npm run check
```

The test suite uses temporary `DSH_HOME` directories and does not modify your real DSH home.

## Optional ecosystem integrations

`dsh-trellis`, recovery/watchdog, hot-installer, additional memory layers, and extra compaction/capability-menu plugins are intentionally **not** hard dependencies. Add them only when their benefit is concrete and their ownership of session/context/tool lifecycle does not conflict with the router.

## License

Original project glue is MIT. Vendored Router Standard files retain their upstream MIT attribution; see `THIRD_PARTY_NOTICES.md` and `licenses/`.
