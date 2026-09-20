# 变更日志

## 0.2.1 — 2026-09-19

- 修复真实 DSH mount blocker：`@deepseek-ai/dsh-persona` 要求 `config.prefix`；v0.2.0 发布的上游 fallback 使用了 legacy `config.text`。
- 增加 fail-loud compatibility normalizer，使未来 `sync-upstream.mjs` 只转换已知的 legacy persona 形态，并在上游 Schema 未知变化时直接停止。
- 增加 `check-preset-contract.mjs` 以及针对已发布 `prefix`、legacy `text -> prefix` 规范化、幂等性和未知形态拒绝的回归测试。
- 记录 v0.2.0 的真实运行失败作为兼容性回归基线。
- v0.2.1 已通过真实 DSH Runtime Acceptance：Preset mount、Router phase、独立 Reviewer、Chain Integrity discrimination 和 Router Standard 共存均已验证。

## 0.2.0 — 2026-09-19

- 增加基于 DSH spawn 的独立 fresh-context Engineering Review tool。
- Reviewer 为工作区只读（Router `phase_begin` bootstrap + read/glob/grep）、one-shot、foreground，并限制 depth 1，使第一层 Child 可以启动但不能递归 delegation。
- 增加 engineering-review-gate Skill，包含 task、final、re-review 和 Chain Integrity 指南。
- 增加确定性的 review-package builder，捕获 commit body、工作树 diff、status、untracked 文件和 evidence 引用。
- 增加 review configuration/package regression tests，并在 upstream Router sync 中保留本地 review patch。
- 增加 Superpowers、dsh-doublecheck、Agentic Delivery OS 和 staff-engineer-mode 的社区调研基线。

## 0.1.0 — 2026-09-19

- 首个可安装 Engineering Router Bundle。
- Vendored Router Standard 基线：`yjh051108/dsh-routing-suite@195273352f23bff7f9023ebe2ec0cdbdf9c98f10`。
- 将持久化/全局 Router state 隔离到 `engineering-router` namespace。
- 增加安全的 preset/skill 物化、backup 和 local-edit protection。
- 增加受管全局工程规则和 project bootstrap Skill。
- 增加 Trellis/Graphify 集成指南、社区调研笔记、package-payload validation，以及 Windows/Linux CI。
