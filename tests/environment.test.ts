import { describe, it, expect, beforeEach, vi } from "vitest";

const { execFile } = vi.hoisted(() => ({
  execFile: vi.fn(),
}));

vi.mock("node:child_process", () => ({
  execFile,
}));

import { detectEnvironment } from "../src/environment.js";

describe("detectEnvironment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("detects environment when Xcode is installed", async () => {
    execFile.mockImplementation(
      (
        cmd: string,
        args: string[],
        _opts: unknown,
        callback: (err: null, stdout: string, stderr: string) => void,
      ) => {
        if (cmd === "xcode-select") {
          callback(null, "/Applications/Xcode.app/Contents/Developer\n", "");
        } else if (cmd === "which" && args[0] === "xcrun") {
          callback(null, "/usr/bin/xcrun\n", "");
        } else if (cmd === "which" && args[0] === "xcodebuild") {
          callback(null, "/usr/bin/xcodebuild\n", "");
        } else if (cmd === "xcrun" && args[0] === "simctl") {
          callback(null, "", "");
        } else if (cmd === "xcrun" && args[0] === "devicectl") {
          callback(null, "", "");
        } else {
          callback(null, "", "");
        }
      },
    );

    const env = await detectEnvironment();
    expect(env.xcodePath).toBe("/Applications/Xcode.app/Contents/Developer");
    expect(env.xcrunPath).toBe("/usr/bin/xcrun");
    expect(env.xcodebuildPath).toBe("/usr/bin/xcodebuild");
    expect(env.simctlAvailable).toBe(true);
    expect(env.devicectlAvailable).toBe(true);
  });

  it("throws when Xcode is not installed", async () => {
    const error = Object.assign(new Error("not found"), { code: 2 });
    execFile.mockImplementation(
      (
        _cmd: string,
        _args: string[],
        _opts: unknown,
        callback: (err: Error, stdout: string, stderr: string) => void,
      ) => {
        callback(error, "", "xcode-select: error");
      },
    );

    await expect(detectEnvironment()).rejects.toThrow("Xcode is not installed");
  });
});
