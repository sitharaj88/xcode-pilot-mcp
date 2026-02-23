import { describe, it, expect, beforeEach, vi } from "vitest";

const { execFile } = vi.hoisted(() => ({
  execFile: vi.fn(),
}));

vi.mock("node:child_process", () => ({ execFile, spawn: vi.fn() }));

import { swiftlintRun } from "../../src/tools/quality/swiftlint-run.js";
import { swiftlintFix } from "../../src/tools/quality/swiftlint-fix.js";
import { swiftFormatRun } from "../../src/tools/quality/swift-format-run.js";
import type { Environment } from "../../src/types.js";

const env: Environment = {
  xcodePath: "/Applications/Xcode.app/Contents/Developer",
  xcrunPath: "/usr/bin/xcrun",
  xcodebuildPath: "/usr/bin/xcodebuild",
  simctlAvailable: true,
  devicectlAvailable: true,
};

function mockSuccess(stdout = "") {
  execFile.mockImplementation(
    (_c: string, _a: string[], _o: unknown, cb: (e: null, o: string, s: string) => void) => {
      cb(null, stdout, "");
    },
  );
}

function mockFailure(stderr = "Failed") {
  const error = Object.assign(new Error("fail"), { code: 1 });
  execFile.mockImplementation(
    (_c: string, _a: string[], _o: unknown, cb: (e: Error, o: string, s: string) => void) => {
      cb(error, "", stderr);
    },
  );
}

describe("swiftlintRun", () => {
  beforeEach(() => vi.clearAllMocks());

  it("reports violations", async () => {
    const violations = JSON.stringify([
      { file: "test.swift", line: 1, reason: "Trailing whitespace" },
    ]);
    mockSuccess(violations);
    const res = await swiftlintRun({}, env);
    expect(res.content[0].text).toContain("1 violation(s)");
  });

  it("reports no violations", async () => {
    mockSuccess("[]");
    const res = await swiftlintRun({}, env);
    expect(res.content[0].text).toContain("0 violation(s)");
  });

  it("handles swiftlint not installed", async () => {
    mockFailure("command not found: swiftlint");
    const res = await swiftlintRun({}, env);
    expect(res.isError).toBe(true);
  });

  it("includes path and config", async () => {
    mockSuccess("[]");
    await swiftlintRun({ path: "/src", config: "/config/.swiftlint.yml" }, env);
    expect(execFile).toHaveBeenCalledWith(
      "swiftlint",
      expect.arrayContaining(["--path", "/src", "--config", "/config/.swiftlint.yml"]),
      expect.anything(),
      expect.anything(),
    );
  });
});

describe("swiftlintFix", () => {
  beforeEach(() => vi.clearAllMocks());

  it("auto-fixes violations", async () => {
    mockSuccess("Done correcting");
    const res = await swiftlintFix({}, env);
    expect(res.content[0].text).toContain("Done");
  });
});

describe("swiftFormatRun", () => {
  beforeEach(() => vi.clearAllMocks());

  it("runs swift-format lint", async () => {
    mockSuccess("no issues found");
    const res = await swiftFormatRun({ path: "/src" }, env);
    expect(res.content[0].text).toContain("no issues");
    expect(execFile).toHaveBeenCalledWith(
      "swift-format",
      ["lint", "--recursive", "/src"],
      expect.anything(),
      expect.anything(),
    );
  });
});
