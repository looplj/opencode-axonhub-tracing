import { Plugin } from "@opencode/plugin"

const DEFAULT_THREAD_HEADER = "AH-Thread-Id"
const DEFAULT_TRACE_HEADER = "AH-Trace-Id"

function resolveHeaderKey(envValue: string | undefined, fallback: string): string {
  const value = typeof envValue === "string" ? envValue.trim() : ""
  return value ? value : fallback
}

const OpenCodeAxonHubTracing = Plugin.define({
  id: "opencode-axonhub-tracing",

  async setup(ctx) {
    const traceIDs = new Map<string, string>()

    await ctx.session.hook("prompt", (event) => {
      traceIDs.set(event.sessionID, event.messageID)
    })

    await ctx.session.hook("model.request", (event) => {
      if (!event?.sessionID || !event?.headers) return

      const threadHeader = resolveHeaderKey(
        process.env.OPENCODE_AXONHUB_TRACING_THREAD_HEADER,
        DEFAULT_THREAD_HEADER,
      )
      const traceHeader = resolveHeaderKey(
        process.env.OPENCODE_AXONHUB_TRACING_TRACE_HEADER,
        DEFAULT_TRACE_HEADER,
      )

      event.headers[threadHeader] = event.sessionID

      const traceID = traceIDs.get(event.sessionID)
      if (traceID) {
        event.headers[traceHeader] = traceID
      }
    })
  },
})

export default OpenCodeAxonHubTracing
