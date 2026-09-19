---
name: engineering-project-bootstrap
description: Inspect or bootstrap a coding repository for disciplined DSH engineering with Trellis project workflow and Graphify code knowledge. Use when starting a substantial project, onboarding an existing repo, or when the user asks to set up/refresh Trellis or Graphify.
---

# Engineering Project Bootstrap

Use existing project state before installing anything.

1. Read project `AGENTS.md`, `.trellis/` if present, Git status, and relevant architecture docs.
2. Check tool availability with the actual current CLI help; do not guess flags:
   - `trellis --help`
   - `graphify --help`
3. If Trellis already exists, use/update the existing project workflow rather than creating a second state system.
4. If the user wants Trellis initialized and the current CLI supports DSH, use its documented DSH platform option. Preserve unrelated files and inspect the diff afterward.
5. For Graphify, prefer the generic Agent Skills integration for DSH. Install project-scoped when project portability matters. Build/rebuild a graph only when the repo is large enough to benefit, the task needs relationship navigation, or the existing graph is stale.
6. Do not commit `graphify-out/` by default. If the project wants derived graph artifacts versioned, make that an explicit project decision.
7. Treat Graphify as derived knowledge: query/path/explain to locate code, then verify against current source, contracts, and tests.
8. Record durable project rules in Trellis specs/ADRs/tests, not in this global skill.

Recommended working path:

`Understand → Research existing solutions → Trellis task/spec → Graphify/LSP/rg locate → target source/tests → plan → implement → verify → cleanup → handoff`
