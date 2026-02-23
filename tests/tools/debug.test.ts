import { describe, it, expect, beforeEach, vi } from "vitest";

const { execFile } = vi.hoisted(() => ({
  execFile: vi.fn(),
}));

vi.mock("node:child_process", () => ({ execFile, spawn: vi.fn() }));

import { logCollect } from "../../src/tools/debug/log-collect.js";
import { diagnostics } from "../../src/tools/debug/diagnostics.js";
import { accessibilityAudit } from "../../src/tools/debug/accessibility-audit.js";
import { deviceAppearance } from "../../src/tools/debug/device-appearance.js";
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

describe("logCollect", () => {
  beforeEach(() => vi.clearAllMocks());

  it("collects logs with time range", async () => {
    mockSuccess("log entry 1\nlog entry 2");
    const res = await logCollect({ deviceId: "ABC", last: "5m" }, env);
    expect(res.content[0].text).toContain("log entry");
    expect(execFile).toHaveBeenCalledWith(
      "xcrun",
      expect.arrayContaining(["log", "show", "--last", "5m"]),
      expect.anything(),
      expect.anything(),
    );
  });

  it("includes predicate filter", async () => {
    mockSuccess("filtered logs");
    await logCollect({ deviceId: "ABC", predicate: 'subsystem == "com.example"' }, env);
    expect(execFile).toHaveBeenCalledWith(
      "xcrun",
      expect.arrayContaining(["--predicate", 'subsystem == "com.example"']),
      expect.anything(),
      expect.anything(),
    );
  });
});

describe("diagnostics", () => {
  beforeEach(() => vi.clearAllMocks());

  it("collects diagnostics", async () => {
    mockSuccess("Diagnostics collected");
    const res = await diagnostics({}, env);
    expect(res.content[0].text).toContain("Diagnostics");
  });
});

describe("accessibilityAudit", () => {
  beforeEach(() => vi.clearAllMocks());

  it("runs accessibility audit", async () => {
    mockSuccess("No issues found");
    const res = await accessibilityAudit({ deviceId: "ABC" }, env);
    expect(res.content[0].text).toContain("No issues");
  });
});

describe("deviceAppearance", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sets dark mode", async () => {
    mockSuccess();
    const res = await deviceAppearance({ deviceId: "ABC", appearance: "dark" }, env);
    expect(res.content[0].text).toContain("dark");
    expect(execFile).toHaveBeenCalledWith(
      "xcrun",
      ["simctl", "ui", "ABC", "appearance", "dark"],
      expect.anything(),
      expect.anything(),
    );
  });

  it("handles failure", async () => {
    mockFailure();
    const res = await deviceAppearance({ deviceId: "ABC", appearance: "light" }, env);
    expect(res.isError).toBe(true);
  });
});
