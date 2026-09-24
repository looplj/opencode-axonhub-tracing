import { afterEach, describe, expect, it } from "bun:test"
import OpenCodeAxonHubTracing from "./index"

const originalThreadHeader = process.env.OPENCODE_AXONHUB_TRACING_THREAD_HEADER
const originalTraceHeader = process.env.OPENCODE_AXONHUB_TRACING_TRACE_HEADER

function resetEnv() {
  if (originalThreadHeader === undefined) {
    delete process.env.OPENCODE_AXONHUB_TRACING_THREAD_HEADER
  } else {
    process.env.OPENCODE_AXONHUB_TRACING_THREAD_HEADER = originalThreadHeader
  }

  if (originalTraceHeader === undefined) {
    delete process.env.OPENCODE_AXONHUB_TRACING_TRACE_HEADER
  } else {
    process.env.OPENCODE_AXONHUB_TRACING_TRACE_HEADER = originalTraceHeader
  }
}

afterEach(() => {
  resetEnv()
})

type Hook = (event: any) => void

async function setupPlugin() {
  const hooks: Record<string, Hook> = {}

  const ctx = {
    session: {
      hook: async (name: string, callback: Hook) => {
        hooks[name] = callback
        return {
          dispose: async () => {
            delete hooks[name]
          },
        }
      },
    },
  } as any

  const cleanup = await OpenCodeAxonHubTracing.setup(ctx)

  return {
    prompt: async (event: any) => hooks["prompt"]?.(event),
    modelRequest: async (event: any) => hooks["model.request"]?.(event),
    hooks,
    cleanup,
  }
}

describe("model.request hook", () => {
  it("injects default header keys", async () => {
    const plugin = await setupPlugin()

    plugin.prompt({ sessionID: "ses_123", messageID: "msg_456" })

    const event = { sessionID: "ses_123", headers: {} as Record<string, string> }
    await plugin.modelRequest(event)

    expect(event.headers["AH-Thread-Id"]).toBe("ses_123")
    expect(event.headers["AH-Trace-Id"]).toBe("msg_456")
  })

  it("injects configured header keys from environment", async () => {
    process.env.OPENCODE_AXONHUB_TRACING_THREAD_HEADER = "X-Thread"
    process.env.OPENCODE_AXONHUB_TRACING_TRACE_HEADER = "X-Trace"

    const plugin = await setupPlugin()

    plugin.prompt({ sessionID: "ses_abc", messageID: "msg_def" })

    const event = { sessionID: "ses_abc", headers: {} as Record<string, string> }
    await plugin.modelRequest(event)

    expect(event.headers["X-Thread"]).toBe("ses_abc")
    expect(event.headers["X-Trace"]).toBe("msg_def")
    expect(event.headers["AH-Thread-Id"]).toBeUndefined()
    expect(event.headers["AH-Trace-Id"]).toBeUndefined()
  })

  it("only injects thread header when no prompt was seen", async () => {
    const plugin = await setupPlugin()

    const event = { sessionID: "ses_no_msg", headers: {} as Record<string, string> }
    await plugin.modelRequest(event)

    expect(event.headers["AH-Thread-Id"]).toBe("ses_no_msg")
    expect(event.headers["AH-Trace-Id"]).toBeUndefined()
  })

  it("only injects thread header when prompt has no messageID", async () => {
    const plugin = await setupPlugin()

    plugin.prompt({ sessionID: "ses_empty_msg" })

    const event = { sessionID: "ses_empty_msg", headers: {} as Record<string, string> }
    await plugin.modelRequest(event)

    expect(event.headers["AH-Thread-Id"]).toBe("ses_empty_msg")
    expect(event.headers["AH-Trace-Id"]).toBeUndefined()
  })

  it("uses the latest prompt message as trace id", async () => {
    const plugin = await setupPlugin()

    plugin.prompt({ sessionID: "ses_1", messageID: "msg_old" })
    plugin.prompt({ sessionID: "ses_1", messageID: "msg_new" })

    const event = { sessionID: "ses_1", headers: {} as Record<string, string> }
    await plugin.modelRequest(event)

    expect(event.headers["AH-Trace-Id"]).toBe("msg_new")
  })

  it("keeps trace ids isolated per session", async () => {
    const plugin = await setupPlugin()

    plugin.prompt({ sessionID: "ses_a", messageID: "msg_a" })
    plugin.prompt({ sessionID: "ses_b", messageID: "msg_b" })

    const eventA = { sessionID: "ses_a", headers: {} as Record<string, string> }
    const eventB = { sessionID: "ses_b", headers: {} as Record<string, string> }
    await plugin.modelRequest(eventA)
    await plugin.modelRequest(eventB)

    expect(eventA.headers["AH-Trace-Id"]).toBe("msg_a")
    expect(eventB.headers["AH-Trace-Id"]).toBe("msg_b")
  })

  it("does not throw when output.headers is missing", async () => {
    const plugin = await setupPlugin()

    await expect(
      plugin.modelRequest({ sessionID: "ses_123" }),
    ).resolves.toBeUndefined()
  })

  it("does not throw when event is undefined", async () => {
    const plugin = await setupPlugin()

    await expect(plugin.modelRequest(undefined)).resolves.toBeUndefined()
  })

  it("does not throw when event.sessionID is missing", async () => {
    const plugin = await setupPlugin()

    const event = { headers: {} as Record<string, string> }
    await expect(plugin.modelRequest(event)).resolves.toBeUndefined()

    expect(Object.keys(event.headers)).toHaveLength(0)
  })

  it("falls back to default keys when env vars are blank", async () => {
    process.env.OPENCODE_AXONHUB_TRACING_THREAD_HEADER = "   "
    process.env.OPENCODE_AXONHUB_TRACING_TRACE_HEADER = ""

    const plugin = await setupPlugin()

    plugin.prompt({ sessionID: "ses_blank", messageID: "msg_blank" })

    const event = { sessionID: "ses_blank", headers: {} as Record<string, string> }
    await plugin.modelRequest(event)

    expect(event.headers["AH-Thread-Id"]).toBe("ses_blank")
    expect(event.headers["AH-Trace-Id"]).toBe("msg_blank")
  })

  it("stops injecting trace after cleanup", async () => {
    const plugin = await setupPlugin()

    plugin.prompt({ sessionID: "ses_c", messageID: "msg_c" })
    await plugin.cleanup?.()

    const event = { sessionID: "ses_c", headers: {} as Record<string, string> }
    await plugin.modelRequest(event)

    expect(event.headers["AH-Thread-Id"]).toBe("ses_c")
    expect(event.headers["AH-Trace-Id"]).toBeUndefined()
  })
})

describe("plugin definition", () => {
  it("registers the prompt and model.request hooks", async () => {
    const plugin = await setupPlugin()

    expect(Object.keys(plugin.hooks).sort()).toEqual(["model.request", "prompt"])
  })

  it("has a stable id", () => {
    expect(OpenCodeAxonHubTracing.id).toBe("opencode-axonhub-tracing")
  })

  it("only exports default", async () => {
    const mod = await import("./index")
    const namedExports = Object.keys(mod).filter((k) => k !== "default")
    expect(namedExports).toHaveLength(0)
  })
})
