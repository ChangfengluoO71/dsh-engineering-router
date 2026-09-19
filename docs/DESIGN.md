# Design

## Goal

Provide one installable DSH bundle that materializes a personal engineering preset while keeping DSH runtime composition, project workflow, and code knowledge as separate layers.

```text
DeepSeek Harness host
        │
        ├─ Engineering Router preset
        │    └─ pinned router-standard derivative
        │
        ├─ $DSH_HOME/AGENTS.md
        │    └─ cross-project engineering rules
        │
        └─ DSH skill filesystem
             ├─ engineering-project-bootstrap
             │      ├─ Trellis project workflow
             │      └─ Graphify code knowledge
             └─ engineering-review-gate
                    └─ fresh read-only reviewer + Chain Integrity
```

## Why a complete preset is vendored

Current DSH preset authoring is copy-oriented: an agent preset is a complete directory with `agent.cordis.yml` plus local assets/modules. There is no stable "inherit preset + tiny overlay" contract relied on here, so runtime installation materializes a complete preset.

To keep that maintainable, the repository records an exact upstream commit and provides `scripts/sync-upstream.mjs` rather than hand-merging arbitrary upstream changes.

## Why policy is not injected into Router internals

Router Standard changes behavior through staged tool disclosure, routing/persona selection, prompt placement, plan-mode handling, and delivery gating. Those mechanisms are coupled to upstream experiments. Personal engineering conventions therefore stay in the DSH-supported instruction/skill layers instead of rewriting routing text.

## Required fork: namespace isolation

A literal copy of Router Standard would share process/disk keys with the original preset:

- `$DSH_HOME/router-standard/stages.json`
- `Symbol.for('router-standard.restrictLift')`
- `Symbol.for('router-standard.overrides')`
- diagnostic marker paths under `router-standard/`

The vendored bootstrap files change only those state namespaces to `engineering-router`, allowing both presets to coexist.

## Independent review architecture

The review mechanism intentionally separates three responsibilities:

```text
Implementer
   │
   ├─ focused deterministic evidence
   │
   └─ review package
          │
          ▼
fresh DSH spawn reviewer
(phase_begin bootstrap + read / glob / grep)
          │
          ├─ spec compliance
          ├─ code quality
          └─ Chain Integrity
          │
          ▼
Controller / project quality gate
tests + contracts + integration / real run
```

The reviewer uses `provider: spawn` rather than `fork`, so implementation reasoning and assumptions are not copied into the child conversation. It runs foreground/one-shot because the parent needs the verdict before handoff.

The tool filter is an allow-list of `phase_begin`, `read`, `glob`, and `grep`. The control tool is necessary because an in-process spawn joins the parent's Engineering Router preset before the child-specific filter is applied; a fresh child therefore has its own Router bootstrap state and must enter phase 0 before the read/search tools become usable. `phase_begin` changes only the child's Router phase state and does not grant workspace mutation. DSH removes all other filtered tools from the child prompt and rejects their execution. `maxDepth: 1` is deliberate: DSH counts the first child as depth 1, so `0` would prevent the reviewer from starting at all. The child has no delegation, shell, or mutation tool in its allowed surface.

The reviewer does not re-run broad suites by default. It reads existing evidence, identifies gaps, and asks the controller for the smallest focused missing proof. High-risk or multi-task changes still require the project's deterministic/real-run gate after review.

Chain Integrity targets a recurring failure class that normal diff review often misses: components are locally correct but the producer/consumer, bridge/API, persistence/readback, protocol endpoints, packaging/runtime, or UI/backend path is not actually connected.

Review packages are generated outside tracked worktree content under Git metadata so routine review does not create project noise. The package includes commit bodies because design deviations and compatibility rationale often live there, but the reviewer still treats those statements as claims until source/evidence supports them.

## Installer safety

The Host bundle is an installer, not the agent runtime.

It:
1. validates packaged preset/skill files;
2. tracks only package-managed files with a marker and SHA-256 fingerprint;
3. refuses to overwrite an unmanaged target;
4. refuses to overwrite locally modified managed files unless `force:true`;
5. stages updates and backs up the prior target before replacement;
6. preserves unrelated `AGENTS.md` text by replacing only a marker-delimited block.

No Git operation, project mutation, Trellis initialization, or Graphify build happens merely because DSH starts.

## Optional integrations

- **Trellis:** project control plane for specs/tasks/research/AC/workspace memory.
- **Graphify:** derived relationship/navigation layer; never canonical truth.
- **dsh-trellis:** useful optional Host companion for DSH/Trellis breadcrumbs and event-driven background-subagent settlement. Not required for baseline Trellis-on-DSH.
- Extra memory/compaction/hot-runtime plugins remain opt-in to avoid multiple competing owners of context and lifecycle.
