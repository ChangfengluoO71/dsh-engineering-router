# Usage Guide

This page is the practical guide for dsh-engineering-router 0.2.1: installation, verification, project onboarding, review-gate operation, upgrade, and removal.

> Runtime Acceptance baseline: DSH 0.1.5-rc.2, Bundle 0.2.1. This baseline passed real DSH Runtime Acceptance. DSH is still evolving quickly, so future versions should be checked against the compatibility baseline.

## 1. What you get

Engineering Router is a DSH engineering environment rather than a standalone chat tool.

| Layer | Purpose | When you notice it |
|---|---|---|
| Engineering Router preset | Routing, staged tool exposure, plan/delivery behavior | Every new Engineering Router session |
| Global AGENTS rules | Research when uncertainty matters, smallest complete changes, verification, Git safety, evidence discipline | Applicable engineering tasks |
| engineering-project-bootstrap Skill | Trellis / Graphify project onboarding | New projects and repository onboarding |
| engineering-review-gate Skill | Fresh-context Reviewer + Chain Integrity | Non-trivial changes and merge gates |

It does not automatically:

- edit project source code;
- initialize Trellis;
- rebuild Graphify on every task;
- create Git commits or push;
- turn the Reviewer into a second Implementer;
- install or replace your model provider.

At boot, the Bundle installer only materializes its managed preset, Skills, and AGENTS block under $DSH_HOME.

## 2. Prerequisites

Check:

~~~powershell
node --version
dsh --version
pnpm --version
~~~

This package declares Node >=20. Use the Node requirement of your installed DSH for the host itself.

dsh plugin forwards plugin operations to pnpm inside the target profile, so pnpm must be on PATH.

The current repository ships built lib files and has no additional prepare script. A normal GitHub install therefore does not require a separate build step for this repository. If DSH or pnpm reports a build approval requirement, follow the exact current CLI output rather than guessing flags.

### Validated scope

v0.2.1 has real runtime coverage for:

- DSH 0.1.5-rc.2;
- the Web profile;
- Engineering Router mount and session creation;
- Router phase progression;
- engineering_review phase gating;
- fresh spawn Reviewer;
- read-only Reviewer isolation;
- broken-chain → FAIL / fixed-chain → PASS;
- Router Standard coexistence.

Use the web profile first. Other profiles may be installable through normal DSH profile mechanics, but they are outside this Runtime Acceptance scope.

## 3. Install

### 3.1 Follow current main

~~~powershell
dsh plugin --profile web add github:ChangfengluoO71/dsh-engineering-router
~~~

Inspect the actual composition before booting:

~~~powershell
dsh --profile web --dump-config
~~~

Then restart Web:

~~~powershell
dsh web
~~~

If dsh web was already running, stop it completely and start it again. Bundle membership is composed at boot.

### 3.2 Pin the accepted v0.2.1 runtime commit

For a reproducible runtime baseline, install the exact commit used by the v0.2.1 runtime gate:

~~~powershell
dsh plugin --profile web add github:ChangfengluoO71/dsh-engineering-router#5c52b4720c71e9f53bbd7fa3c0695f38fb0ac6ad
~~~

Pinning is preferable for repeatable experiments and compatibility debugging.

## 4. Start an Engineering Router session

After starting the Web UI:

1. Create a new session.
2. Select Engineering Router in the Agent preset / Mode picker.
3. Start the engineering task.

A DSH preset is fixed when the session is created. Changing the default later does not turn an existing running session into Engineering Router. Use a new session when testing a different preset.

The session records the preset it was composed from. Do not casually delete the Engineering Router preset directory if historical sessions created under it must still be resumed.

## 5. Onboard a project

The normal user does **not** need a separate reconnaissance prompt. Start with the outcome you want:

~~~text
Implement <goal>.
~~~

Engineering Router should discover the current task, repository state, architecture, tests, and project knowledge before changing code. It should ask only when a decision belongs to the user or cannot be discovered safely.

For a **new or unfamiliar project**, you can explicitly request a read-only reconnaissance pass:

~~~text
Inspect the project first. Do not modify anything. Report the relevant sources of truth, task/AC entry points, verification entry points, and minimum sufficient context for this goal.
~~~

The internal workflow remains:

