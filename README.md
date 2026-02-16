# opencode-axonhub-tracing

OpenCode 插件：为每次 LLM 请求注入 trace headers。

默认 header key 对齐 AxonHub：
- `AH-Thread-Id` ← OpenCode `sessionID`
- `AH-Trace-Id` ← OpenCode `message.id`

同时保持通用能力：header key 可通过环境变量覆盖。

## 安装

```bash
npm install -g opencode-axonhub-tracing
# 或
bun add -g opencode-axonhub-tracing
```

## 启用插件

在 `opencode.json` 中添加：

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-axonhub-tracing"]
}
```

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
- Trace ID：使用 OpenCode 当前用户消息 `message.id`
- 若当前消息没有 `id`，仅注入 thread header

## 开发

```bash
bun install
bun test
bun run build
```
