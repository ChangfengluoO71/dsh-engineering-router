# Chain Integrity Review

The common failure this check targets is local correctness with a broken integration path.

For every behavior-level acceptance criterion, build a Chain Evidence row:

| AC | Entry | Boundary / Interface | Core Logic | State / Persistence | Consumer | Observable Result | Evidence |
|---|---|---|---|---|---|---|---|

## What counts as evidence

Good evidence includes:
- direct call/data-flow confirmed in current source;
- typed/interface contract plus both producer and consumer implementations;
- migration/write/read round-trip;
- integration/contract test crossing the relevant boundary;
- real run showing the observable result.

Weak evidence that does not close the chain by itself:
- same function/type names on both sides;
- compile success;
- isolated unit tests on only one side of a boundary;
- mocked integration that bypasses the changed seam;
- implementer prose saying the path is wired;
- Graphify/AI summary without source confirmation.

## High-value breakpoints to inspect

- UI/controller -> bridge/API;
- API/handler -> domain/core;
- producer -> queue/job/orchestrator -> worker;
- write path -> persistence -> read path;
- protocol/schema version -> both endpoints;
- provider adapter -> normalization -> consumer;
- configuration -> runtime registration/discovery;
- package/build artifact -> installer -> runtime load;
- retry/error state -> subsequent eligibility/cleanup;
- cache key/write -> lookup/readback.

If any required link cannot be proven, use Chain Integrity: UNVERIFIED and name the smallest focused integration/real-run evidence needed.