~~~text
Intent → Understand → Research when needed → Locate → Plan when needed
      → Implement → Verify → Review when risk requires it → Handoff
~~~

The user should normally express the **intent**, not manually orchestrate these phases. This avoids creating a second task system, treating Graphify as canonical truth, changing code before locating verification, or asking for facts that the repository can reveal.

## 6. Daily task instructions

Use the shortest instruction that expresses the outcome:

| Intent | Example |
|---|---|
| Implement | `Implement the new cover lookup behavior.` |
| Fix | `Fix the cover lookup failure.` |
| Investigate | `Investigate why cover lookup fails on Android release builds.` |
| Research | `Research the current Android versionCode behavior. Do not modify code.` |
| Plan | `Plan the smallest safe implementation for this change. Do not modify code.` |
| Review | `Review the current changes for correctness and chain integrity.` |
| Continue | `Continue from the current task state.` |

You may add constraints when they matter:

~~~text
Implement <goal>. Preserve the existing public contract and unrelated dirty changes.
~~~

~~~text
Research <question>. Do not modify the repository; use current repository and authoritative external evidence.
~~~

~~~text
Implement <goal>. Verify the behavior before claiming completion.
~~~

Do not normally write prompts that enumerate `Research → Design → Implement → Verify → Review`. Those are Router policy, not user ceremony. Explicit phase instructions remain useful when you intentionally want to constrain the session, but they should be the exception.

For unknown technical problems, the Router should automatically research the repository and authoritative external sources before choosing an implementation. For architecture, protocol, schema, persistence, or security changes, it should enter the project's design/ADR path when required.

The final report must still distinguish `Implemented / Verified / Committed / Pushed / Accepted` and must stop when required evidence is missing.

## 7. Independent Review Gate

This is the main operational feature of the Bundle.

### When to use it

| Change | Review |
|---|---|
| README/comments/mechanical edit | Usually optional |
| Normal behavior change | Recommended task review |
| Cross-module/API/schema | Use it |
| Persistence/migration | Use it |
| Security boundary | Use it |
| Major bug fix | Use it |
| Multi-task branch before merge | Final whole-branch review |

The Reviewer is not another implementer. Its value is an independent context plus a mechanically read-only tool surface.

### 7.1 Prepare deterministic evidence

Run the focused tests, contracts, build, or real-run evidence appropriate to the change before dispatching the Reviewer.

Do not use a Reviewer sentence as a substitute for executable evidence.

### 7.2 Build a Review Package

PowerShell:

~~~powershell
$dshRoot = if ($env:DSH_HOME) { $env:DSH_HOME } else { Join-Path $HOME ".dsh" }
$reviewScript = Join-Path $dshRoot "skills/engineering-review-gate/scripts/review-package.mjs"

node $reviewScript `
  --mode task `
  --base <BASE_SHA> `
  --requirements <task-or-spec-path> `
  --evidence <evidence-path>
~~~

requirements and evidence are repeatable and optional when the project has no corresponding artifact.

The helper writes under .git/dsh-engineering-review/, so it does not dirty the ordinary worktree.

The package captures:

- exact base/head;
- commit subjects and bodies;
- Git status/name-status/stat;
- tracked working-tree diff against base;
- untracked file names;
- requirement/evidence paths.

Untracked file contents are not duplicated into the package; the Reviewer reads relevant paths directly.

### 7.3 Dispatch in verification phase

When Engineering Router reaches the verification phase, engineering_review becomes available.

Give it:

- the Review Package path;
- task, final, or re-review mode;
- requirements/evidence paths when needed;
- concise Graphify impact hints when useful.

The Reviewer is a fresh DSH spawn, not a fork of the implementer conversation history.

### 7.4 Runtime-isolated tool surface

The v0.2.1 runtime gate verified:

~~~text
phase_begin
read
glob
grep
~~~

The Reviewer does not have:

- write/edit;
- shell;
- delegation;
- subagent;
- workflow mutation;
- other workspace mutation tools.

It can inspect, but it cannot secretly repair the implementation.

### 7.5 Chain Integrity

For every behavior-level AC, trace:

~~~text
Requirement / AC
  → Entry Point
  → Boundary / Interface
  → Core Logic
  → State / Persistence
  → Downstream Consumer
  → Observable Result
  → Verification Evidence
