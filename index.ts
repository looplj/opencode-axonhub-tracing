import type { Hooks, PluginInput } from "@opencode-ai/plugin"

/**
 * OpenCode plugin for AxonHub tracing.
 *
 * Automatically injects AH-Trace-Id header into all AI provider requests for
 * AxonHub trace aggregation. This allows AxonHub to group requests from the
 * same OpenCode session into a single trace.
 *
 * ## Configuration
 *
 * Add to your `.opencode/config.json`:
 *
 * ```json
 * {
 *   "plugin": ["opencode-axonhub-tracing"]
 * }
 * ```
 */
export default async function AxonHubTracing(_input: PluginInput): Promise<Hooks> {
  return {
    // Inject tracing headers into chat requests
    "chat.headers": async (input: any, output: any) => {
      // Set AH-Trace-Id header for AxonHub trace aggregation
      if (input.sessionID) {
        output.headers["AH-Trace-Id"] = input.sessionID
      }
    },
  } as any
}
