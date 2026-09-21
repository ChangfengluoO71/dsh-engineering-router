/**
 * Local, project-owned intent policy for the Engineering Router.
 *
 * This file is deliberately NOT vendored from dsh-routing-suite: it is not in
 * the `files` list processed by `scripts/sync-upstream.mjs`, so an upstream
 * sync can never overwrite it. Keeping the local additions here is what makes
 * `router-core-v34.mjs` byte-identical to upstream again, so the sync no longer
 * needs to patch the vendored core at all.
 *
 * Contents (moved verbatim out of router-core-v34.mjs):
 *   - P1/P2  classifyIntent / intentGuidance
 *   - P3-A   completionContract
 *
 * Behaviour is intentionally identical to the previous in-core implementation:
 * same return values, same intent ordering, same unknown -> "general" fallback.
 */

/**
 * User-intent classification is a lightweight presentation hint, not a workflow
 * gate. The Router still owns phase transitions and decides when research,
 * planning, verification, or review are required.
 */
const INTENT_PATTERNS = Object.freeze([
  ['review', /(审查|审核|review|code review|检查当前改动)/i],
  ['research', /(研究|调研|查资料|查文档|research|survey|look into)/i],
  ['investigate', /(调查|排查|查一下为什么|分析原因|investigate|diagnose|why does)/i],
  ['plan', /(规划|制定方案|设计方案|先做方案|plan|planning)/i],
  ['fix', /(修复|修一下|修正|解决.*问题|fix|debug|repair|broken|bug)/i],
  ['implement', /(实现|开发|创建|新增|添加|构建|写一个|落地|implement|develop|create|build|add)/i],
  ['continue', /(继续|接着做|continue|resume|pick up)/i],
])

export function classifyIntent(text) {
  const value = typeof text === 'string' ? text.trim() : ''
  if (!value) return 'unknown'
  for (const [intent, pattern] of INTENT_PATTERNS) {
    if (pattern.test(value)) return intent
  }
  return 'unknown'
}

export function intentGuidance(intent) {
  const guidance = {
    implement: 'User intent: implement. Determine the necessary inspection, research, planning, implementation, and verification yourself; do not require the user to spell out the workflow.',
    fix: 'User intent: fix. Diagnose the current behavior first, then make the smallest complete fix and verify it.',
    investigate: 'User intent: investigate. Treat the task as diagnostic unless the user explicitly asks to modify the repository.',
    research: 'User intent: research. Establish current repository and authoritative external evidence before proposing or changing implementation.',
    plan: 'User intent: plan. Produce a decision-complete plan without modifying the repository unless the user explicitly asks to implement it.',
    review: 'User intent: review. Inspect the requested scope independently and report evidence-backed findings; do not repair it unless asked.',
    continue: 'User intent: continue. Resume from the current task state; do not repeat completed work.',
    unknown: 'User intent: general. Infer the desired outcome from the user request, then choose the minimum necessary workflow.',
  }
  return guidance[intent] || guidance.unknown
}

/**
 * P3-A Completion Contract: what "done" means for a given intent.
 *
 * These are COMPLETION CONDITIONS, not steps. They deliberately contain no
 * ordering, so injecting them can never turn the Router back into a fixed
 * research -> plan -> implement -> verify pipeline: the phase gate still owns
 * when those things happen, and most tasks need only some of them.
 *
 * Read-only intents state the bar for their own deliverable (an answer, a
 * plan, findings) and do NOT restate their read-only boundary, which
 * {@link intentGuidance} already carries — repeating it would be pure prompt
 * overhead. `unknown` maps to no contract at all: an unclassified request must
 * not be inflated, and the global AGENTS rules ("Verify before claiming",
 * "Implemented != Verified != ...") remain the backstop there.
 */
const COMPLETION_CONTRACTS = Object.freeze({
  implement: 'Done means: the requested result exists, the behavior it changes is verified with real evidence, and problems this change caused are resolved. An unverified implementation is not complete; a genuine external blocker is reported, not papered over.',
  fix: 'Done means: the reported problem is actually gone under real evidence, with no regression this fix introduced. An unverified fix is not a fix; a genuine external blocker is reported, not papered over.',
  investigate: 'Done means: the question is answered from the real system and the diagnosis is stated, even when it stops short of a change.',
  research: 'Done means: an evidence-backed answer to what was asked - inspection or authoritative sources, not recollection.',
  plan: 'Done means: a decision-complete plan another engineer could execute without making further design decisions.',
  review: 'Done means: findings reported with evidence, each marked PASS / FAIL / UNVERIFIED - missing evidence is UNVERIFIED, never PASS.',
  continue: 'Done means: the underlying task reaches the bar it would have if requested now - verified result, no unresolved problems this work caused, genuine blockers reported.',
})

/**
 * Completion condition for one intent, or `''` when this intent carries none.
 * Returning `''` is the minimal-prompt path: the caller appends nothing.
 * @param intent - an intent id from {@link classifyIntent}.
 * @returns the contract sentence, or an empty string.
 */
export function completionContract(intent) {
  return COMPLETION_CONTRACTS[intent] || ''
}
