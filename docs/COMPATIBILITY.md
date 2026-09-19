# Compatibility and research baseline

Research date: **2026-09-19**.

This repository is intentionally explicit about what was inspected versus what is guaranteed.

## Baselines inspected

- DeepSeek Harness: `deepseek-ai/deepseek-harness@ddefc45fbc7f8e46dd73185e68295696d1297887` (0.1.6-alpha.2 release line).
- dsh-routing-suite: `yjh051108/dsh-routing-suite@195273352f23bff7f9023ebe2ec0cdbdf9c98f10`.
- Trellis: `mindfold-ai/Trellis@e77ae89f648a78d5859fa2e8ac314655898421a5`, CLI 0.6.17.
- Graphify: `Graphify-Labs/graphify@b9cd9570728a5ff3485d2a1e36fe9a1272a368ae`, package 0.9.64.
- dsh-trellis: `SajoLuo/dsh-trellis@c73a7da0763656eca3129701c43dacb277f592b0` as an optional companion.
- dsh-gitbash-preset was inspected as the community reference for a Host bundle that materializes a user agent preset.

## DSH contracts relied upon

- Git/plugin install through `dsh plugin --profile <name> add <package-or-git-spec>`.
- Packages may declare `dsh.bundle.patch`.
- User agent presets live under `$DSH_HOME/.agent-presets/<preset-id>/`.
- Preset composition is agent-plane; Host registries/sandbox/persistence/model route remain host-plane.
- `dsh-agent-instructions` reads applicable AGENTS/CLAUDE instructions.
- DSH skill discovery supports project/global Agent Skills roots, allowing Graphify/Trellis integration without embedding their code in this preset.

DSH remains a fast-moving prerelease project. These are research baselines, not a promise that every future 0.1.x build is compatible.

## Upgrade gate

Before publishing an upstream refresh:

1. sync to an **exact commit**;
2. inspect upstream preset/module changes;
3. verify namespace patch still hits every stateful `router-standard` key;
4. run `npm run check` and `npm test`;
5. verify `agent.cordis.yml` local relative imports exist;
6. install into an isolated `DSH_HOME`;
7. boot Web and create a fresh Engineering Router session;
8. verify first-turn routing, phase progression, plan mode, shell behavior, compaction, skill discovery, and delivery gate;
9. verify original Router Standard can coexist without shared stage/override state;
10. only then update the normal profile.

Do not use stars, README claims, or a broad peer-dependency range as a substitute for this gate.
