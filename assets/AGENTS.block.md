<!-- DSH-ENGINEERING-ROUTER:START -->
# Personal Engineering Rules

These rules apply across DSH projects unless the current user request, a project-level `AGENTS.md`, an approved ADR, or a more specific Trellis spec narrows them.

- **Understand before edit.** Read the active task/AC, relevant architecture/specs, target code/tests, and Git/worktree state first. Preserve pre-existing or unrelated changes.
- **Research before build.** For non-trivial or version-sensitive decisions, inspect the project first, then official docs/specs/upstream source and mature existing solutions. Use **Adopt → Adapt → Build**. Compare meaningful trade-offs before choosing. Do not rely on model memory for changing facts.
- **Search before ask.** Resolve discoverable facts from the repo, Trellis, Git, tests, code knowledge, or authoritative external sources before asking the user.
- **Minimum sufficient context.** Prefer Trellis, Graphify, LSP/symbol search, call/dependency graphs, `rg`, and targeted reads over broad repository scans. Graphs/summaries are navigation aids, not canonical truth.
- **Research → Design/Plan → Implement → Verify.** Architecture, protocols, schemas, persistence/security boundaries, stable contracts, or frozen decisions require the project's design/ADR path. Make the smallest coherent change; avoid speculative infrastructure and unrelated refactors.
- **Subagents are not cheap token savers.** Use them for genuinely independent parallel work, expert isolation, or context separation. Define scope and acceptance first. Never sleep/poll just to wait; continue independent work and synchronize at the dependency point.
- **Evidence before claims.** Match verification to risk; start focused and expand when needed. Do not weaken tests, thresholds, benchmarks, or AC to manufacture PASS. A quality gate may legitimately end in **STOP**.
- **Independent review for meaningful behavior changes.** For cross-module/API/schema/persistence/security changes, major bug fixes, and pre-merge review of multi-task work, use the engineering-review-gate skill. The reviewer must be fresh-context and read-only; reviewer judgment finds risks while tests/contracts/real runs prove behavior. Missing chain evidence is UNVERIFIED.
- Keep states distinct: **Implemented ≠ Verified ≠ Committed ≠ Pushed ≠ Released ≠ Accepted**. Never self-declare an external acceptance gate.
- **Git is evidence.** Check `git status` / relevant diffs at important boundaries. Do not reset, clean, rebase, force-push, overwrite unknown work, or publish without authorization. Never expose or commit secrets, credentials, logs, caches, reference downloads, or accidental generated artifacts.
- **Clean up your own task garbage.** Before finishing, remove only temporary scripts, logs/traces, downloads, experiment outputs, stale build/cache artifacts, and abandoned files that this task clearly created. Never delete pre-existing/unowned files just to make the worktree clean; fix recurring junk at the `.gitignore`/tool-config source.
- **Persist knowledge.** Put durable decisions in ADR/architecture, engineering rules in Trellis specs, requirements/AC in tasks, research and rejected alternatives in research/design artifacts, recurring failures in tests/lessons, session handoff in workspace, and code relations in the project knowledge layer.

If the project contains `.trellis/`, treat Trellis as the project workflow/control plane. If a current Graphify graph exists, query it before broad source reading; fall back immediately to source/LSP/`rg`/tests when the graph is stale or uncertain.
<!-- DSH-ENGINEERING-ROUTER:END -->
