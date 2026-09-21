# 快速开始

## Engineering Router 最短用法

新建一个 **Engineering Router** Session，然后直接告诉它你要什么结果。

~~~text
实现 <目标>。
~~~

常见意图：

| 意图 | 直接说 |
|---|---|
| 实现 | 实现 <目标>。 |
| 修复 | 修复 <问题>。 |
| 调查 | 调查 <问题>。 |
| 研究 | 研究 <主题>，先不要改代码。 |
| 规划 | 规划 <目标>，先不要改代码。 |
| 审查 | 审查 <范围>。 |
| 继续 | 继续当前任务。 |

通常**不需要**每次都写：

~~~text
Research → Design → Implement → Verify → Review
~~~

这是 Engineering Router 的内部工程策略。Router 会自行检查项目并决定需要哪些阶段。

## 只有真正重要的约束才写出来

~~~text
实现 <目标>。保持现有公共接口，并保留与本任务无关的 dirty changes。
~~~

~~~text
研究 <问题>。不要修改仓库；使用当前仓库和权威外部资料验证。
~~~

~~~text
实现 <目标>。完成后验证行为再报告完成。
~~~

## Router 会自动处理什么

根据任务，它可以自动：

1. 检查当前仓库和项目工作流；
2. 在真正需要时使用 Trellis / Graphify；
3. 对版本敏感或不确定的问题进行调研；
4. 对架构决策进入项目 design/ADR 路径；
5. 做最小且完整的实现；
6. 按风险执行 focused / regression / real-run 验证；
7. 对有意义的行为变更调用独立、只读的 Reviewer；
8. 缺少必要证据时 STOP，而不是把它猜成 PASS。

## 什么时候需要显式要求只读 reconnaissance

对于全新或完全陌生的仓库，可以说：

~~~text
先检查项目，不要修改任何内容。告诉我本次目标相关的 Source of Truth、任务/AC 入口、验证入口，以及最小充分上下文。
~~~

## 安装

~~~powershell
dsh plugin --profile web add github:ChangfengluoO71/dsh-engineering-router
dsh web
~~~

然后创建**新的** Session，并选择 **Engineering Router**。

如果需要兼容性基线或固定版本，查看 USAGE.zh-CN.md 中的 accepted commit。

## 详细说明

- [完整使用说明](USAGE.zh-CN.md)
- [设计说明](DESIGN.zh-CN.md)
- [兼容性](COMPATIBILITY.zh-CN.md)
- [运行时验收](RUNTIME_ACCEPTANCE.zh-CN.md)