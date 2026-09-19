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

## v0.2.1

**Runtime status: PENDING REAL RETEST**

Static/package regression gates may pass, but runtime acceptance requires:
- real preset mount/session creation;
- Router phase progression;
- real `engineering_review` spawn/tool isolation;
- broken-chain negative control;
- fixed-chain positive control.

Do not mark v0.2.1 runtime Accepted until those checks pass.
