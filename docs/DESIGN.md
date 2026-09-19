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
             └─ engineering-project-bootstrap
                    ├─ Trellis project workflow
                    └─ Graphify code knowledge
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
