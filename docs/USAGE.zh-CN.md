# 使用说明

> 当前 Runtime Acceptance 基线：DSH 0.1.5-rc.2、Bundle 0.2.1。该基线已完成真实 DSH Runtime Acceptance，但 DSH 本身仍处于快速迭代阶段；未来版本应重新检查兼容性。

## 1. 这个 Bundle 安装以后会得到什么？

Engineering Router 不是一个单独的聊天工具，而是一套 DSH 工程工作环境。

| 层 | 作用 | 你什么时候会感知到 |
|---|---|---|
| Engineering Router preset | 路由、阶段化工具暴露、plan/delivery 行为 | 每个新 Engineering Router Session |
| 全局 AGENTS 规则 | Research → Design → Implement → Verify、Git 安全、Evidence Before Claims 等 | 所有适用的 DSH 工程任务 |
| engineering-project-bootstrap Skill | Trellis / Graphify 项目初始化与接入 | 新项目、老项目 onboarding、需要刷新工程知识时 |
| engineering-review-gate Skill | 独立 fresh-context Reviewer + Chain Integrity | 非平凡变更、跨边界变更、合并门禁 |

它不会自动：

- 修改你的项目源码；
- 初始化 Trellis；
- 每次任务都重建 Graphify；
- 自动创建 Git commit / push；
- 把 Reviewer 当成第二个 Implementer；
- 安装或替换你的模型供应商。

DSH 启动时，Bundle installer 只负责把它管理的 preset、Skill 和 AGENTS 规则物化到 $DSH_HOME。

## 2. 前置条件

至少确认：

~~~powershell
node --version
dsh --version
pnpm --version
~~~

本 Bundle 的 package.json 声明 Node >=20；DSH 自身的 Node 版本要求以你当前安装的 DSH 为准。

dsh plugin 会在目标 profile 中转发给 pnpm，因此 pnpm 必须在 PATH 中。

当前仓库的 GitHub 安装包已经包含构建后的 lib，并没有额外的 prepare 脚本。正常情况下不需要为了本 Bundle 自己执行 build。若你的 DSH/pnpm 明确提示 build-script approval，则以终端给出的当前错误和授权键为准，不要猜参数。

### 当前验证范围

本仓库 v0.2.1 已真实验证：

- DSH 0.1.5-rc.2
- Web profile
- Engineering Router mount / Session 创建
- Router phase progression
- engineering_review phase gating
- Reviewer fresh spawn
- Reviewer read-only tool isolation
- Broken-chain → FAIL / Fixed-chain → PASS
- Router Standard 与 Engineering Router 共存

因此，推荐首先使用 web profile。其他 profile 可以按 DSH 的 profile 机制安装，但不属于当前 Runtime Acceptance 已覆盖范围。

## 3. 安装

### 3.1 普通安装：跟随仓库 main

~~~powershell
dsh plugin --profile web add github:ChangfengluoO71/dsh-engineering-router
~~~

安装完成后，先检查实际 composition：

~~~powershell
dsh --profile web --dump-config
~~~

然后重启 Web profile：

~~~powershell
dsh web
~~~

如果原来的 dsh web 已经在运行，必须先完全退出再启动；Bundle 属于启动时组合层，不能指望正在运行的进程自动获得新的 bundle。

### 3.2 需要冻结已验收 Runtime 时

如果你希望安装内容固定到本项目 v0.2.1 Runtime Acceptance 使用的 commit，可以使用精确 commit：

~~~powershell
dsh plugin --profile web add github:ChangfengluoO71/dsh-engineering-router#5c52b4720c71e9f53bbd7fa3c0695f38fb0ac6ad
~~~

这比直接安装 main 更适合做可重复实验或排查兼容性问题。

## 4. 安装后第一次怎么进入 Engineering Router？

启动 Web 后：

1. 打开 DSH Web UI；
2. 创建一个新的 Session；
3. 在 Agent preset / Mode 选择器中选择 Engineering Router；
4. 再开始工程任务。