~~~

Typical broken chains include:

- producer implemented but consumer not connected;
- API layer present but core never calls it;
- migration written but readback missing;
- backend correct but UI not connected;
- isolated unit test passes while the real integration path is disconnected;
- package files exist but runtime loading is missing.

If evidence is incomplete, the correct result is UNVERIFIED, not a guessed PASS.

### 7.6 Handle findings

Expected review structure:

~~~text
Status: PASS | FAIL | UNVERIFIED
Spec Compliance: PASS | FAIL | UNVERIFIED
Chain Integrity: PASS | FAIL | UNVERIFIED
Test Evidence: PASS | FAIL | INCOMPLETE
Findings: Critical / Important / Minor
Chain Evidence:
  AC -> Entry -> Boundary -> Logic -> State -> Consumer -> Observable -> Evidence
Unverified:
Required Follow-up:
~~~

Rules:

- Critical / Important: resolve before handoff unless the risk is explicitly accepted;
- Minor: may be deferred with a recorded reason;
- UNVERIFIED: obtain the missing proof;
- after a fix, prefer a scoped re-review instead of another broad review.

## 8. Final whole-branch review

For a multi-task or cross-subsystem branch, perform one final review from the task or branch base to the candidate head.

Prioritize:

- cross-task integration;
- API/protocol/schema compatibility;
- migrations and persistent-state round trips;
- producer/consumer mismatches;
- startup/shutdown/retry paths;
- security/data boundaries;
- build/package/release wiring;
- behavior that passed only isolated unit tests.

## 9. Upgrade

Normal upgrade:

~~~powershell
dsh plugin --profile web update dsh-engineering-router
~~~

Then restart:

~~~powershell
dsh web
~~~

The installer:

1. identifies its managed preset/Skill files;
2. checks for local modifications;
3. backs up a managed target before replacement;
4. keeps the latest three preset/skill backup generations;
5. updates only its managed AGENTS block;
6. preserves unrelated AGENTS content.

If a managed directory was edited locally, the default behavior is to preserve it and warn.

Only an explicit force: true allows the installer to overwrite managed files. Treat that as an explicit overwrite decision, not a normal upgrade flag.

## 10. Advanced installer configuration

The default installer configuration is effectively:

~~~yaml
config: {}
~~~

You can override the installer row in the profile own cordis.patch.yml.

### Preset + Review only, without the global AGENTS block

~~~yaml
- insert:
    - id: dsh-engineering-router-installer
      name: dsh-engineering-router
      config:
        installGlobalRules: false
        installBootstrapSkill: false
        installReviewSkill: true
~~~

### Force a re-materialization

~~~yaml
- insert:
    - id: dsh-engineering-router-installer
      name: dsh-engineering-router
      config:
        force: true
~~~

DSH patches override a row by id, and the target row config is replaced as a whole rather than deep-merged. Keep the fields you intentionally want in the effective config.

Most users do not need these overrides.

## 11. Uninstall

Remove the Bundle from the Web profile:

~~~powershell
dsh plugin --profile web remove dsh-engineering-router
~~~

Then restart:

~~~powershell
dsh web
~~~

### Remove is not the same as cleanup

remove removes the profile dependency and bundle layer. It does not automatically delete the already materialized:

~~~text
$DSH_HOME/.agent-presets/engineering-router/
$DSH_HOME/skills/engineering-project-bootstrap/
$DSH_HOME/skills/engineering-review-gate/
managed block in $DSH_HOME/AGENTS.md
$DSH_HOME/backups/dsh-engineering-router/
~~~

This is deliberate: the current installer has no destructive uninstall hook.

### Do not delete the preset blindly

If historical Engineering Router sessions must still be resumed, keep:

~~~text
$DSH_HOME/.agent-presets/engineering-router/
~~~

DSH persists the preset id used by a session, and cold resume requires that preset to remain available.

Only clean the managed files after deciding that those historical sessions no longer need the preset.

## 12. Troubleshooting

### A. Engineering Router is not visible

Inspect the real composition:

~~~powershell
dsh --profile web --dump-config
~~~

Then check:

1. the plugin was installed into the profile you actually start;
2. the dsh-engineering-router-installer layer exists;
3. dsh web was fully restarted;
4. you created a new session.

