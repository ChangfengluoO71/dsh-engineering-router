# dsh-engineering-router

Personal DeepSeek Harness engineering preset for `ChangfengluoO71`.

This repository packages a maintained derivative of **dsh-routing-suite / router-standard** as an installable DSH bundle. Installing the bundle materializes an **Engineering Router** preset under `$DSH_HOME/.agent-presets/engineering-router`, merges a small managed engineering-rules block into `$DSH_HOME/AGENTS.md`, and installs an optional project-bootstrap skill for Trellis + Graphify.

> The preset runtime is intentionally close to upstream router-standard. Personal engineering policy lives in AGENTS/skills instead of rewriting the experimentally tuned router prompt.

## One-command install

```powershell
dsh plugin --profile web add github:ChangfengluoO71/dsh-engineering-router
```

Restart the `web` profile once, then create a new session and select **Engineering Router**.

The implementation and compatibility notes are committed in this repository; see `docs/` after the initial repository bootstrap commit lands.
