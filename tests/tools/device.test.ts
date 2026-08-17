import { describe, it, expect, beforeEach, vi } from "vitest";
import { writeFileSync } from "node:fs";

const { execFile, spawn } = vi.hoisted(() => ({
  execFile: vi.fn(),
  spawn: vi.fn(),
}));

vi.mock("node:child_process", () => ({ execFile, spawn }));

import { physicalDeviceList } from "../../src/tools/device/list.js";
import { physicalDeviceInstall } from "../../src/tools/device/install.js";
import { physicalDeviceLaunch } from "../../src/tools/device/launch.js";
import { physicalDeviceConsole } from "../../src/tools/device/console.js";
import type { Environment } from "../../src/types.js";

const env: Environment = {
  xcodePath: "/Applications/Xcode.app/Contents/Developer",
  xcrunPath: "/usr/bin/xcrun",
  xcodebuildPath: "/usr/bin/xcodebuild",
  xcodebuildAvailable: true,
  simctlAvailable: true,
  devicectlAvailable: true,
};

const noDevicectlEnv: Environment = { ...env, devicectlAvailable: false };

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

function mockDeviceListSuccess(json: string) {
  execFile.mockImplementation(
    (_c: string, args: string[], _o: unknown, cb: (e: null, o: string, s: string) => void) => {
      const idx = args.indexOf("--json-output");
      const outputFile = args[idx + 1];
      writeFileSync(outputFile, json);
      cb(null, "", "");
    },
  );
}

describe("physicalDeviceList", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists connected devices via a temp json-output file", async () => {
    mockDeviceListSuccess('{"result":{"devices":[]}}');
    const res = await physicalDeviceList(env);
    expect(res.content[0].text).toContain("devices");
    expect(execFile).toHaveBeenCalledWith(
      "xcrun",
      expect.arrayContaining(["devicectl", "list", "devices", "--json-output"]),
      expect.anything(),
      expect.anything(),
    );
  });

  it("handles devicectl command failure", async () => {
    mockFailure("devicectl: command not found");
    const res = await physicalDeviceList(env);
    expect(res.isError).toBe(true);
  });

  it("handles a missing output file gracefully", async () => {
    mockSuccess("");
    const res = await physicalDeviceList(env);
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("Failed to read device list output");
  });

  it("guards when devicectl is unavailable", async () => {
    const res = await physicalDeviceList(noDevicectlEnv);
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("devicectl is unavailable");
    expect(execFile).not.toHaveBeenCalled();
  });
});

describe("physicalDeviceInstall", () => {
  beforeEach(() => vi.clearAllMocks());

  it("installs app on device with a raised timeout", async () => {
    mockSuccess("Install succeeded");
    const res = await physicalDeviceInstall({ deviceId: "ABC-123", appPath: "/path/App.app" }, env);
    expect(res.content[0].text).toContain("Install succeeded");
    expect(execFile).toHaveBeenCalledWith(
      "xcrun",
      ["devicectl", "device", "install", "app", "--device", "ABC-123", "/path/App.app"],
      expect.objectContaining({ timeout: 300_000 }),
      expect.anything(),
    );
  });

  it("rejects a non-absolute appPath", async () => {
    await expect(
      physicalDeviceInstall({ deviceId: "ABC-123", appPath: "relative/App.app" }, env),
    ).rejects.toThrow();
  });

  it("guards when devicectl is unavailable", async () => {
    const res = await physicalDeviceInstall(
      { deviceId: "ABC-123", appPath: "/path/App.app" },
      noDevicectlEnv,
    );
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("devicectl is unavailable");
  });
});

describe("physicalDeviceLaunch", () => {
  beforeEach(() => vi.clearAllMocks());

  it("launches app on device", async () => {
    mockSuccess("Launched com.example.app");
    const res = await physicalDeviceLaunch(
      { deviceId: "ABC-123", bundleId: "com.example.app" },
      env,
    );
    expect(res.content[0].text).toContain("Launched");
  });

  it("rejects an invalid bundleId", async () => {
    await expect(
      physicalDeviceLaunch({ deviceId: "ABC-123", bundleId: "not a bundle id" }, env),
    ).rejects.toThrow();
  });

  it("guards when devicectl is unavailable", async () => {
    const res = await physicalDeviceLaunch(
      { deviceId: "ABC-123", bundleId: "com.example.app" },
      noDevicectlEnv,
    );
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("devicectl is unavailable");
  });
});

describe("physicalDeviceConsole", () => {
  beforeEach(() => vi.clearAllMocks());

  it("launches the app and streams console output, then SIGINTs after timeout", async () => {
    vi.useFakeTimers();
    const EventEmitter = await import("node:events").then((m) => m.EventEmitter);
    const mockChild = Object.assign(new EventEmitter(), {
      stdout: new EventEmitter(),
      stderr: new EventEmitter(),
      kill: vi.fn(),
    });
    spawn.mockReturnValue(mockChild);

    const promise = physicalDeviceConsole(
      { deviceId: "ABC-123", bundleId: "com.example.app", timeout: 5 },
      env,
    );

    mockChild.stdout.emit("data", Buffer.from("app started\n"));
    vi.advanceTimersByTime(5000);
    expect(mockChild.kill).toHaveBeenCalledWith("SIGINT");
    mockChild.emit("close", null);

    const res = await promise;
    expect(res.isError).toBeUndefined();
    expect(res.content[0].text).toContain("app started");

    vi.useRealTimers();
  });

  it("escalates to SIGKILL if the process does not exit after SIGINT", async () => {
    vi.useFakeTimers();
    const EventEmitter = await import("node:events").then((m) => m.EventEmitter);
    const mockChild = Object.assign(new EventEmitter(), {
      stdout: new EventEmitter(),
      stderr: new EventEmitter(),
      kill: vi.fn(),
    });
    spawn.mockReturnValue(mockChild);

    const promise = physicalDeviceConsole(
      { deviceId: "ABC-123", bundleId: "com.example.app", timeout: 5 },
      env,
    );

    vi.advanceTimersByTime(5000);
    expect(mockChild.kill).toHaveBeenCalledWith("SIGINT");
    vi.advanceTimersByTime(5000);
    expect(mockChild.kill).toHaveBeenCalledWith("SIGKILL");
    mockChild.emit("close", null);

    await promise;
    vi.useRealTimers();
  });

  it("rejects an invalid bundleId", async () => {
    await expect(
      physicalDeviceConsole({ deviceId: "ABC-123", bundleId: "bad id" }, env),
    ).rejects.toThrow();
  });

  it("guards when devicectl is unavailable", async () => {
    const res = await physicalDeviceConsole(
      { deviceId: "ABC-123", bundleId: "com.example.app" },
      noDevicectlEnv,
    );
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("devicectl is unavailable");
    expect(spawn).not.toHaveBeenCalled();
  });
});
