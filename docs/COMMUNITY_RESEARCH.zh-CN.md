# 社区调研

调研日期：**2026-09-19**。

本项目有意借用 DSH 生态中的**机制**，但不会把每个有价值的插件都变成硬依赖。

| 项目 | 检查基线 | 我们采用的内容 | 为什么不自动打包 |
|---|---|---|---|
| `yjh051108/dsh-routing-suite` | `195273352f23bff7f9023ebe2ec0cdbdf9c98f10` | Router Standard 运行时、渐进式工具披露、routing 与 delivery-gate 设计 | 这是主要运行时基线，以 pinned preset snapshot 形式 vendored |
| `liceses/dsh-gitbash-preset` | `a0e5165edd6b6d7a3fa296aba7fa97e5b734fef3` | 将完整用户 preset 物化到 `$DSH_HOME/.agent-presets` 的 Host Bundle 方案 | Git Bash 执行思路已经存在于上游 Router Standard，不需要第二套 installer |
| `mindfold-ai/Trellis` | `e77ae89f648a78d5859fa2e8ac314655898421a5` | 项目 spec/task/research/AC/workspace memory，以及 DSH 平台支持 | 项目范围的工作流应保持项目范围；本 Bundle 只安装 bootstrap Skill |
| `Graphify-Labs/graphify` | `b9cd9570728a5ff3485d2a1e36fe9a1272a368ae` | query-first 代码知识和通用 Agent Skills 集成 | Graph 是派生的、本地的项目状态，应在确有价值时才构建 |
| `SajoLuo/dsh-trellis` | `c73a7da0763656eca3129701c43dacb277f592b0` | 事件驱动的后台 subagent settlement 与 Trellis workflow breadcrumbs | 有价值的可选 Host companion，但它拥有 lifecycle/context seam，应在 baseline stack 稳定后再启用 |
| `AndyZHENG0715/dsh-recovery` | `85c6bebd82c21e5586d6fb1bb6d31f9eaa731c3d` | snapshot/rollback/safe-mode 思路 | Recovery 是独立的运维问题；本项目只采用 conservative backup-before-replace |
| `KYinCode/dsh-hot-installer` | `b9bd81cadfaf6f71a135718f5090c3e644ce6020` | runtime lifecycle 经验和诚实的 hot-reload 边界 | 正常安装不需要它；DSH 官方 Bundle 边界仍是生产 Source of Truth |
| `xiaobright/dsh-anchored-standard` | `dda23ef119e3715f417d73f72eca407732846d1a` | 首轮工具面收窄 / trajectory anchoring 的历史证据 | 项目已冻结且绑定特定模型；作为研究资料，不作为当前运行时基线 |
| `obra/superpowers` | `5bf4e78011075bcfc0dc295f0724994cd123ee71` | fresh-context reviewer、task-scoped review、final whole-branch review、compact review package、scoped re-review | 只采用审查机制，不引入其完整开发工作流 |
| `PerryLink/dsh-doublecheck` | `ebd1d447048adf5b7ece151b2d295ba938acef1b` | adversarial delivery review，以及显式 proof/verify 分离 | Trellis 已经负责 requirements/task state，因此不再引入第二套完整 workflow state machine |
| `juliusz-cwiakalski/agentic-delivery-os` | `cb20b58fcd3d882e49d06b1156b0bebaf1bc9e12` | 独立 readiness/review gate、持久化 findings 和 remediation loop | 完整 delivery OS 范围太大；这里只保留 gate 思路 |
| `sirmarkz/staff-engineer-mode` | `b98c6ec032cef287e371d3bafcfc2bf22fae5835` | adversarial split-access 原则：happy-path author 不应同时编写最终 adversarial proof | 通过 fresh read-only DSH reviewer 落地这一原则 |

## 最终形成的 Stack

```text
DSH Host
  └─ Engineering Router preset
       ├─ upstream-derived routing/tool-disclosure runtime
       ├─ DSH Agent Instructions → global/project AGENTS
       ├─ DSH Skill Filesystem
       │    ├─ Trellis project skills
       │    ├─ Graphify generic Agent Skill
       │    └─ Engineering Review Gate
       └─ fresh read-only engineering_review subagent
```

核心规则是：**一个 Concern 一个 Owner**：

- Router 负责 reasoning/tool presentation。
- AGENTS 负责稳定的个人工程策略。
- Trellis 负责项目 task/spec/workflow state。
- Graphify 负责派生的代码关系导航。
- Tests/contracts/current source 仍然是最终 implementation evidence。
- Independent reviewer 负责 adversarial inspection，**但不拥有 acceptance authority**；deterministic/real-run evidence 才负责关闭门禁。

额外的 memory、compaction、capability-menu、recovery 或 hot-runtime 插件，只有在解决了可测量的问题、且不会产生第二个竞争性的 state owner 时才 opt-in。
