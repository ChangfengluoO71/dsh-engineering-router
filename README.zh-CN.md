# dsh-engineering-router

面向 `ChangfengluoO71` 的个人 DeepSeek Harness（DSH）工程预设。

它将以下能力拆成独立层，而不是把所有规则堆进一个巨大 Prompt：

- **运行时路由：** 固定版本的 `dsh-routing-suite/router-standard` 衍生预设。
- **工程策略：** 写入 `$DSH_HOME/AGENTS.md` 的精简受管规则块。
- **项目工作流：** 仓库存在 `.trellis/` 时使用 Trellis。
- **代码知识：** 通过兼容 DSH 的 Agent Skills 按需使用 Graphify。
- **独立审查：** 使用全新、只读的 DSH Reviewer，并通过 Chain Integrity 证据检查行为变更。

Router 代码有意保持接近上游。默认所需的唯一运行时分叉是 **命名空间隔离**：将磁盘/全局状态中的 `router-standard` 改为 `engineering-router`，从而让原始 Router Standard 与本预设安全共存。

另外维护了一项明确的兼容性补丁：原始 Router Standard fallback 当前使用 `@deepseek-ai/dsh-persona` 的 `config.text`，而 DSH 运行时 Schema 要求 `config.prefix`。Engineering Router 在上游同步时会规范化这一行；如果上游结构发生未知变化，则会直接失败，而不是静默猜测。

> **语言：** [English](README.md) · 简体中文

## 安装

```powershell
dsh plugin --profile web add github:ChangfengluoO71/dsh-engineering-router
```

然后重启一次 `web` profile，并创建新的 **Engineering Router** Session。

Bundle 会安装：

```text
$DSH_HOME/
├─ AGENTS.md                                  # 受管规则块；保留无关内容
├─ .agent-presets/
│  └─ engineering-router/                    # 完整 DSH Agent 预设
└─ skills/
   ├─ engineering-project-bootstrap/
   │  └─ SKILL.md
   └─ engineering-review-gate/
      ├─ SKILL.md
      ├─ references/
      └─ scripts/review-package.mjs
```

它**不会**覆盖未受管的 `engineering-router` 目录。如果受管预设被本地修改，升级时会保留这些修改并记录警告；只有 Bundle 配置明确设置 `force: true` 时才会强制覆盖。

## 使用说明

现在单独提供完整的[使用说明](docs/USAGE.zh-CN.md)，覆盖安装验证、新 Session 选择、Trellis / Graphify 接入、Independent Review Gate、升级/卸载、高级配置和常见问题。

日常最短路径：

```text
新建 Engineering Router Session
  → 检查 AGENTS / Trellis / Git / architecture
  → Research → Design → Implement
  → focused verification
  → engineering_review
  → 修复 findings / UNVERIFIED
  → scoped re-review
  → project acceptance
```

## 升级

```powershell
dsh plugin --profile web update dsh-engineering-router
```

修改 Bundle 成员或版本后需要重启 profile。下一次启动时，安装器只更新它负责管理的文件。替换受管预设前，会在：

```text
$DSH_HOME/backups/dsh-engineering-router/
```

创建备份，并保留最近三代 preset/skill 备份。

## 项目配置：Trellis + Graphify

本 Bundle 有意不向每一个仓库自动安装外部开发工具。

对于较大的项目，调用已安装的 **engineering-project-bootstrap** Skill。它会先检查现有状态和当前 CLI 的 `--help`，然后在合适时使用项目原生集成。

本仓库调研确认的当前上游能力包括：

```powershell
trellis init --dsh -u <user>
graphify install --project --platform agents
```

如果已安装版本暴露出不同的 CLI 契约，不要盲目执行上述命令；先检查 `--help`。

Graphify 是**派生的导航层**，不是 Source of Truth。使用 query/path/explain 定位代码后，仍应回到当前源码、契约和测试进行验证。不要因为一个小任务就反复重建整个图。

## 独立审查门

对于以下工作，应使用已安装的 **engineering-review-gate** Skill：

- 非平凡行为变更；
- 跨模块 / API / Schema / 持久化 / 安全变更；
- 重大 Bug 修复；
- 多任务分支的最终审查。

