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

async function getHeadersHook() {
  const hooks = await OpenCodeAxonHubTracing({} as any)
  return hooks["chat.headers"]!
}

describe("chat.headers hook", () => {
  it("injects default header keys", async () => {
    const hook = await getHeadersHook()
    const output = { headers: {} as Record<string, string> }

    await hook(
      { sessionID: "ses_123", message: { id: "msg_456" } } as any,
      output,
    )

    expect(output.headers["AH-Thread-Id"]).toBe("ses_123")
    expect(output.headers["AH-Trace-Id"]).toBe("msg_456")
  })

  it("injects configured header keys from environment", async () => {
    process.env.OPENCODE_AXONHUB_TRACING_THREAD_HEADER = "X-Thread"
    process.env.OPENCODE_AXONHUB_TRACING_TRACE_HEADER = "X-Trace"

    const hook = await getHeadersHook()
    const output = { headers: {} as Record<string, string> }

    await hook(
      { sessionID: "ses_abc", message: { id: "msg_def" } } as any,
      output,
    )

    expect(output.headers["X-Thread"]).toBe("ses_abc")
    expect(output.headers["X-Trace"]).toBe("msg_def")
    expect(output.headers["AH-Thread-Id"]).toBeUndefined()
    expect(output.headers["AH-Trace-Id"]).toBeUndefined()
  })

  it("only injects thread header when message id is missing", async () => {
    const hook = await getHeadersHook()
    const output = { headers: {} as Record<string, string> }

    await hook(
      { sessionID: "ses_no_msg" } as any,
      output,
    )

    expect(output.headers["AH-Thread-Id"]).toBe("ses_no_msg")
    expect(output.headers["AH-Trace-Id"]).toBeUndefined()
  })

  it("does not throw when output.headers is missing", async () => {
    const hook = await getHeadersHook()

    await expect(
      hook({ sessionID: "ses_123" } as any, {} as any),
    ).resolves.toBeUndefined()
  })

  it("does not throw when output is undefined", async () => {
    const hook = await getHeadersHook()

    await expect(
      hook({ sessionID: "ses_123" } as any, undefined as any),
    ).resolves.toBeUndefined()
  })

  it("does not throw when input.sessionID is missing", async () => {
    const hook = await getHeadersHook()
    const output = { headers: {} as Record<string, string> }

    await expect(
      hook({} as any, output),
    ).resolves.toBeUndefined()

    expect(Object.keys(output.headers)).toHaveLength(0)
  })

  it("falls back to default keys when env vars are blank", async () => {
    process.env.OPENCODE_AXONHUB_TRACING_THREAD_HEADER = "   "
    process.env.OPENCODE_AXONHUB_TRACING_TRACE_HEADER = ""

    const hook = await getHeadersHook()
    const output = { headers: {} as Record<string, string> }

    await hook(
      { sessionID: "ses_blank", message: { id: "msg_blank" } } as any,
      output,
    )

    expect(output.headers["AH-Thread-Id"]).toBe("ses_blank")
    expect(output.headers["AH-Trace-Id"]).toBe("msg_blank")
  })

  it("only exports default", async () => {
    const mod = await import("./index")
    const namedExports = Object.keys(mod).filter((k) => k !== "default")
    expect(namedExports).toHaveLength(0)
  })
})
