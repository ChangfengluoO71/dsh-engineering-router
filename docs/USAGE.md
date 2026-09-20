# Usage Guide

This page is the practical guide for dsh-engineering-router 0.2.1: installation, verification, project onboarding, review-gate operation, upgrade, and removal.

> Runtime Acceptance baseline: DSH 0.1.5-rc.2, Bundle 0.2.1. This baseline passed real DSH Runtime Acceptance. DSH is still evolving quickly, so future versions should be checked against the compatibility baseline.

## 1. What you get

Engineering Router is a DSH engineering environment rather than a standalone chat tool.

| Layer | Purpose | When you notice it |
|---|---|---|
| Engineering Router preset | Routing, staged tool exposure, plan/delivery behavior | Every new Engineering Router session |
| Global AGENTS rules | Research → Design → Implement → Verify, Git safety, evidence discipline | Applicable engineering tasks |
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

Do not start by immediately editing a file.

Recommended first prompt:

~~~text
Do not modify the repository yet.
Inspect AGENTS.md, existing Trellis state, Git status/worktree,
relevant architecture/ADR documents, test entry points, and project knowledge.
Also check trellis --help and graphify --help.
Report the current Sources of Truth, task entry points,
verification entry points, and the minimum sufficient context for this task.
~~~

This avoids:

- creating a second task system;
- treating Graphify as canonical truth;
- overwriting unrelated dirty changes;
- changing code before locating the real verification entry point;
- asking the user to repeat information that can be safely discovered.

### Existing Trellis

If .trellis/ already exists, use the existing project workflow rather than creating another state system.

### New Trellis setup

Check the actual CLI first:

~~~powershell
trellis --help
~~~

The current research baseline supports:

~~~powershell
trellis init --dsh -u <user>
~~~

Treat that as a versioned command shape, not a permanent contract. Use the installed CLI help output if it differs.

### Graphify

Check:

~~~powershell
graphify --help
~~~

The current research baseline supports:

~~~powershell
graphify install --project --platform agents
~~~

Use Graphify as a derived navigation and relationship layer:

~~~text
Graphify = navigation
Source + contracts + tests = Source of Truth
~~~

Use it for large repositories, cross-module work, and relationship tracing. Do not rebuild a healthy graph for every small task. By default, do not commit graphify-out/ unless the project explicitly decides to version derived graph artifacts.

## 6. Recommended task workflow

Use this order:

~~~text
Understand
  → Research
  → Locate
  → Design / Plan
  → Implement
  → Verify
  → Review
  → Cleanup
  → Handoff
~~~

### Normal behavior change

~~~text
Read the current Trellis task/AC and relevant source first.
If the repository already contains the information needed to locate the problem,
do not ask the user to repeat it.
Research only the uncertainties that can change the implementation.
Make the smallest complete change.
Run focused tests and relevant regression checks.
Inspect git diff/status and report the evidence.
~~~

### Unknown technical problem

~~~text
Do not modify code yet.
Research the existing implementation, official documentation/specification,
upstream behavior, and mature OSS alternatives.
Compare compatibility, complexity, maintenance cost, security/performance impact,
and reversibility.
Only then propose the implementation.
~~~

### Known target file

Even when the edit location is obvious, keep verification explicit:

~~~text
Implement the current AC with the smallest complete change.
Do not change frozen architecture or public contracts unless evidence requires it.
After implementation, run focused tests and relevant regression checks,
then inspect git diff/status and distinguish:
Implemented / Verified / Committed / Pushed / Accepted.
~~~

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

Once installed, the normal loop is:

~~~text
1. New Engineering Router session
        ↓
2. Inspect AGENTS / Trellis / Git / architecture
        ↓
3. Research → Design → Implement
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
- [简体中文使用说明](USAGE.zh-CN.md)