---
name: engineering-review-gate
description: Use after non-trivial implementation, cross-module/API/schema changes, major bug fixes, or before merge to obtain an independent fresh-context review of spec compliance, chain integrity, and evidence.
---

# Engineering Review Gate

This is a review gate, not a second implementation workflow. Trellis remains the project task/spec/AC control plane when present.

## Core contract

- The implementer does not grade its own work.
- The reviewer is a fresh spawn child with no implementer conversation history.
- The reviewer is mechanically workspace-read-only: `phase_begin` is retained only to bootstrap its inherited Router session, then it has `read`, `glob`, and `grep`; no shell, edit, delegation, or workflow tools.
- Reviewer judgment finds risks; deterministic tests/contracts/real runs prove behavior.
- Missing evidence is UNVERIFIED, never PASS.

## When to use

- Low risk: docs/comments/mechanical edits -> focused tests + diff self-check; reviewer optional.
- Normal behavior change: one independent task review before handoff.
- Cross-boundary change: task review with Chain Integrity emphasis.
- High risk: API/protocol/schema/persistence/security/release path -> independent review + real integration/contract evidence + final whole-branch review.
- Before merge: perform a whole-branch review when the change spans multiple tasks or subsystems.

## 1. Prepare evidence

Before dispatching review:

1. Read the current Trellis task/AC if present.
2. Run the focused deterministic checks appropriate to the change.
3. Preserve exact commands/results in an existing evidence file when the project already has one.
4. If Graphify has a current graph, use it to identify changed-symbol callers/callees and cross-boundary risk. Do not rebuild a healthy graph just for ceremony.
5. Determine the review base. Prefer the task/branch baseline; otherwise use the merge base with the target branch.

## 2. Build a review package

The installed helper lives with this skill. Resolve DSH_HOME first; its normal default is HOME/.dsh.

Git Bash / POSIX example:

    node "$HOME/.dsh/skills/engineering-review-gate/scripts/review-package.mjs" --mode task --base <BASE_SHA> --requirements <task-or-spec-path> --evidence <evidence-path>

PowerShell example:

    node "$HOME/.dsh/skills/engineering-review-gate/scripts/review-package.mjs" --mode task --base <BASE_SHA> --requirements <task-or-spec-path> --evidence <evidence-path>

--requirements and --evidence may be repeated and are optional when the project has no corresponding artifact. The helper writes under .git/dsh-engineering-review/, so it does not dirty the worktree.

The package contains exact base/head, commit subjects and bodies, status/name-status/stat, the full tracked working-tree diff against base, untracked file names, and referenced requirements/evidence paths. Untracked file contents are not copied; the reviewer reads any relevant untracked paths directly so the package does not duplicate arbitrary binaries or secrets.

## 3. Dispatch the independent reviewer

Call engineering_review in the foreground. Do not use subagent_fork.

Give it:
- the review package path;
- review mode: task, final, or re-review;
- any concise Graphify impact hints;
- the exact requirements/evidence paths when not already in the package.

The reviewer must return:

    Status: PASS | FAIL | UNVERIFIED
    Spec Compliance: PASS | FAIL | UNVERIFIED
    Chain Integrity: PASS | FAIL | UNVERIFIED
    Test Evidence: PASS | FAIL | INCOMPLETE
    Findings: Critical / Important / Minor
    Chain Evidence:
      AC -> Entry -> Boundary -> Logic -> State -> Consumer -> Observable -> Evidence
    Unverified:
    Required Follow-up:

## 4. Chain Integrity is mandatory for behavior changes

For every behavior-level AC, trace as far as applicable:

Requirement/AC -> Entry Point -> Boundary/Interface -> Core Logic -> State/Persistence -> Downstream Consumer -> Observable Result -> Verification Evidence

Do not infer a chain from matching names. Verify the actual call/data/state path in source. If relevant end-to-end or contract evidence is absent, mark the chain UNVERIFIED and name the smallest proof needed.

See references/chain-integrity.md.

## 5. Adjudicate, fix, and re-review

- Critical / Important: resolve before handoff unless the user explicitly accepts the risk.
- Minor: may be deferred with a recorded reason.
- UNVERIFIED: controller obtains missing deterministic/real-run evidence; a reviewer cannot convert absence of evidence into PASS.
- After fixes, use a scoped re-review: previous findings + fix diff. Do not pay for another broad review unless the fix changes the risk surface materially.

See references/re-reviewer.md.

## 6. Final whole-branch review

For multi-task or cross-subsystem work, perform one final broad review from branch/task base to current candidate. Focus on cross-task integration, contract/API compatibility, state/migration paths, security/data boundaries, end-to-end Chain Evidence, and tests that prove integrated behavior rather than isolated mocks.

See references/final-reviewer.md.

## 7. Close the gate

The reviewer is not the acceptance authority.

After review findings are resolved, run the project-required deterministic quality gate and any required real integration/run evidence. Persist durable review findings/evidence in the project's normal Trellis/evidence path when useful.

Delete only the exact temporary review-package directory after useful evidence has been persisted. Never delete unrelated files to obtain a clean worktree.
