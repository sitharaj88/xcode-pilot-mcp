import { describe, it, expect, beforeEach, vi } from "vitest";

const { execFile, spawn } = vi.hoisted(() => ({
  execFile: vi.fn(),
  spawn: vi.fn(),
}));

vi.mock("node:child_process", () => ({
  execFile,
  spawn,
}));

import { executeCommand, spawnDetached, executeCommandWithStdin } from "../src/executor.js";

describe("executeCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns success with stdout on successful execution", async () => {
    execFile.mockImplementation(
      (
        _cmd: string,
        _args: string[],
        _opts: unknown,
        callback: (err: null, stdout: string, stderr: string) => void,
      ) => {
        callback(null, "output", "");
      },
    );

    const result = await executeCommand("ls", ["-la"]);
    expect(result.success).toBe(true);
    expect(result.stdout).toBe("output");
    expect(result.stderr).toBe("");
    expect(result.exitCode).toBe(0);
    expect(result.timedOut).toBe(false);
  });

  it("returns failure with stderr on command error", async () => {
    const error = Object.assign(new Error("Command failed"), { code: 1 });
    execFile.mockImplementation(
      (
        _cmd: string,
        _args: string[],
        _opts: unknown,
        callback: (err: Error, stdout: string, stderr: string) => void,
      ) => {
        callback(error, "", "error output");
      },
    );

    const result = await executeCommand("badcmd", []);
    expect(result.success).toBe(false);
    expect(result.stderr).toBe("error output");
    expect(result.exitCode).toBe(1);
  });

  it("detects timeout via SIGTERM", async () => {
    const error = Object.assign(new Error("SIGTERM"), {
      signal: "SIGTERM",
      killed: true,
    });
    execFile.mockImplementation(
      (
        _cmd: string,
        _args: string[],
        _opts: unknown,
        callback: (err: Error, stdout: string, stderr: string) => void,
      ) => {
        callback(error, "", "");
      },
    );

    const result = await executeCommand("slowcmd", []);
    expect(result.timedOut).toBe(true);
    expect(result.success).toBe(false);
  });

  it("passes options correctly", async () => {
    execFile.mockImplementation(
      (
        _cmd: string,
        _args: string[],
        opts: { timeout?: number; cwd?: string },
        callback: (err: null, stdout: string, stderr: string) => void,
      ) => {
        expect(opts.timeout).toBe(5000);
        expect(opts.cwd).toBe("/tmp");
        callback(null, "ok", "");
      },
    );

    await executeCommand("ls", [], { timeout: 5000, cwd: "/tmp" });
    expect(execFile).toHaveBeenCalledTimes(1);
  });
});

describe("spawnDetached", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("spawns a detached process", () => {
    const mockChild = { unref: vi.fn() };
    spawn.mockReturnValue(mockChild);

    const child = spawnDetached("xcrun", ["simctl", "io"]);
    expect(spawn).toHaveBeenCalledWith(
      "xcrun",
      ["simctl", "io"],
      expect.objectContaining({
        detached: true,
        stdio: "ignore",
      }),
    );
    expect(mockChild.unref).toHaveBeenCalled();
    expect(child).toBe(mockChild);
  });
});

describe("executeCommandWithStdin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("writes data to stdin and returns result", async () => {
    const EventEmitter = await import("node:events").then((m) => m.EventEmitter);
    const mockChild = Object.assign(new EventEmitter(), {
      stdin: { write: vi.fn(), end: vi.fn() },
      stdout: new EventEmitter(),
      stderr: new EventEmitter(),
    });
    spawn.mockReturnValue(mockChild);

    const promise = executeCommandWithStdin("xcrun", ["simctl", "push"], '{"aps":{}}');

    mockChild.stdout.emit("data", Buffer.from("success"));
    mockChild.emit("close", 0);

    const result = await promise;
    expect(result.success).toBe(true);
    expect(result.stdout).toBe("success");
    expect(mockChild.stdin.write).toHaveBeenCalledWith('{"aps":{}}');
    expect(mockChild.stdin.end).toHaveBeenCalled();
  });
});
