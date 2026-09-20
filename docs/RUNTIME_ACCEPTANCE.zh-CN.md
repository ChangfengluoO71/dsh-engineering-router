# 运行时验收历史

## v0.2.0 — 2026-09-19

**结果：REAL_DSH_RUNTIME_FAIL**

环境：

- DSH：`0.1.5-rc.2`
- DSH_HOME：明确指定的用户环境路径
- Profile：`web`

在 STOP 前已经验证：

- GitHub plugin install 成功；
- Package `0.2.0` 安装成功；
- Preset、两个 Skill、review-package helper 和受管 AGENTS block 均正确物化；
- Installer 幂等；
- 原始 Router Standard 仍可用，且其文件/设置未被覆盖；
- Broken-chain fixture 和 Review Package 已成功准备。

STOP：

```text
agent-preset/invalid:
preset "engineering-router" failed to mount:
@deepseek-ai/dsh-persona config $.prefix missing required value
```

根因：

- vendored 的原始 Router Standard fallback 使用了 `config.text`；
- DSH persona Schema 要求 `config.prefix`；
- 上游 raw 文件本身是 pre-assembly fallback，但本项目把它作为 standalone runtime preset 发布了。

v0.2.1 修复：

1. 发布的 preset 使用 `config.prefix`；
2. upstream sync 只规范化已知的 legacy `text` 形态；
3. 未知 persona config 形态直接 fail loud；
4. CI 检查 packaged persona contract。

## v0.2.1 — 真实运行验收

**Runtime status: ACCEPTED**

环境：

- DSH：`0.1.5-rc.2`
- Package：`0.2.1`
- GitHub `main)：`5c52b4720c71e9f53bbd7fa3c0695f38fb0ac6ad`

### 1. Materialization / Mount

- `config.prefix` 已正确物化；
- persona row 中不存在 legacy `config.text`；
- Engineering Router preset 真实 mount 成功；
- 新建 Engineering Router Session 成功；
- 不再出现 `agent-preset/invalid` / `$.prefix missing`。

### 2. Router Runtime

- Router phase progression：PASS；
- `engineering_review` 只在 verification phase 暴露：PASS；
- phase gating 与实际 runtime tool surface 一致：PASS。

### 3. Independent Reviewer

真实 runtime descriptor：

```text
provider = spawn
mode = one-shot
maxDepth = 1
```

Reviewer 实际可用工具：

```text
phase_begin
read
glob
grep
```

没有：

- write / edit；
- shell；
- subagent；
- workflow；
- ralph；
- 其他 workspace mutation / delegation 工具。

因此 Reviewer 的只读隔离不是静态 YAML 推断，而是 runtime tool trace 证据。

### 4. Chain Integrity Discrimination

Broken-chain negative control：

```text
activate() => {enabled:true}
store      => false
status()   => false
```

Focused unit test 虽然通过，但真实链路没有连接。Reviewer 正确识别为 FAIL，并定位到 `activate() -> setEnabled()` 缺失。

修复 disposable fixture 后：

```text
activate
→ setEnabled(true)
→ state
→ getEnabled()
→ status
```

Integration test 通过，Scoped re-review 返回 PASS，之前的 findings 被标记为 RESOLVED。

因此得到关键 discrimination：

```text
BROKEN → FAIL
FIXED  → PASS
```

### 5. Coexistence / Namespace

- Router Standard 仍可以在同一 Host 上建立独立 Session；
- Engineering Router 与 Router Standard 的状态没有串线；
- Router Standard 的 pre-upgrade state 未被覆盖；
- settings、Router Standard preset、router-spec 和 AGENTS 未出现无关修改。

### 6. Runtime Gate

**REAL_DSH_RUNTIME_GATE: PASS**

这意味着 v0.2.1 已经完成真实 DSH Runtime Acceptance。

### 7. 尚未覆盖

以下项目没有被伪装成已验证：

- package-level `0.2.0 → 0.2.1` 原地升级路径：本轮开始前旧 v0.2.0 package 已不存在，因此只能标记 `UPGRADE_GATE = UNVERIFIED`；
- final whole-branch review 的真实运行；
- `engineering-project-bootstrap` 的完整 Trellis/Graphify bootstrap；
- Desktop 长驻 Host 重启后的 GUI preset selection。

这些是后续覆盖项，不构成当前 v0.2.1 Runtime Gate 的失败。

## 清理与 Git 状态

本轮实机验收没有修改仓库源码，也没有执行 commit / push / merge。

清理了本轮创建且不再需要的 fixture、driver、临时 Host 等文件；保留最终验收所需的 evidence、DSH-managed state、安装的 Skills 和用户已有状态。

## 后续

低优先级后续项：

- 在一个保留真实 v0.2.0 安装状态的环境中单独验证 package-level `0.2.0 → 0.2.1` upgrade path；
- 后续需要时补测 final whole-branch review；
- 后续需要时补测完整 Trellis/Graphify bootstrap。

这些不需要为了“补齐数字”而修改当前已经通过的 Runtime Gate。
