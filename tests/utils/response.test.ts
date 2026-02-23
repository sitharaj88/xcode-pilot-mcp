import { describe, it, expect } from "vitest";
import {
  textResponse,
  errorResponse,
  execResultResponse,
  withErrorHandling,
} from "../../src/utils/response.js";
import type { ExecResult } from "../../src/types.js";

describe("textResponse", () => {
  it("creates a text response", () => {
    const res = textResponse("hello");
    expect(res.content).toEqual([{ type: "text", text: "hello" }]);
    expect(res.isError).toBeUndefined();
  });

  it("truncates long output", () => {
    const long = "x".repeat(200_000);
    const res = textResponse(long);
    expect(res.content[0].text).toContain("... [output truncated]");
    expect(res.content[0].text.length).toBeLessThan(200_000);
  });
});

describe("errorResponse", () => {
  it("creates an error response", () => {
    const res = errorResponse("bad");
    expect(res.content).toEqual([{ type: "text", text: "bad" }]);
    expect(res.isError).toBe(true);
  });
});

describe("execResultResponse", () => {
  it("handles successful result", () => {
    const result: ExecResult = {
      success: true,
      stdout: "output",
      stderr: "",
      exitCode: 0,
      timedOut: false,
    };
    const res = execResultResponse(result);
    expect(res.content[0].text).toBe("output");
    expect(res.isError).toBeUndefined();
  });

  it("handles failed result", () => {
    const result: ExecResult = {
      success: false,
      stdout: "",
      stderr: "error msg",
      exitCode: 1,
      timedOut: false,
    };
    const res = execResultResponse(result);
    expect(res.content[0].text).toBe("error msg");
    expect(res.isError).toBe(true);
  });

  it("handles timeout", () => {
    const result: ExecResult = {
      success: false,
      stdout: "partial",
      stderr: "",
      exitCode: 1,
      timedOut: true,
    };
    const res = execResultResponse(result);
    expect(res.content[0].text).toContain("timed out");
    expect(res.isError).toBe(true);
  });
});

describe("withErrorHandling", () => {
  it("passes through successful results", async () => {
    const handler = withErrorHandling(async () => textResponse("ok"));
    const res = await handler({});
    expect(res.content[0].text).toBe("ok");
  });

  it("catches errors and returns error response", async () => {
    const handler = withErrorHandling(async () => {
      throw new Error("test error");
    });
    const res = await handler({});
    expect(res.content[0].text).toContain("test error");
    expect(res.isError).toBe(true);
  });
});
