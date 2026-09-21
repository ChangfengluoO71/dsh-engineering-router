/**
 * Pure patch helpers for `sync-upstream.mjs`.
 *
 * These live in their own module — the same pattern as `compat-patches.mjs` —
 * so the sync contract can be tested deterministically and offline against
 * synthetic upstream input, instead of only being grepped as source text.
 * `sync-upstream.mjs` performs the network fetch; everything here is pure.
 */
import { normalizePersonaConfig } from './compat-patches.mjs'

/** Replace a required anchor, failing loud when upstream shape moved. */
export function replaceRequired(c, before, after, label) {
  if (!c.includes(before)) throw new Error('upstream shape changed; cannot apply local patch: ' + label)
  return c.replace(before, after)
}

export const REVIEW_TOOL_YAML = [
  '    # Fresh, read-only reviewer: no implementer history, mutation, or delegation.',
  '    - id: tool-subagent-engineering-review',
  "      name: '@deepseek-ai/dsh-tool-subagent'",
  '      config:',
  '        provider: spawn',
  '        toolName: engineering_review',
  '        enableRunInBackground: false',
  '        backgroundMode: one-shot',
  '        maxDepth: 1',
  '        toolFilter:',
  '          allow:',
  '            - phase_begin',
  '            - read',
  '            - glob',
  '            - grep',
  '        persona: |',
  '          You are an independent senior engineering reviewer operating in a fresh context.',
  "          Treat the implementer's report, rationale, and test claims as unverified until supported by repository evidence.",
  '          Start from the supplied review package and requirements. Review spec compliance, code quality, and chain integrity.',
  '          For every behavior-level acceptance criterion, trace the implemented path as far as applicable:',
  '          Requirement/AC -> Entry Point -> Boundary/Interface -> Core Logic -> State/Persistence -> Downstream Consumer -> Observable Result -> Verification Evidence.',
  '          Call phase_begin once if the inherited Router bootstrap requires it; after that use only read, glob, and grep. You are strictly workspace-read-only: do not edit files, run shell commands, dispatch subagents, or manufacture evidence.',
  '          Do not broaden into a repository-wide crawl unless a concrete cross-cutting risk requires one focused check; state the risk and what you inspected.',
  '          Missing evidence is UNVERIFIED, never PASS. A passing unit test does not prove an end-to-end chain unless it exercises the relevant boundary.',
  '          Findings must cite file:line when possible and separate Critical, Important, and Minor severity.',
  '          Return exactly these sections: Status, Spec Compliance, Chain Integrity, Test Evidence, Findings, Chain Evidence, Unverified, Required Follow-up.',
  '          Status is PASS only when no Critical/Important issue remains and every required chain is evidenced; otherwise use FAIL or UNVERIFIED.',
  '',
].join('\n')

/**
 * The module the preset actually mounts
 * (`agent.cordis.yml` -> `./router-bootstrap-v34.mjs?v=N`).
 */
export const MOUNTED_BOOTSTRAP = 'router-bootstrap-v34.mjs'

/**
 * Local, project-owned intent policy lives in its own non-vendored module, so an
 * upstream sync can never overwrite it. These constants re-apply the bootstrap
 * integration that consumes it.
 */
export const INTENT_POLICY_IMPORT =
  '// Local, project-owned intent policy (P1/P2 classification + P3-A completion\n'
  + '// contract). Kept OUT of the vendored core so an upstream sync cannot drop it.\n'
  + "import { classifyIntent, intentGuidance, completionContract } from './intent-policy.mjs'"

export const ROUTER_INTENT_SECTION = [
  '    const taskIntent = classifyIntent(firstUserTask(session))',
  '    // P3-A: the completion contract rides INSIDE the existing intent section.',
  '    // It is a completion condition, not a workflow step, and it is empty for',
  '    // intents that carry none — those turns pay zero extra prompt, and no new',
  '    // section is introduced, so section ordering and the phase gate are',
  '    // untouched.',
  '    const contract = completionContract(taskIntent)',
  "    sections.push({ name: 'router-intent', order: 1.5, text: contract ? intentGuidance(taskIntent) + ' ' + contract : intentGuidance(taskIntent) })",
].join('\n')

const STAGE_ANCHOR =
  "    sections.push({ name: 'router-stage', order: 1, text: stageText(stage, muteAwareList(runtimeCallable(toolsSvc, agent), memoryMuted(session)), memoryMuted(session), firstUserTask(session)) })"

/**
 * Apply the local modifications to one vendored bootstrap file.
 * @param c - upstream file content.
 * @param file - the file's base name (drives which patches apply).
 * @returns patched content.
 */
export function patchBootstrap(c, file) {
  let out = c
    .replaceAll('process.env.DSH_HOME || homedir()', 'dshHomeForState()')
    .replaceAll("join(dshHomeForState(), 'router-standard',", "join(dshHomeForState(), 'engineering-router',")
    // The comma-less form is a separate call site (the mkdirSync marker in
    // apply()); without this the sync left the bootstrap creating the
    // router-standard namespace it is supposed to stay out of.
    .replaceAll("join(dshHomeForState(), 'router-standard')", "join(dshHomeForState(), 'engineering-router')")
    .replaceAll("Symbol.for('router-standard.restrictLift')", "Symbol.for('engineering-router.restrictLift')")
    .replaceAll("Symbol.for('router-standard.overrides')", "Symbol.for('engineering-router.overrides')")

  // The selftest is a source checker, not a bootstrap module: it has no STAGES
  // table, so the structural patches below must be skipped for it. Applying them
  // aborted the entire sync with "upstream shape changed; cannot apply local
  // patch: verification stage reviewer tool".
  if (file.endsWith('.selftest.mjs')) return out

  if (!out.includes("'engineering_review'")) {
    out = replaceRequired(
      out,
      "{ name: '验证', tools: ['pwsh', 'bash', 'read_image', 'job_list', 'job_output', 'job_kill'] },",
      "{ name: '验证', tools: ['pwsh', 'bash', 'read_image', 'job_list', 'job_output', 'job_kill', 'engineering_review'] },",
      'verification stage reviewer tool',
    )
  }

  // Only the mounted module consumes the local intent policy.
  if (file === MOUNTED_BOOTSTRAP) {
    if (!out.includes("from './intent-policy.mjs'")) {
      out = replaceRequired(
        out,
        "} from './router-core-v34.mjs'",
        "} from './router-core-v34.mjs'\n" + INTENT_POLICY_IMPORT,
        'intent policy import',
      )
    }
    if (!out.includes("name: 'router-intent'")) {
      out = replaceRequired(out, STAGE_ANCHOR, STAGE_ANCHOR + '\n' + ROUTER_INTENT_SECTION, 'router-intent section')
    }
  }
  return out
}

/** Apply the local modifications to the vendored `agent.cordis.yml`. */
export function patchAgentCordis(c) {
  let out = normalizePersonaConfig(c).replace(
    '# The `router-standard` agent preset:',
    '# The `engineering-router` agent preset (derived from router-standard):',
  )
  if (out.includes('toolName: engineering_review')) return out

  const anchor = [
    '    - id: tool-subagent-fork',
    "      name: '@deepseek-ai/dsh-tool-subagent'",
    '      config:',
    '        provider: fork',
    '        toolName: subagent_fork',
    '        backgroundMode: continuable',
    '',
  ].join('\n')
  return replaceRequired(out, anchor, anchor + REVIEW_TOOL_YAML, 'reviewer subagent row')
}
