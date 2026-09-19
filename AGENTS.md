# Repository Agent Rules

This repository packages a DSH Host installer plus a pinned derivative of `dsh-routing-suite/router-standard`.

- Inspect `upstream.lock.json`, `docs/DESIGN.md`, relevant source/tests, and Git state before editing.
- Keep the Router fork minimal. Runtime behavior should track the pinned upstream snapshot; personal engineering policy belongs in `assets/AGENTS.block.md` or skills, not in Router experiment text.
- Do not hand-sync vendored Router files. Use `node scripts/sync-upstream.mjs <exact-ref>`, review the diff, then re-apply only documented local patches.
- Preserve namespace isolation: no persistent/global Router state may fall back to the original `router-standard` namespace.
- For DSH/Trellis/Graphify compatibility facts, inspect current official/upstream source and record exact commits; do not rely on old README claims or model memory.
- For review-gate changes, also inspect the pinned DSH subagent/toolFilter contract and `engineering-review-gate` tests. Preserve the fresh-spawn, read-only, no-recursion reviewer boundary and Chain Integrity semantics.
- Run `npm run check` and `npm test` before reporting a change verified. A DSH runtime compatibility claim additionally needs an isolated real DSH boot/session check.
- Do not add memory, compaction, lifecycle, or routing plugins as hard dependencies without documenting ownership overlap and measured benefit.
- Preserve unrelated work. Do not use destructive Git cleanup. Remove only task-owned temporary artifacts before handoff.
- Keep `Implemented`, `Verified`, `Merged`, `Published`, and runtime-`Accepted` states distinct.
