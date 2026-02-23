import { describe, it, expect, beforeEach, vi } from "vitest";

const { execFile } = vi.hoisted(() => ({
  execFile: vi.fn(),
}));

vi.mock("node:child_process", () => ({ execFile, spawn: vi.fn() }));

import { physicalDeviceList } from "../../src/tools/device/list.js";
import { physicalDeviceInstall } from "../../src/tools/device/install.js";
import { physicalDeviceLaunch } from "../../src/tools/device/launch.js";
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

describe("physicalDeviceList", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists connected devices", async () => {
    mockSuccess('{"result":{"devices":[]}}');
    const res = await physicalDeviceList(env);
    expect(res.content[0].text).toContain("devices");
  });

  it("handles devicectl unavailable", async () => {
    mockFailure("devicectl: command not found");
    const res = await physicalDeviceList(env);
    expect(res.isError).toBe(true);
  });
});

describe("physicalDeviceInstall", () => {
  beforeEach(() => vi.clearAllMocks());

  it("installs app on device", async () => {
    mockSuccess("Install succeeded");
    const res = await physicalDeviceInstall({ deviceId: "ABC-123", appPath: "/path/App.app" }, env);
    expect(res.content[0].text).toContain("Install succeeded");
    expect(execFile).toHaveBeenCalledWith(
      "xcrun",
      ["devicectl", "device", "install", "app", "--device", "ABC-123", "/path/App.app"],
      expect.anything(),
      expect.anything(),
    );
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
});
