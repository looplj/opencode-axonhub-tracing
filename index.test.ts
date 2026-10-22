import { afterEach, describe, expect, it } from "bun:test"
import OpenCodeAxonHubTracing from "./index"

type Hook = (event: any) => unknown

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

function createPluginContext() {
  const hooks: Record<string, Hook> = {}
  const context = {
    session: {
      hook: async (name: string, hook: Hook) => {
        hooks[name] = hook
      },
    },
  }

  return { context: context as any, hooks }
}

async function getHooks() {
  const { context, hooks } = createPluginContext()
  await OpenCodeAxonHubTracing.setup(context)
  return hooks
}

afterEach(() => {
  resetEnv()
})

describe("session request hooks", () => {
  it("injects default headers for the latest prompt", async () => {
    const hooks = await getHooks()
    const headers: Record<string, string> = {}

    await hooks.prompt({ sessionID: "ses_123", messageID: "msg_456" })
    await hooks["model.request"]({ sessionID: "ses_123", headers })

    expect(headers["AH-Thread-Id"]).toBe("ses_123")
    expect(headers["AH-Trace-Id"]).toBe("msg_456")
  })

  it("injects configured header keys from environment", async () => {
    process.env.OPENCODE_AXONHUB_TRACING_THREAD_HEADER = "X-Thread"
    process.env.OPENCODE_AXONHUB_TRACING_TRACE_HEADER = "X-Trace"

    const hooks = await getHooks()
    const headers: Record<string, string> = {}

    await hooks.prompt({ sessionID: "ses_abc", messageID: "msg_def" })
    await hooks["model.request"]({ sessionID: "ses_abc", headers })

    expect(headers["X-Thread"]).toBe("ses_abc")
    expect(headers["X-Trace"]).toBe("msg_def")
    expect(headers["AH-Thread-Id"]).toBeUndefined()
    expect(headers["AH-Trace-Id"]).toBeUndefined()
  })

  it("only injects the thread header before a prompt is admitted", async () => {
    const hooks = await getHooks()
    const headers: Record<string, string> = {}

    await hooks["model.request"]({ sessionID: "ses_no_msg", headers })

    expect(headers["AH-Thread-Id"]).toBe("ses_no_msg")
    expect(headers["AH-Trace-Id"]).toBeUndefined()
  })

  it("uses the latest prompt message id for a session", async () => {
    const hooks = await getHooks()
    const headers: Record<string, string> = {}

    await hooks.prompt({ sessionID: "ses_reused", messageID: "msg_old" })
    await hooks.prompt({ sessionID: "ses_reused", messageID: "msg_new" })
    await hooks["model.request"]({ sessionID: "ses_reused", headers })

    expect(headers["AH-Trace-Id"]).toBe("msg_new")
  })

  it("falls back to default keys when env vars are blank", async () => {
    process.env.OPENCODE_AXONHUB_TRACING_THREAD_HEADER = "   "
    process.env.OPENCODE_AXONHUB_TRACING_TRACE_HEADER = ""

    const hooks = await getHooks()
    const headers: Record<string, string> = {}

    await hooks.prompt({ sessionID: "ses_blank", messageID: "msg_blank" })
    await hooks["model.request"]({ sessionID: "ses_blank", headers })

    expect(headers["AH-Thread-Id"]).toBe("ses_blank")
    expect(headers["AH-Trace-Id"]).toBe("msg_blank")
  })

  it("only exports default", async () => {
    const mod = await import("./index")
    const namedExports = Object.keys(mod).filter((key) => key !== "default")
    expect(namedExports).toHaveLength(0)
  })
})
