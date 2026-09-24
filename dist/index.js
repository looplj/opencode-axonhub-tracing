// index.ts
import { Plugin } from "@opencode/plugin";
var DEFAULT_THREAD_HEADER = "AH-Thread-Id";
var DEFAULT_TRACE_HEADER = "AH-Trace-Id";
function resolveHeaderKey(envValue, fallback) {
  const value = typeof envValue === "string" ? envValue.trim() : "";
  return value ? value : fallback;
}
var OpenCodeAxonHubTracing = Plugin.define({
  id: "opencode-axonhub-tracing",
  async setup(ctx) {
    const threadHeader = resolveHeaderKey(process.env.OPENCODE_AXONHUB_TRACING_THREAD_HEADER, DEFAULT_THREAD_HEADER);
    const traceHeader = resolveHeaderKey(process.env.OPENCODE_AXONHUB_TRACING_TRACE_HEADER, DEFAULT_TRACE_HEADER);
    const traceBySession = new Map;
    await ctx.session.hook("prompt", (event) => {
      if (event.messageID) {
        traceBySession.set(event.sessionID, event.messageID);
      }
    });
    await ctx.session.hook("model.request", (event) => {
      if (!event?.sessionID || !event?.headers)
        return;
      event.headers[threadHeader] = event.sessionID;
      const traceID = traceBySession.get(event.sessionID);
      if (traceID) {
        event.headers[traceHeader] = traceID;
      }
    });
    return () => {
      traceBySession.clear();
    };
  }
});
var opencode_axonhub_tracing_default = OpenCodeAxonHubTracing;
export {
  opencode_axonhub_tracing_default as default
};
