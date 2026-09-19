# Changelog

## 0.2.1 — 2026-09-19

- Fixed a real DSH mount blocker: `@deepseek-ai/dsh-persona` requires `config.prefix`; v0.2.0 shipped the upstream fallback's legacy `config.text`.
- Added a fail-loud compatibility normalizer so future `sync-upstream.mjs` runs convert only the known legacy persona shape and stop on unknown upstream schema changes.
- Added `check-preset-contract.mjs` plus regression tests for shipped `prefix`, legacy `text -> prefix` normalization, idempotence, and unknown-shape rejection.
- Recorded the v0.2.0 real-run failure as a compatibility regression baseline. Full Engineering Router / reviewer runtime acceptance remains pending the v0.2.1 retest.

## 0.2.0 — 2026-09-19

- Added an independent fresh-context Engineering Review tool backed by DSH spawn.
- Reviewer is workspace-read-only (Router `phase_begin` bootstrap + read/glob/grep), one-shot, foreground, and capped at depth 1 so the first child may start without recursive delegation.
- Added engineering-review-gate skill with task, final, re-review, and Chain Integrity guidance.
- Added deterministic review-package builder capturing commit bodies, working-tree diff, status, untracked files, and evidence references.
- Added review configuration/package regression tests and preserved the local review patch across upstream Router sync.
- Added community research baselines for Superpowers, dsh-doublecheck, Agentic Delivery OS, and staff-engineer-mode.

## 0.1.0 — 2026-09-19

- Initial installable Engineering Router bundle.
- Vendored Router Standard baseline at `yjh051108/dsh-routing-suite@195273352f23bff7f9023ebe2ec0cdbdf9c98f10`.
- Isolated persistent/global Router state under the `engineering-router` namespace.
- Added safe preset/skill materialization with backup and local-edit protection.
- Added managed global engineering rules and project bootstrap skill.
- Added Trellis/Graphify integration guidance, community research notes, package-payload validation, and Windows/Linux CI.
