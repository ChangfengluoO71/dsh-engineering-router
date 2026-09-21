# Quickstart

## The shortest way to use Engineering Router

Create a new **Engineering Router** session, then describe the outcome you want.

~~~text
Implement <goal>.
~~~

Other common intents:

| Intent | Say |
|---|---|
| Implement | Implement <goal>. |
| Fix | Fix <problem>. |
| Investigate | Investigate <question>. |
| Research | Research <topic>. Do not modify code. |
| Plan | Plan <goal>. Do not modify code. |
| Review | Review <scope>. |
| Continue | Continue the current task. |

You normally do **not** need to write:

~~~text
Research → Design → Implement → Verify → Review
~~~

That is Engineering Router's internal policy. The Router inspects the project and chooses the necessary workflow.

## Add constraints only when they matter

~~~text
Implement <goal>. Preserve the existing public contract and unrelated dirty changes.
~~~

~~~text
Research <question>. Do not modify the repository; verify against current repository and authoritative external evidence.
~~~

~~~text
Implement <goal>. Verify the behavior before claiming completion.
~~~

## What the Router handles for you

Depending on the task, it can automatically:

1. inspect the current repository and project workflow;
2. use Trellis / Graphify when they are actually useful;
3. research version-sensitive or uncertain behavior;
4. enter the project design/ADR path for architectural decisions;
5. implement the smallest coherent change;
6. run focused and risk-appropriate verification;
7. invoke the independent read-only Reviewer for meaningful behavior changes;
8. stop when required evidence is missing instead of manufacturing PASS.

## When to ask for a read-only reconnaissance

For a new or unfamiliar repository:

~~~text
Inspect the project first. Do not modify anything. Report the relevant sources of truth, task/AC entry points, verification entry points, and minimum sufficient context for this goal.
~~~

## Installation

~~~powershell
dsh plugin --profile web add github:ChangfengluoO71/dsh-engineering-router
dsh web
~~~

Then create a **new** session and select **Engineering Router**.

For compatibility baselines, pin the accepted commit documented in USAGE.md.

## More detail

- [Full usage guide](USAGE.md)
- [Design](DESIGN.md)
- [Compatibility](COMPATIBILITY.md)
- [Runtime acceptance](RUNTIME_ACCEPTANCE.md)