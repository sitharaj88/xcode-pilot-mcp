import { describe, it, expect, beforeEach, vi } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const { execFile, spawn } = vi.hoisted(() => ({
  execFile: vi.fn(),
  spawn: vi.fn(),
}));

vi.mock("node:child_process", () => ({ execFile, spawn }));

import { logCollect } from "../../src/tools/debug/log-collect.js";
import { diagnostics } from "../../src/tools/debug/diagnostics.js";
import { deviceAppearance } from "../../src/tools/debug/device-appearance.js";
import { logStream } from "../../src/tools/debug/log-stream.js";
import { screenRecord } from "../../src/tools/debug/screen-record.js";
import type { Environment } from "../../src/types.js";

const env: Environment = {
  xcodePath: "/Applications/Xcode.app/Contents/Developer",
  xcrunPath: "/usr/bin/xcrun",
  xcodebuildPath: "/usr/bin/xcodebuild",
  xcodebuildAvailable: true,
  simctlAvailable: true,
  devicectlAvailable: true,
};

const noSimctlEnv: Environment = { ...env, simctlAvailable: false };

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

  it("guards when simctl is unavailable", async () => {
    const res = await logCollect({ deviceId: "ABC" }, noSimctlEnv);
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("simctl is unavailable");
    expect(execFile).not.toHaveBeenCalled();
  });
});

describe("diagnostics", () => {
  beforeEach(() => vi.clearAllMocks());

  it("collects diagnostics", async () => {
    mockSuccess("Diagnostics collected");
    const res = await diagnostics({}, env);
    expect(res.content[0].text).toContain("Diagnostics");
  });

  it("guards when simctl is unavailable", async () => {
    const res = await diagnostics({}, noSimctlEnv);
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("simctl is unavailable");
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

  it("guards when simctl is unavailable", async () => {
    const res = await deviceAppearance({ deviceId: "ABC", appearance: "dark" }, noSimctlEnv);
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("simctl is unavailable");
  });
});

describe("logStream", () => {
  beforeEach(() => vi.clearAllMocks());

  it("streams logs and SIGINTs after the timeout", async () => {
    vi.useFakeTimers();
    const EventEmitter = await import("node:events").then((m) => m.EventEmitter);
    const mockChild = Object.assign(new EventEmitter(), {
      stdout: new EventEmitter(),
      stderr: new EventEmitter(),
      kill: vi.fn(),
    });
    spawn.mockReturnValue(mockChild);

    const promise = logStream({ deviceId: "ABC", timeout: 5 }, env);
    mockChild.stdout.emit("data", Buffer.from("log line\n"));
    vi.advanceTimersByTime(5000);
    expect(mockChild.kill).toHaveBeenCalledWith("SIGINT");
    mockChild.emit("close", null);

    const res = await promise;
    expect(res.content[0].text).toContain("log line");
    vi.useRealTimers();
  });

  it("escalates to SIGKILL if the process does not close after SIGINT", async () => {
    vi.useFakeTimers();
    const EventEmitter = await import("node:events").then((m) => m.EventEmitter);
    const mockChild = Object.assign(new EventEmitter(), {
      stdout: new EventEmitter(),
      stderr: new EventEmitter(),
      kill: vi.fn(),
    });
    spawn.mockReturnValue(mockChild);

    const promise = logStream({ deviceId: "ABC", timeout: 5 }, env);
    vi.advanceTimersByTime(5000);
    expect(mockChild.kill).toHaveBeenCalledWith("SIGINT");
    vi.advanceTimersByTime(5000);
    expect(mockChild.kill).toHaveBeenCalledWith("SIGKILL");
    mockChild.emit("close", null);

    await promise;
    vi.useRealTimers();
  });

  it("guards when simctl is unavailable", async () => {
    const res = await logStream({ deviceId: "ABC" }, noSimctlEnv);
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("simctl is unavailable");
    expect(spawn).not.toHaveBeenCalled();
  });
});

describe("screenRecord", () => {
  let tempDir: string;

  beforeEach(() => {
    vi.clearAllMocks();
    tempDir = mkdtempSync(join(tmpdir(), "screen-record-test-"));
  });

  it("reports success when the output file exists and has size", async () => {
    const EventEmitter = await import("node:events").then((m) => m.EventEmitter);
    const mockChild = Object.assign(new EventEmitter(), {
      stderr: new EventEmitter(),
      kill: vi.fn(),
    });
    spawn.mockReturnValue(mockChild);

    const outputPath = join(tempDir, "recording.mp4");
    writeFileSync(outputPath, "fake mp4 bytes");

    const promise = screenRecord({ deviceId: "ABC", outputPath, duration: 1 }, env);
    mockChild.emit("close", 0);

    const res = await promise;
    expect(res.isError).toBeUndefined();
    expect(res.content[0].text).toContain(outputPath);

    rmSync(tempDir, { recursive: true, force: true });
  });

  it("errors when the recording produced no usable file", async () => {
    const EventEmitter = await import("node:events").then((m) => m.EventEmitter);
    const mockChild = Object.assign(new EventEmitter(), {
      stderr: new EventEmitter(),
      kill: vi.fn(),
    });
    spawn.mockReturnValue(mockChild);

    const outputPath = join(tempDir, "missing.mp4");

    const promise = screenRecord({ deviceId: "ABC", outputPath, duration: 1 }, env);
    mockChild.emit("close", null);

    const res = await promise;
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("did not produce a usable file");

    rmSync(tempDir, { recursive: true, force: true });
  });

  it("errors when the recording produced an empty file", async () => {
    const EventEmitter = await import("node:events").then((m) => m.EventEmitter);
    const mockChild = Object.assign(new EventEmitter(), {
      stderr: new EventEmitter(),
      kill: vi.fn(),
    });
    spawn.mockReturnValue(mockChild);

    const outputPath = join(tempDir, "empty.mp4");
    writeFileSync(outputPath, "");

    const promise = screenRecord({ deviceId: "ABC", outputPath, duration: 1 }, env);
    mockChild.emit("close", 0);

    const res = await promise;
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("empty file");

    rmSync(tempDir, { recursive: true, force: true });
  });

  it("escalates to SIGKILL if the process does not close after SIGINT", async () => {
    vi.useFakeTimers();
    const EventEmitter = await import("node:events").then((m) => m.EventEmitter);
    const mockChild = Object.assign(new EventEmitter(), {
      stderr: new EventEmitter(),
      kill: vi.fn(),
    });
    spawn.mockReturnValue(mockChild);

    const outputPath = join(tempDir, "recording.mp4");
    const promise = screenRecord({ deviceId: "ABC", outputPath, duration: 1 }, env);

    vi.advanceTimersByTime(1000);
    expect(mockChild.kill).toHaveBeenCalledWith("SIGINT");
    vi.advanceTimersByTime(5000);
    expect(mockChild.kill).toHaveBeenCalledWith("SIGKILL");
    writeFileSync(outputPath, "fake mp4 bytes");
    mockChild.emit("close", null);

    await promise;
    vi.useRealTimers();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("guards when simctl is unavailable", async () => {
    const res = await screenRecord({ deviceId: "ABC" }, noSimctlEnv);
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("simctl is unavailable");
    expect(spawn).not.toHaveBeenCalled();
  });
});