一个非常重要的 DSH 语义是：

> **Preset 在 Session 创建时确定。**

已经开始运行的旧 Session 不会因为你后来切换默认 preset 就变成 Engineering Router。要测试新的 preset，最稳妥的方式是创建一个新的 Session。

Session header 会记录它实际使用的 preset；因此，如果你还需要恢复历史 Engineering Router Session，不要随意删除 $DSH_HOME/.agent-presets/engineering-router/。

## 5. 第一次接入一个项目：不需要手工编排 reconnaissance

普通任务不需要先发送一大段 onboarding prompt。直接告诉 Router 目标即可：

~~~text
实现 <目标>。
~~~

Engineering Router 应自行先检查当前任务、仓库状态、架构、测试和项目知识，再决定是否需要调研、规划和审查。只有属于用户的选择，或无法安全发现的关键信息，才应该询问用户。

如果是**全新或完全陌生的项目**，可以显式要求一次只读 reconnaissance：

~~~text
先检查项目，不要修改任何内容。告诉我本次目标相关的 Source of Truth、任务/AC 入口、验证入口，以及最小充分上下文。
~~~

内部工作流仍然是：

~~~text
Intent → Understand → 必要时 Research → Locate → 必要时 Plan
      → Implement → Verify → 按风险 Review → Handoff
~~~

用户通常只需要表达**意图和必要约束**，不需要手工编排这些阶段。

## 6. 日常任务应该怎么下指令？

优先使用最短、最自然的任务表达：

| 意图 | 示例 |
|---|---|
| 实现 | `实现新的封面读取逻辑。` |
| 修复 | `修复封面读取失败。` |
| 调查 | `调查 Android release 构建为什么拿不到封面。` |
| 研究 | `研究当前 Android versionCode 的行为，先不要改代码。` |
| 规划 | `规划这个改动最小且安全的实现方案，先不要改代码。` |
| 审查 | `审查当前改动的正确性和链路完整性。` |
| 继续 | `继续当前任务。` |

需要时再补充真正重要的约束：

~~~text
实现 <目标>。保持现有公共接口，并保留与本任务无关的 dirty changes。
~~~

~~~text
研究 <问题>。不要修改仓库；使用当前仓库和权威外部资料验证。
~~~

~~~text
实现 <目标>。完成后验证行为再报告完成。
~~~

不要把 `Research → Design → Implement → Verify → Review` 当成用户每次都要填写的 prompt 模板。这是 Router 的内部工程策略，而不是用户仪式。只有你确实想限制阶段时，才显式写出阶段约束。

对于未知技术问题，Router 应自动先检查仓库和权威外部资料，再决定实现方式。对于架构、协议、Schema、持久化或安全边界变更，应在需要时进入项目的 design/ADR 路径。

最终报告仍必须区分 `Implemented / Verified / Committed / Pushed / Accepted`；缺少必要证据时应 STOP。

## 7. Independent Review Gate 怎么用？

这是这个 Bundle 最值得单独说明的一部分。

### 什么时候用？

| 变更 | Review |
|---|---|
| README、注释、纯机械修改 | 通常不需要独立 Reviewer |
| 普通行为变更 | 建议 task review |
| 跨模块 / API / Schema | 应使用 |
| 持久化 / migration | 应使用 |
| 安全边界 | 应使用 |
| 重大 Bug 修复 | 应使用 |
| 多任务分支合并前 | 应做 final whole-branch review |

Reviewer 的目的不是再写一遍代码，而是用全新的上下文检查 Implementer 是否把真实链路接通。

### 7.1 先准备 deterministic evidence

先运行本次变更真正需要的 focused tests / contract / build / real-run。

不要让 Reviewer 用一句“看起来没问题”替代测试。

### 7.2 生成 Review Package

Windows PowerShell：

