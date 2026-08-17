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

  it("truncates long output keeping head and tail", () => {
    const head = "H".repeat(30_000);
    const middle = "M".repeat(150_000);
    const tail = "T".repeat(70_000);
    const long = head + middle + tail;

    const res = textResponse(long);
    const text = res.content[0].text;
    expect(text).toContain("[output truncated:");
    expect(text.length).toBeLessThan(long.length);
    expect(text.startsWith(head)).toBe(true);
    expect(text.endsWith(tail)).toBe(true);
  });

  it("does not truncate output at or under the limit", () => {
    const exact = "x".repeat(100_000);
    const res = textResponse(exact);
    expect(res.content[0].text).toBe(exact);
  });
});

describe("errorResponse", () => {
  it("creates an error response", () => {
    const res = errorResponse("bad");
    expect(res.content).toEqual([{ type: "text", text: "bad" }]);
    expect(res.isError).toBe(true);
  });

  it("truncates long error text keeping head and tail", () => {
    const head = "H".repeat(30_000);
    const middle = "M".repeat(150_000);
    const tail = "T".repeat(70_000);
    const long = head + middle + tail;

    const res = errorResponse(long);
    const text = res.content[0].text;
    expect(text).toContain("[output truncated:");
    expect(text.startsWith(head)).toBe(true);
    expect(text.endsWith(tail)).toBe(true);
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
      bufferExceeded: false,
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
      bufferExceeded: false,
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
      bufferExceeded: false,
    };
    const res = execResultResponse(result);
    expect(res.content[0].text).toContain("timed out");
    expect(res.isError).toBe(true);
  });

  it("handles bufferExceeded distinctly from timeout", () => {
    const result: ExecResult = {
      success: false,
      stdout: "partial",
      stderr: "",
      exitCode: 1,
      timedOut: false,
      bufferExceeded: true,
    };
    const res = execResultResponse(result);
    expect(res.content[0].text).toContain("10MB buffer limit");
    expect(res.content[0].text).not.toContain("timed out");
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
