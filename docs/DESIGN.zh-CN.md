# 设计说明

## 目标

提供一个可安装的 DSH Bundle，在保持 DSH 运行时组合、项目工作流和代码知识彼此分层的前提下，物化一套个人工程预设。

```text
DeepSeek Harness Host
        │
        ├─ Engineering Router preset
        │    └─ pinned router-standard derivative
        │
        ├─ $DSH_HOME/AGENTS.md
        │    └─ 跨项目工程规则
        │
        └─ DSH Skill filesystem
             ├─ engineering-project-bootstrap
             │      ├─ Trellis project workflow
             │      └─ Graphify code knowledge
             └─ engineering-review-gate
                    └─ fresh read-only reviewer + Chain Integrity
```

## 为什么 Vendored 一个完整预设

当前 DSH 的 preset 编写方式以复制为主：一个 Agent preset 是包含 `agent.cordis.yml` 以及本地 assets/modules 的完整目录。这里没有一个稳定、可依赖的“继承 preset + 小型 overlay”契约，因此运行时安装会物化一个完整预设。

为了保持可维护性，仓库记录精确的上游 commit，并提供 `scripts/sync-upstream.mjs`，而不是手工合并任意上游变更。

## 为什么不把个人策略注入 Router 内部

Router Standard 通过分阶段工具披露、routing/persona 选择、Prompt 放置、plan-mode 处理和 delivery gate 改变行为。这些机制与上游实验紧密耦合。

因此，个人工程约定放在 DSH 支持的 instruction / skill 层，而不是重写 Router 内部路由文本。

## 必需的分叉：命名空间隔离

直接复制 Router Standard 会与原始 preset 共享进程/磁盘状态 Key：

- `$DSH_HOME/router-standard/stages.json`
- `Symbol.for('router-standard.restrictLift')`
- `Symbol.for('router-standard.overrides')`
- `router-standard/` 下的 diagnostic marker 路径

Vendored Bootstrap 文件只修改这些状态命名空间为 `engineering-router`，从而允许两个 preset 共存。

## 独立审查架构

审查机制有意将三个职责分开：

```text
Implementer
   │
   ├─ focused deterministic evidence
   │
   └─ review package
          │
          ▼
fresh DSH spawn reviewer
(phase_begin bootstrap + read / glob / grep)
          │
          ├─ spec compliance
          ├─ code quality
          └─ Chain Integrity
          │
          ▼
Controller / project quality gate
tests + contracts + integration / real run
```

Reviewer 使用 `provider: spawn` 而不是 `fork`，因此实现者的推理过程和既有假设不会被复制到 Child 会话。它以前台 / one-shot 运行，因为 Parent 在继续交接之前需要拿到 Reviewer 结论。

工具过滤器采用 allow-list，只允许 `phase_begin`、`read`、`glob`、`grep`。之所以需要控制工具，是因为进程内 spawn 会先加入 Parent 的 preset，再应用 Child 专属 filter；新 Child 因此有自己的 Router Bootstrap 状态，必须先进入 phase 0，之后 read/search 工具才可用。`phase_begin` 只改变 Child 的 Router phase state，不授予工作区修改权限。DSH 会从 Child Prompt 中移除其他被过滤的工具，并拒绝执行这些工具。

`maxDepth: 1` 是有意设计的：DSH 将第一层 Child 计为 depth 1，因此 `0` 会直接阻止 Reviewer 创建。

Child 不拥有 delegation、shell 或 mutation 工具。

Reviewer 默认不会重新跑大规模测试套件。它读取已有证据、识别缺口，并要求 Controller 提供最小的聚焦缺失证明。高风险或多任务变更仍然必须在审查后通过项目自身的 deterministic / real-run gate。

Chain Integrity 针对一种普通 diff review 很容易漏掉的失败模式：各组件单独看都正确，但 producer/consumer、bridge/API、持久化/回读、协议端点、打包/运行时或 UI/backend 路径实际上没有连接起来。

Review Package 在 Git metadata 下生成，不污染受跟踪的工作树。Package 包含 commit body，因为设计偏差和兼容性理由经常记录在那里；但 Reviewer 仍把这些声明视为待验证的 claim，只有源码和 evidence 能证明它们。

## 安装器安全性

Host Bundle 是安装器，不是 Agent runtime。

它会：

1. 校验打包的 preset/skill 文件；
2. 通过 marker 和 SHA-256 fingerprint 只跟踪由 Bundle 管理的文件；
3. 拒绝覆盖未受管的目标；
4. 除非 `force:true`，否则拒绝覆盖被本地修改过的受管文件；
5. staged 更新，并在替换前备份旧目标；
6. 通过 marker 区块只替换 `AGENTS.md` 中由它管理的部分，保留无关文本。

DSH 启动本身不会触发 Git 操作、项目修改、Trellis 初始化或 Graphify 构图。

## 可选集成

- **Trellis：** 项目控制面，负责 spec/task/research/AC/workspace memory。
- **Graphify：** 派生的关系/导航层；绝不是 canonical truth。
- **dsh-trellis：** 可作为 DSH/Trellis breadcrumb 与事件驱动后台 subagent settlement 的可选 Host companion。不是 baseline Trellis-on-DSH 所必需。
- 额外 memory / compaction / hot-runtime 插件保持 opt-in，避免多个组件同时争夺 context 与 lifecycle 的 Owner。