~~~powershell
$dshRoot = if ($env:DSH_HOME) { $env:DSH_HOME } else { Join-Path $HOME ".dsh" }
$reviewScript = Join-Path $dshRoot "skills/engineering-review-gate/scripts/review-package.mjs"

node $reviewScript `
  --mode task `
  --base <BASE_SHA> `
  --requirements <task-or-spec-path> `
  --evidence <evidence-path>
~~~

requirements 和 evidence 可以重复，也可以在项目没有对应文件时省略。

Package 会放在：

~~~text
.git/dsh-engineering-review/
~~~

因此不会因为生成 review package 而污染普通工作树。

Package 重点包含：

- exact base/head；
- commit subject + body；
- Git status / name-status / stat；
- 相对 base 的 tracked diff；
- untracked 文件名；
- requirements / evidence 路径。

它不会把所有 untracked 文件内容复制进去；Reviewer 需要时直接读取相关文件。

### 7.3 在 verification phase 调用 Reviewer

当 Engineering Router 进入 verification phase 后，才会暴露：

~~~text
engineering_review
~~~

调用时给 Reviewer：

- Review Package 路径；
- task / final / re-review 模式；
- 必要的 requirements / evidence 路径；
- 可选的 Graphify impact hints。

Reviewer 是 fresh spawn，不是 Implementer 的历史上下文 fork。

### 7.4 Reviewer 实际能做什么？

Runtime Acceptance 已验证它的工具面为：

~~~text
phase_begin
read
glob
grep
~~~

它没有：

- write / edit；
- shell；
- delegation；
- subagent；
- workflow mutation；
- 其他工作区修改工具。

因此 Reviewer 只能检查，不能偷偷替你修代码。

### 7.5 最关键：Chain Integrity

对于行为级 AC，不只检查这个函数写对了，而是追踪：

~~~text
Requirement / AC
  → Entry Point
  → Boundary / Interface
  → Core Logic
  → State / Persistence
  → Downstream Consumer
  → Observable Result
  → Verification Evidence
~~~

典型的断链包括：

- producer 写了，但 consumer 没接；
- API 层有了，但 core 没调用；
- DB migration 写了，但 readback 没实现；
- backend 正确，但 UI 没接；
- unit test 通过，但真实 integration path 没连；
- 打包文件存在，但 runtime 没加载。

如果证据不完整，Reviewer 应该返回：

~~~text
UNVERIFIED
~~~

而不是猜成 PASS。

### 7.6 Reviewer 结果如何处理？

期望输出结构：

~~~text
Status: PASS | FAIL | UNVERIFIED
Spec Compliance: PASS | FAIL | UNVERIFIED
Chain Integrity: PASS | FAIL | UNVERIFIED
Test Evidence: PASS | FAIL | INCOMPLETE
Findings: Critical / Important / Minor
Chain Evidence:
  AC -> Entry -> Boundary -> Logic -> State -> Consumer -> Observable -> Evidence
Unverified:
Required Follow-up:
~~~

处理规则：

- Critical / Important：修复后再 review；
- Minor：可以记录后延期；
- UNVERIFIED：补最小证明，不允许用语言解释把它变成 PASS；
- 修复后优先使用 scoped re-review，而不是无脑再跑一次完整 Review。

## 8. 多任务分支什么时候做 Final Review？

如果一个分支包含多个任务或多个子系统变更，建议最后再做一次 final whole-branch review。

它应该从任务/分支 base 一直看到账面 candidate，而不是只看最后一个 commit。

重点检查：

- 跨任务集成；
- API / protocol / schema compatibility；
- migration / persistent state round trip；
- producer / consumer；
- startup / shutdown / retry；
- security / data boundary；
- build / package / release wiring；
- 只通过 isolated unit tests、但没有 integrated evidence 的行为。

## 9. 升级

正常升级：

~~~powershell
dsh plugin --profile web update dsh-engineering-router
~~~

然后重启：

~~~powershell
dsh web
~~~

升级时，installer 会：

