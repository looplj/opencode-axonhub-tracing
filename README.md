# opencode-axonhub-tracing

An OpenCode plugin that automatically injects AxonHub tracing headers into your LLM requests. This allows AxonHub to group all requests from the same OpenCode session together for trace aggregation.

## Installation

```bash
npm install -g opencode-axonhub-tracing
# or
bun add -g opencode-axonhub-tracing
```

## Usage

Add the plugin to your `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-axonhub-tracing"]
}
```

That's it! The plugin will automatically add:
- `AH-Trace-Id` - Set to the current OpenCode session ID.

## How It Works

1. The plugin hooks into the `chat.headers` event.
2. It injects the `AH-Trace-Id` into the headers of every AI provider request.
3. The trace ID is derived from the OpenCode `sessionID`, ensuring all requests in a single session are linked in AxonHub.

## Requirements

- OpenCode 1.1.40 or later
- An AxonHub setup

## License

MIT