预设只在 verification phase 暴露 `engineering_review`。它使用 DSH 的进程内 `spawn` provider，因此 Reviewer 从一个**全新的会话上下文**开始，而不是继承 Implementer 的推理历史。

Child 的工具面通过机制限制为 Router Bootstrap 控制工具和只读工作区工具：

```text
phase_begin
read
glob
grep
```

之所以必须执行一次 `phase_begin`，是因为进程内 Child 会先加入 Parent 的 preset 并继承 Router Bootstrap；它并不会因此获得工作区写权限。Reviewer 以前台、one-shot 方式运行，并限制 `maxDepth: 1`：允许创建第一层 Reviewer，但其过滤后的工具面不包含 delegation、shell 或 mutation，也不能递归创建新的 Reviewer。

审查门检查三个独立维度：

1. **规范符合性（Spec compliance）** —— 要求的行为是否真正实现？
2. **代码质量（Code quality）** —— 正确性、错误路径、兼容性、安全性、可维护性。
3. **链路完整性（Chain Integrity）** —— 每个行为级 AC 是否真正连接到了实际实现路径？

```text
Requirement / AC
  -> Entry Point
  -> Boundary / Interface
  -> Core Logic
  -> State / Persistence
  -> Downstream Consumer
  -> Observable Result
  -> Verification Evidence
```

Reviewer 的判断不是最终 Acceptance Authority。测试、契约、构建以及要求的真实运行仍然是证明行为的最终证据。缺少链路证据时必须报告 **UNVERIFIED**，不能猜成 PASS。

确定性的辅助脚本会在仓库 Git metadata 目录下生成精简 Review Package，其中包含精确的 base/head、commit subject **和 body**、工作树 diff、status、untracked 文件名，以及 requirements/evidence 的引用。这样 Reviewer 不需要复制 Implementer 的整个会话历史。

## 设计规则

全局受管 AGENTS 规则块执行以下跨项目工程行为：

- 修改前先理解；
- Research → Design/Plan → Implement → Verify；
- **Adopt → Adapt → Build**；
- Search before Ask；
- Minimum Sufficient Context；
- 存在 Trellis 时由 Trellis 负责项目工作流 / 控制面；
- 在大范围扫描仓库前优先使用 Graphify / LSP / Symbol Search；
- Subagent 只用于真实并行、专业能力或上下文隔离，不把它当作低级省 Token 手段；
- 有独立工作可做时不要空转 sleep/polling；
- Evidence Before Claims；
- `Implemented ≠ Verified ≠ Committed ≠ Pushed ≠ Released ≠ Accepted`；
- STOP 是合法的质量结果；
- Git / worktree 安全；
- 任务结束时只清理当前任务产生的垃圾；
- 持久知识进入 ADR/spec/task/test/workspace/code knowledge，而不是只留在聊天历史中。

详见：

- [设计说明](docs/DESIGN.zh-CN.md)
- [兼容性与调研基线](docs/COMPATIBILITY.zh-CN.md)
- [社区调研](docs/COMMUNITY_RESEARCH.zh-CN.md)
- [运行时验收历史](docs/RUNTIME_ACCEPTANCE.zh-CN.md)
- [详细使用说明](docs/USAGE.zh-CN.md)

## 上游维护

固定的上游源码快照记录在 `upstream.lock.json`。

从另一个上游 commit 重新同步 vendored preset：

```powershell
node scripts/sync-upstream.mjs <40-char-commit-sha>
npm test
git diff
```

也可以传入 `main`；脚本会先把它解析成精确 SHA，再写入 lock。发布升级前必须检查 diff 和测试结果。

## 测试

```powershell
npm run check
npm test
```

测试套件使用临时的 `DSH_HOME`，不会修改真实 DSH home。

## 可选生态集成

`dsh-trellis`、recovery/watchdog、hot-installer、额外 memory layer，以及额外的 compaction/capability-menu 插件，都**不是**硬依赖。

只有当某个集成带来明确收益，并且不会与 Router 在 session/context/tool 生命周期上形成第二个冲突的 Owner 时，才应加入。

## License

项目自身的 glue code 使用 MIT。Vendored Router Standard 文件保留其上游 MIT 署名；详见 `THIRD_PARTY_NOTICES.md` 与 `licenses/`。