1. 识别它自己管理的 preset / Skill；
2. 检查是否被本地修改；
3. 如果需要替换，先备份；
4. 保留最近三代 preset / skill backup；
5. 只更新自己管理的 AGENTS block；
6. 保留 AGENTS.md 中其他无关内容。

### 本地修改保护

如果某个受管目录被你手动改过，默认不会静默覆盖，而是保留本地修改并给出 warning。

只有你明确设置 force: true 才允许覆盖。

因此不要把 force: true 当普通升级选项；它实际上是“我确认接受受管文件覆盖”。

## 10. 高级安装配置

默认 installer 配置就是全部启用：

~~~yaml
config: {}
~~~

你可以在 profile 自己的 cordis.patch.yml 中覆盖 installer row。

### 只安装 preset + Review，不写全局 AGENTS

~~~yaml
- insert:
    - id: dsh-engineering-router-installer
      name: dsh-engineering-router
      config:
        installGlobalRules: false
        installBootstrapSkill: false
        installReviewSkill: true
~~~

### 只想临时强制重物化

~~~yaml
- insert:
    - id: dsh-engineering-router-installer
      name: dsh-engineering-router
      config:
        force: true
~~~

注意：DSH patch 是按 row id 覆盖，而且目标 row 的 config 是整体替换，不是 deep merge。因此自定义时应明确写出你希望保留的配置。

一般用户不需要改这些配置。

## 11. 卸载

从 Web profile 移除 Bundle：

~~~powershell
dsh plugin --profile web remove dsh-engineering-router
~~~

然后重启：

~~~powershell
dsh web
~~~

### 一个非常重要的区别

remove 删除的是 profile dependency 和 profile bundle layer。

它不等价于自动删除已经物化的：

~~~text
$DSH_HOME/.agent-presets/engineering-router/
$DSH_HOME/skills/engineering-project-bootstrap/
$DSH_HOME/skills/engineering-review-gate/
$DSH_HOME/AGENTS.md 中的 managed block
$DSH_HOME/backups/dsh-engineering-router/
~~~

这是有意保守设计的一部分：当前 installer 没有 destructive uninstall hook。

### 不要急着手动删除 preset

如果你还有需要恢复的 Engineering Router 历史 Session，先不要删除：

~~~text
$DSH_HOME/.agent-presets/engineering-router/
~~~

因为 DSH 会把 Session 使用过的 preset id 持久化；Host 重启后恢复历史 Session 时仍需要该 preset 存在。

如果确认以后不再需要这些历史 Session，再按当前机器实际状态检查后清理对应 managed files。

## 12. 常见问题

### A. 安装成功，但 Engineering Router 不出现在新 Session

先看实际 composition：

~~~powershell
dsh --profile web --dump-config
~~~

然后确认：

1. 安装到了你真正启动的 profile；
2. dsh-engineering-router-installer layer 存在；
3. 已重启 dsh web；
4. 创建的是新 Session，而不是继续使用旧 Session。

### B. 出现 $.prefix missing required value

这是 v0.2.0 已经真实出现过的 mount blocker。

v0.2.1 已修复：

~~~text
legacy config.text
        ↓
config.prefix
~~~

如果你仍看到这个错误，优先怀疑当前 profile 里残留的是旧版本物化 preset，而不是重新修改 DSH 配置。

先升级或重新安装当前版本，再检查实际 preset 文件。

### C. 升级后看到 preserve locally modified

这是保护机制，不是失败。

含义是：

~~~text
Bundle 文件发生变化
+
你本地修改过该 managed file
=
默认不覆盖
~~~

如果本地修改是有意的，先保留它；如果确认应该完全回到 Bundle 版本，再显式使用 force: true。

### D. Reviewer 工具看不到

engineering_review 只在 verification phase 暴露。

因此先确认：

1. 当前 Session 真的是 Engineering Router；
2. Router 已经进入 verification phase；
3. preset mount 没有失败。

