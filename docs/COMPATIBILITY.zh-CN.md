# 兼容性与调研基线

调研日期：**2026-09-19**。

本仓库明确区分“实际检查过的内容”和“可以保证的兼容性”。

## 已检查基线

- DeepSeek Harness：`deepseek-ai/deepseek-harness@ddefc45fbc7f8e46dd73185e68295696d1297887`（0.1.6-alpha.2 release line）。
- dsh-routing-suite：`yjh051108/dsh-routing-suite@195273352f23bff7f9023ebe2ec0cdbdf9c98f10`。
- Trellis：`mindfold-ai/Trellis@e77ae89f648a78d5859fa2e8ac314655898421a5`，CLI 0.6.17。
- Graphify：`Graphify-Labs/graphify@b9cd9570728a5ff3485d2a1e36fe9a1272a368ae`，package 0.9.64。
- dsh-trellis：`SajoLuo/dsh-trellis@c73a7da0763656eca3129701c43dacb277f592b0`，作为可选 companion。
- dsh-gitbash-preset：作为 Host Bundle 的社区参考，检查了其将用户 Agent preset 物化到 Host 的做法。

## 依赖的 DSH 契约

- 通过 `dsh plugin --profile <name> add <package-or-git-spec>` 进行 Git/plugin 安装。
- Package 可以声明 `dsh.bundle.patch`。
- 用户 Agent preset 位于 `$DSH_HOME/.agent-presets/<preset-id>/`。
- Preset composition 属于 Agent plane；Host registry / sandbox / persistence / model route 仍属于 Host plane。
- `dsh-agent-instructions` 会读取适用的 AGENTS/CLAUDE instructions。
- DSH Skill discovery 支持 project/global Agent Skills root，因此可以在不把 Graphify/Trellis 代码嵌入本预设的情况下完成集成。
- `@deepseek-ai/dsh-tool-subagent` 支持 fresh `spawn` provider、每个 Child 的 `persona`、`toolFilter`、foreground one-shot，以及数值型 `maxDepth`。
- 当前 DSH tool catalog 在本预设中注册 `phase_begin`、`read`、`glob`、`grep`；Subagent tool filter 中的未知名称会直接失败，而不会被静默忽略。
- In-process spawn 会先加入 Parent 的 composed preset，再应用 Child 的 `persona` / `toolFilter`。由于 Engineering Router 会为每个 fresh session 执行 Bootstrap，Reviewer allow-list 必须保留 `phase_begin`，否则 Child 无法解锁 read/search 阶段。
- DSH depth 语义把第一层 Child 计为 depth 1。因此 Engineering Review 使用 `maxDepth: 1`；`maxDepth: 0` 会直接拒绝创建 Reviewer。
- `@deepseek-ai/dsh-persona` 要求 `config.prefix`。检查过的 DSH source 声明 `prefix: z.string().required()`。而原始 `dsh-routing-suite/router-standard` fallback 使用 legacy `config.text`，所以 Engineering Router 将 `text -> prefix` 明确定义为兼容性补丁，而不是逐字复制上游 fallback。

DSH 仍处于快速迭代的 prerelease 阶段。这里的基线是调研事实，不代表未来所有 0.1.x build 都兼容。

## v0.2.0 真实运行回归基线

第一次 v0.2.0 验收运行使用 DSH `0.1.5-rc.2`，证明了安装/物化流程，但在 Session 创建前停止：

```text
agent-preset/invalid
@deepseek-ai/dsh-persona
$.prefix missing required value
```

当时安装的 Engineering Router 使用 `config.text`；同一 Host 上正常工作的 Router Standard 使用 `config.prefix`。

v0.2.1 修复了这个 mount blocker，并增加 regression gate。

## v0.2.1 真实运行验收

v0.2.1 已完成真实 DSH Runtime Acceptance：

- DSH：`0.1.5-rc.2`
- Package：`0.2.1`
- GitHub `main)：`5c52b4720c71e9f53bbd7fa3c0695f38fb0ac6ad`
- Preset mount：PASS
- Engineering Router Session 创建：PASS
- Router phase progression：PASS
- `engineering_review` phase gating：PASS
- Reviewer `provider=spawn)：PASS
- Reviewer read-only tool isolation：PASS
- Broken-chain negative control：PASS
- Fixed-chain positive control：PASS
- Router Standard coexistence / namespace isolation：PASS

其中最关键的 discrimination gate 为：

```text
BROKEN → FAIL
FIXED  → PASS
```

因此 Reviewer 没有因为 focused unit test 通过而错误放行断链实现。

**REAL_DSH_RUNTIME_GATE: PASS**

### 尚未覆盖

以下项目仍不属于 v0.2.1 Runtime Acceptance 的已验证范围：

- package-level `0.2.0 → 0.2.1` 原地升级路径，因为本轮开始前旧 v0.2.0 package 已不存在，因此无法诚实地宣称 UPGRADE_GATE PASS；
- final whole-branch review 的真实运行；
- `engineering-project-bootstrap` 的完整 Trellis/Graphify bootstrap 路径；
- Desktop 长驻 Host 重启后的 GUI preset selection。

这些属于后续验证项，而不是当前 Runtime Gate 的失败项。

## 升级门

发布上游刷新前：

1. 同步到**精确 commit**；
2. 检查上游 preset/module 变更；
3. 确认 namespace patch 仍覆盖所有有状态的 `router-standard` Key；
4. 运行 `npm run check` 和 `npm test`；`npm run check` 必须通过 packaged persona contract（`config.prefix`，不得使用 legacy `config.text`）；
5. 确认 `agent.cordis.yml` 中的本地相对 import 均存在；
6. 安装到隔离的 `DSH_HOME`；
7. 启动 Web 并创建新的 Engineering Router Session；
8. 验证 first-turn routing、phase progression、plan mode、shell behavior、compaction、skill discovery 和 delivery gate；
9. 验证原始 Router Standard 可以共存，且没有共享 stage/override state；
10. 验证 `engineering_review` 只在 verification phase 出现，并能成功启动 fresh reviewer；
11. 验证 Reviewer 只能看到 `phase_begin` 加 `read`、`glob`、`grep`，不能 mutation/delegate，能读取生成的 Review Package，并返回 foreground verdict；
12. 执行一次故意的 broken-chain fixture 或真实项目案例，确认缺失的 integration evidence 会变成 `UNVERIFIED`/FAIL，而不是 PASS；
13. 最后才更新正常 profile。

不要用 stars、README 宣称或宽泛的 peer-dependency range 替代这套门禁。
