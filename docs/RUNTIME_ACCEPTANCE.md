# Runtime Acceptance History

## v0.2.0 — 2026-09-19

**Result: REAL_DSH_RUNTIME_FAIL**

Environment:
- DSH: `0.1.5-rc.2`
- DSH_HOME: explicit user environment path
- Profile: `web`

Verified before STOP:
- GitHub plugin install succeeded.
- Package version `0.2.0` installed.
- Preset, both skills, review-package helper, and managed AGENTS block materialized correctly.
- Installer was idempotent.
- Existing Router Standard remained usable and its files/settings were not overwritten.
- Broken-chain fixture and review package were prepared successfully.

STOP:

```text
agent-preset/invalid:
preset "engineering-router" failed to mount:
@deepseek-ai/dsh-persona config $.prefix missing required value
```

Root cause:
- the vendored raw Router Standard fallback used `config.text`;
- DSH persona schema requires `config.prefix`;
- the upstream raw file describes itself as a pre-assembly fallback, but this project shipped it as a standalone runtime preset.

Remediation in v0.2.1:
1. shipped preset uses `config.prefix`;
2. upstream sync normalizes only the known legacy `text` shape;
3. unknown persona config shapes fail loud;
4. CI checks the packaged persona contract.

## v0.2.1 — 2026-09-19

**Result: REAL_DSH_RUNTIME_PASS**

Environment:
- DSH: `0.1.5-rc.2`
- Package: `0.2.1`
- GitHub `main`: `5c52b4720c71e9f53bbd7fa3c0695f38fb0ac6ad`

Verified:
- Materialized persona uses `config.prefix`; legacy `config.text` is absent.
- Engineering Router preset mount and session creation succeeded.
- Router phase progression succeeded.
- `engineering_review` was unavailable before verification and available in the verification phase.
- Reviewer runtime descriptor used `provider=spawn`, foreground one-shot, `maxDepth=1`.
- Reviewer runtime tool surface was restricted to `phase_begin`, `read`, `glob`, `grep`.
- Broken-chain negative control was correctly rejected by the Reviewer.
- Fixed-chain positive control was correctly accepted by the Reviewer.
- Router Standard remained usable and namespace/state isolation held.
- No unrelated settings, Router Standard state, or AGENTS content was overwritten.

Key Chain Integrity discrimination:

```text
BROKEN → FAIL
FIXED  → PASS
```

Therefore the reviewer was not fooled by the focused unit test in the broken fixture; it followed the real persistence/observation chain.

**REAL_DSH_RUNTIME_GATE: PASS**

### Explicitly unverified

The following were not misrepresented as verified:
- package-level `0.2.0 → 0.2.1` in-place upgrade path, because the old v0.2.0 package was no longer present when this run began;
- final whole-branch review runtime;
- full `engineering-project-bootstrap` Trellis/Graphify bootstrap path;
- Desktop long-lived Host GUI preset selection after restart.

These are follow-up coverage items, not failures of the v0.2.1 runtime gate.

## Cleanup / Git state

The real-run agent made no source modifications and performed no commit, push, or merge.

It removed task-owned disposable fixtures, drivers, and temporary Host artifacts while preserving evidence and existing user/DSH-managed state.
