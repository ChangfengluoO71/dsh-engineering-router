<!-- DSH-ENGINEERING-ROUTER:START -->
# Personal Engineering Rules

These rules apply across DSH projects unless the current user request, a project-level `AGENTS.md`, an approved ADR, or a more specific Trellis spec narrows them.

- **Understand before edit.** Start from the user's goal, then inspect the active task/AC, relevant architecture/specs, source/tests, and Git/worktree state. Preserve unrelated changes.
- **Research when uncertainty matters.** For non-trivial or version-sensitive decisions, verify the repository first, then authoritative docs/specs/upstream and mature solutions. Use Adopt → Adapt → Build; do not rely on stale model memory.
- **Search before ask.** Discover facts from the repository, Trellis, Git, tests, code knowledge, or authoritative external sources before asking the user. Ask only for user-owned choices or material ambiguity.
- **Minimum sufficient context.** Prefer Trellis, Graphify, LSP/symbol search, call/dependency graphs, `rg`, and targeted reads over broad scans. Graphs are navigation aids, not canonical truth.
- **Execute the smallest complete change.** Use the project's design/ADR path for architecture, protocols, schemas, persistence/security boundaries, or frozen decisions. Avoid speculative infrastructure and unrelated refactors. Use subagents only for genuine parallelism, expertise, or context isolation—not as low-level token savers—and never idle/poll while independent work exists.
- **Verify before claiming.** Match evidence to risk; expand when needed. Never weaken tests, thresholds, benchmarks, or AC to manufacture PASS. A quality gate may legitimately end in STOP.
- **Review meaningful behavior changes independently.** For cross-module/API/schema/persistence/security changes, major bug fixes, and pre-merge multi-task work, use the engineering-review-gate skill. Reviewer is fresh-context and read-only; tests/contracts/real runs prove behavior. Missing chain evidence is UNVERIFIED.
- **Keep state boundaries explicit.** `Implemented ≠ Verified ≠ Committed ≠ Pushed ≠ Released ≠ Accepted`. Check Git at important boundaries; never reset, clean, rebase, force-push, overwrite unknown work, or publish without authorization.
- **Clean up and persist.** Remove only task-owned temporary artifacts. Put durable decisions in ADR/architecture, engineering rules in Trellis, requirements/AC in tasks, research/rejected alternatives in research/design artifacts, recurring failures in tests/lessons, handoff in workspace, and code relations in the project knowledge layer.

If the project contains `.trellis/`, treat Trellis as the project workflow/control plane. If a current Graphify graph exists, query it before broad source reading; fall back immediately to source/LSP/`rg`/tests when the graph is stale or uncertain.
<!-- DSH-ENGINEERING-ROUTER:END -->
