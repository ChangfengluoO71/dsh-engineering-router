# Community research

Research date: **2026-09-19**.

This project intentionally borrows *mechanisms* from the DSH ecosystem without turning every useful plugin into a hard dependency.

| Project | Baseline inspected | What we adopt | Why it is not automatically bundled |
|---|---|---|---|
| `yjh051108/dsh-routing-suite` | `195273352f23bff7f9023ebe2ec0cdbdf9c98f10` | Router Standard runtime, progressive tool disclosure, routing and delivery-gate design | This is the primary runtime baseline and is vendored as a pinned preset snapshot |
| `liceses/dsh-gitbash-preset` | `a0e5165edd6b6d7a3fa296aba7fa97e5b734fef3` | Host bundle that materializes a complete user preset under `$DSH_HOME/.agent-presets` | Its Git Bash execution idea is already present in upstream Router Standard; no second installer is required |
| `mindfold-ai/Trellis` | `e77ae89f648a78d5859fa2e8ac314655898421a5` | Project specs/tasks/research/AC/workspace memory and DSH platform support | Project-scoped workflow should stay project-scoped; this bundle only installs a bootstrap skill |
| `Graphify-Labs/graphify` | `b9cd9570728a5ff3485d2a1e36fe9a1272a368ae` | Query-first code knowledge and generic Agent Skills integration | Graphs are derived/local project state and should be built only when useful |
| `SajoLuo/dsh-trellis` | `c73a7da0763656eca3129701c43dacb277f592b0` | Event-driven background-subagent settlement and Trellis workflow breadcrumbs | Valuable optional Host companion, but it owns lifecycle/context seams and should be enabled after the baseline stack is stable |
| `AndyZHENG0715/dsh-recovery` | `85c6bebd82c21e5586d6fb1bb6d31f9eaa731c3d` | Snapshot/rollback/safe-mode thinking | Recovery is a separate operational concern; this project only adopts conservative backup-before-replace behavior |
| `KYinCode/dsh-hot-installer` | `b9bd81cadfaf6f71a135718f5090c3e644ce6020` | Runtime lifecycle lessons and honest hot-reload boundaries | Not needed for normal installation; DSH's official bundle boundary remains the production source of truth |
| `xiaobright/dsh-anchored-standard` | `dda23ef119e3715f417d73f72eca407732846d1a` | Historical evidence for narrow first-turn tool surfaces / trajectory anchoring | Project is frozen and model-specific; treat it as research, not the current runtime baseline |
| `obra/superpowers` | `5bf4e78011075bcfc0dc295f0724994cd123ee71` | Fresh-context reviewer, task-scoped review, final whole-branch review, compact review package, scoped re-review | We adopt the review mechanics without importing its whole development workflow |
| `PerryLink/dsh-doublecheck` | `ebd1d447048adf5b7ece151b2d295ba938acef1b` | Adversarial delivery review and explicit proof/verify separation | Trellis already owns requirements/task state, so a second full workflow state machine would overlap |
| `juliusz-cwiakalski/agentic-delivery-os` | `cb20b58fcd3d882e49d06b1156b0bebaf1bc9e12` | Independent readiness/review gates, durable findings and remediation loop | Full delivery OS is broader than this preset; we keep the gate concept |
| `sirmarkz/staff-engineer-mode` | `b98c6ec032cef287e371d3bafcfc2bf22fae5835` | Adversarial split-access principle: happy-path author should not author final adversarial proof | We implement the principle through a fresh read-only DSH reviewer |

## Resulting stack

```text
DSH Host
  └─ Engineering Router preset
       ├─ upstream-derived routing/tool-disclosure runtime
       ├─ DSH Agent Instructions → global/project AGENTS
       ├─ DSH Skill Filesystem
       │    ├─ Trellis project skills
       │    ├─ Graphify generic Agent Skill
       │    └─ Engineering Review Gate
       └─ fresh read-only engineering_review subagent
```

The rule is **one owner per concern**:

- Router owns reasoning/tool presentation.
- AGENTS owns stable personal engineering policy.
- Trellis owns project task/spec/workflow state.
- Graphify owns derived code-relationship navigation.
- Tests/contracts/current source remain the final implementation evidence.
- Independent reviewer owns adversarial inspection, but **not** acceptance; deterministic/real-run evidence closes the gate.

Additional memory, compaction, capability-menu, recovery, or hot-runtime plugins are opt-in only when they solve a measured problem and do not create a second competing owner for the same state.
