# Changelog

## 0.2.0 — 2026-09-19

- Added an independent fresh-context Engineering Review tool backed by DSH spawn.
- Reviewer is mechanically read-only (read/glob/grep), one-shot, foreground, and delegation depth 0.
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
