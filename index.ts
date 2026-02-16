import type { Plugin } from "@opencode-ai/plugin"

const DEFAULT_THREAD_HEADER = "AH-Thread-Id"
const DEFAULT_TRACE_HEADER = "AH-Trace-Id"

function resolveHeaderKey(envValue: string | undefined, fallback: string): string {
  const value = typeof envValue === "string" ? envValue.trim() : ""
  return value ? value : fallback
}

const OpenCodeAxonHubTracing: Plugin = async (_input) => {
  return {
    "chat.headers": async (input, output) => {
      if (!input?.sessionID || !output?.headers) return

      const threadHeader = resolveHeaderKey(process.env.OPENCODE_AXONHUB_TRACING_THREAD_HEADER, DEFAULT_THREAD_HEADER)
      const traceHeader = resolveHeaderKey(process.env.OPENCODE_AXONHUB_TRACING_TRACE_HEADER, DEFAULT_TRACE_HEADER)

      output.headers[threadHeader] = input.sessionID

      const traceID = input.message?.id
      if (traceID) {
        output.headers[traceHeader] = traceID
      }
    },
  }
}

export default OpenCodeAxonHubTracing
