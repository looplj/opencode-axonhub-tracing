// index.ts
var DEFAULT_THREAD_HEADER = "AH-Thread-Id";
var DEFAULT_TRACE_HEADER = "AH-Trace-Id";
function resolveHeaderKey(envValue, fallback) {
  const value = typeof envValue === "string" ? envValue.trim() : "";
  return value ? value : fallback;
}
var OpenCodeAxonHubTracing = async (_input) => {
  return {
    "chat.headers": async (input, output) => {
      if (!input?.sessionID || !output?.headers)
        return;
      const threadHeader = resolveHeaderKey(process.env.OPENCODE_AXONHUB_TRACING_THREAD_HEADER, DEFAULT_THREAD_HEADER);
      const traceHeader = resolveHeaderKey(process.env.OPENCODE_AXONHUB_TRACING_TRACE_HEADER, DEFAULT_TRACE_HEADER);
      output.headers[threadHeader] = input.sessionID;
      const traceID = input.message?.id;
      if (traceID) {
        output.headers[traceHeader] = traceID;
      }
    }
  };
};
var opencode_axonhub_tracing_default = OpenCodeAxonHubTracing;
export {
  opencode_axonhub_tracing_default as default
};
