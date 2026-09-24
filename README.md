# opencode-axonhub-tracing

OpenCode **v2** 插件：为每次 LLM 请求注入 trace headers。

默认 header key 对齐 AxonHub：
- `AH-Thread-Id` ← OpenCode `sessionID`
- `AH-Trace-Id` ← OpenCode 当前用户消息 `message.id`

同时保持通用能力：header key 可通过环境变量覆盖。

> 已升级支持 OpenCode v2。

## 安装

```bash
npm install -g opencode-axonhub-tracing
# 或
bun add -g opencode-axonhub-tracing
```

## 启用插件

在 `opencode.json(c)` 中添加：

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["opencode-axonhub-tracing"]
}
```

> v2 的配置项是 `plugins`（复数），且条目为字符串或 `{ "package": ..., "options": {...} }` 对象。

## 配置（可选）

默认 key：
- `AH-Thread-Id`
- `AH-Trace-Id`

可用环境变量覆盖：

- `OPENCODE_AXONHUB_TRACING_THREAD_HEADER`
- `OPENCODE_AXONHUB_TRACING_TRACE_HEADER`

示例：

```bash
export OPENCODE_AXONHUB_TRACING_THREAD_HEADER="X-Thread-Id"
export OPENCODE_AXONHUB_TRACING_TRACE_HEADER="X-Trace-Id"
```

说明：空字符串会自动回退到默认 key。

## 行为说明

- Thread ID：使用 OpenCode 的 `sessionID`
- Trace ID：使用当前 session 最新一条用户消息的 `message.id`
- 若该 session 尚未经过 prompt hook（例如 compaction / title 等辅助请求），仅注入 thread header
- 每条用户消息产生一个独立 trace

## 开发

```bash
bun install
bun test
bun run build
bunx tsc --noEmit
```