### B. $.prefix missing required value

This was the real v0.2.0 mount blocker.

v0.2.1 fixes it by normalizing:

~~~text
legacy config.text
        ↓
config.prefix
~~~

If the error still appears, first suspect a stale old preset in the active DSH home/profile rather than changing the DSH runtime schema.

Update or reinstall the current bundle and inspect the materialized preset before making other changes.

### C. preserve locally modified

This is the installer protection mechanism, not an installation failure.

~~~text
Bundle changed
+
managed target was locally modified
=
do not overwrite by default
~~~

Keep the local change if intentional. If the Bundle version should win, explicitly use force: true.

### D. engineering_review is missing

The tool is exposed only in the verification phase.

Check:

1. the session is actually using Engineering Router;
2. the Router has reached verification;
3. the preset mounted successfully.

Do not expose the tool globally just because it is not visible in an earlier phase.

### E. Reviewer says PASS but the chain still looks disconnected

Check whether the review contains an actual Chain Evidence path:

~~~text
AC
→ Entry
→ Boundary
→ Logic
→ State
→ Consumer
→ Observable
→ Evidence
~~~

If it only says the code looks correct without real call/data/state evidence, obtain the smallest deterministic or real-run proof instead of repeating the same broad review.

### F. Graphify disagrees with source

Treat Graphify as navigation, not canonical truth:

~~~text
Graphify query/path/explain
        ↓
locate symbols
        ↓
read current source
        ↓
check contracts/tests
        ↓
use current source + evidence as authority
~~~

Do not trust a stale graph over current code, and do not rebuild the graph for ceremony on every small task.

## 13. Recommended shortest daily path

Once installed, the normal user flow is:

~~~text
1. New Engineering Router session
        ↓
2. State the outcome you want
        ↓
3. Router inspects, researches, and plans when needed
        ↓
4. Implement → Verify → Review when risk requires it
        ↓
4. focused tests / regression / build / real run
        ↓
5. verification phase
        ↓
6. engineering_review
        ↓
7. resolve Critical / Important / UNVERIFIED
        ↓
8. scoped re-review
        ↓
9. final whole-branch review for multi-task work
        ↓
10. project acceptance
        ↓
11. Git commit / push
~~~

Three habits matter most:

1. **Treat Engineering Router as an engineering control environment, not an auto-code button.**
2. **Treat the Reviewer as an independent read-only gate, not a second Implementer.**
3. **Treat Graphify, AI summaries, and Reviewer judgments as navigation/review inputs; current source, contracts, tests, and real-run evidence remain the authority.**

## 14. Related documentation

- [Design](DESIGN.md)
- [Compatibility baseline](COMPATIBILITY.md)
- [Community research](COMMUNITY_RESEARCH.md)
- [Runtime acceptance](RUNTIME_ACCEPTANCE.md)
- [简体中文使用说明](USAGE.zh-CN.md## 6. Daily task instructions

Use the shortest instruction that expresses the outcome:

| Intent | Example |
|---|---|
| Implement | `Implement the new cover lookup behavior.` |
| Fix | `Fix the cover lookup failure.` |
| Investigate | `Investigate why cover lookup fails on Android release builds.` |
| Research | `Research the current Android versionCode behavior. Do not modify code.` |
| Plan | `Plan the smallest safe implementation for this change. Do not modify code.` |
| Review | `Review the current changes for correctness and chain integrity.` |
| Continue | `Continue from the current task state.` |

You may add constraints when they matter:

~~~text
Implement <goal>. Preserve the existing public contract and unrelated dirty changes.
~~~

~~~text
Research <question>. Do not modify the repository; use current repository and authoritative external evidence.
~~~

~~~text
Implement <goal>. Verify the behavior before claiming completion.
~~~

Do not normally write prompts that enumerate `Research → Design → Implement → Verify → Review`. Those are Router policy, not user ceremony. Explicit phase instructions remain useful when you intentionally want to constrain the session, but they should be the exception.

For unknown technical problems, the Router should automatically research the repository and authoritative external sources before choosing an implementation. For architecture, protocol, schema, persistence, or security changes, it should enter the project's design/ADR path when required.

The final report must still distinguish `Implemented / Verified / Committed / Pushed / Accepted` and must stop when required evidence is missing.