不要因为当前 phase 看不到工具，就修改 preset YAML 强行暴露它。

### E. Reviewer PASS，但我觉得链路仍然没接通

检查 Reviewer 是否返回 Chain Integrity: PASS，以及是否给出了完整：

~~~text
AC
→ Entry
→ Boundary
→ Logic
→ State
→ Consumer
→ Observable
→ Evidence
~~~

如果只有“代码看起来合理”，没有真实调用、数据或状态路径证据，应补 deterministic 或 real-run evidence，而不是让 Reviewer 重复阅读同一份 diff。

### F. Graphify 结果和源码不一致

把 Graphify 当导航层，而不是 Source of Truth。

正确处理：

~~~text
Graphify query/path/explain
        ↓
定位相关符号
        ↓
读取当前源码
        ↓
检查 contract / tests
        ↓
以当前源码和证据为准
~~~

不要因为 Graphify 没更新，就直接相信旧关系；也不要为了一个小任务重建整个图。

## 13. 推荐的日常最短路径

如果你已经安装并正常运行，日常其实可以压缩成：

~~~text
① 新建 Engineering Router Session
        ↓
② 让 Agent 先检查 AGENTS / Trellis / Git / architecture
        ↓
③ Research → Design → Implement
        ↓
④ focused tests / regression / build / real run
        ↓
⑤ verification phase
        ↓
⑥ engineering_review
        ↓
⑦ 修复 Critical / Important / UNVERIFIED
        ↓
⑧ scoped re-review
        ↓
⑨ final whole-branch review（多任务时）
        ↓
⑩ project acceptance
        ↓
⑪ Git commit / push
~~~

最重要的使用习惯只有三条：

1. **不要把 Engineering Router 当成自动写代码按钮，它首先是工程控制面。**
2. **不要把 Reviewer 当成第二个 Implementer；Reviewer 的价值在于独立上下文 + 只读 + Chain Integrity。**
3. **不要把 Graphify / AI summary / Reviewer 判断当 Source of Truth；最终以当前源码、契约、测试和真实运行证据为准。**

## 14. 相关文档

- [设计说明](DESIGN.zh-CN.md)
- [兼容性与调研基线](COMPATIBILITY.zh-CN.md)
- [社区调研](COMMUNITY_RESEARCH.zh-CN.md)
- [运行时验收历史](RUNTIME_ACCEPTANCE.zh-CN.md)
- [English Usage Guide](USAGE.md)## 6. 日常任务应该怎么下指令？

优先使用最短、最自然的任务表达：

| 意图 | 示例 |
|---|---|
| 实现 | `实现新的封面读取逻辑。` |
| 修复 | `修复封面读取失败。` |
| 调查 | `调查 Android release 构建为什么拿不到封面。` |
| 研究 | `研究当前 Android versionCode 的行为，先不要改代码。` |
| 规划 | `规划这个改动最小且安全的实现方案，先不要改代码。` |
| 审查 | `审查当前改动的正确性和链路完整性。` |
| 继续 | `继续当前任务。` |

需要时再补充真正重要的约束：

~~~text
实现 <目标>。保持现有公共接口，并保留与本任务无关的 dirty changes。
~~~

~~~text
研究 <问题>。不要修改仓库；使用当前仓库和权威外部资料验证。
~~~

~~~text
实现 <目标>。完成后验证行为再报告完成。
~~~

不要把 `Research → Design → Implement → Verify → Review` 当成用户每次都要填写的 prompt 模板。这是 Router 的内部工程策略，而不是用户仪式。只有你确实想限制阶段时，才显式写出阶段约束。

对于未知技术问题，Router 应自动先检查仓库和权威外部资料，再决定实现方式。对于架构、协议、Schema、持久化或安全边界变更，应在需要时自动进入项目的 design/ADR 路径。

最终报告仍必须区分 `Implemented / Verified / Committed / Pushed / Accepted`；缺少必要证据时应 STOP。

