import { describe, it, expect, beforeEach, vi } from "vitest";

const { execFile, spawn } = vi.hoisted(() => ({
  execFile: vi.fn(),
  spawn: vi.fn(),
}));

vi.mock("node:child_process", () => ({ execFile, spawn }));

import { locationSet } from "../../src/tools/environment/location-set.js";
import { locationClear } from "../../src/tools/environment/location-clear.js";
import { statusBarOverride } from "../../src/tools/environment/status-bar-override.js";
import { statusBarClear } from "../../src/tools/environment/status-bar-clear.js";
import { keyboardInput } from "../../src/tools/environment/keyboard-input.js";
import { pushNotification } from "../../src/tools/environment/push-notification.js";
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

describe("locationSet", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sets GPS coordinates", async () => {
    mockSuccess();
    const res = await locationSet(
      { deviceId: "ABC", latitude: 37.7749, longitude: -122.4194 },
      env,
    );
    expect(res.content[0].text).toContain("37.7749");
    expect(execFile).toHaveBeenCalledWith(
      "xcrun",
      ["simctl", "location", "ABC", "set", "37.7749,-122.4194"],
      expect.anything(),
      expect.anything(),
    );
  });
});

describe("locationClear", () => {
  beforeEach(() => vi.clearAllMocks());

  it("clears location", async () => {
    mockSuccess();
    const res = await locationClear({ deviceId: "ABC" }, env);
    expect(res.content[0].text).toContain("cleared");
  });
});

describe("pushNotification", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects invalid JSON payload", async () => {
    const res = await pushNotification(
      { deviceId: "ABC", bundleId: "com.example.app", payload: "not json" },
      env,
    );
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("Invalid JSON");
  });

  it("sends push notification with valid payload", async () => {
    const EventEmitter = await import("node:events").then((m) => m.EventEmitter);
    const mockChild = Object.assign(new EventEmitter(), {
      stdin: { write: vi.fn(), end: vi.fn() },
      stdout: new EventEmitter(),
      stderr: new EventEmitter(),
    });
    spawn.mockReturnValue(mockChild);

    const promise = pushNotification(
      {
        deviceId: "ABC",
        bundleId: "com.example.app",
        payload: '{"aps":{"alert":"Hello"}}',
      },
      env,
    );

    mockChild.emit("close", 0);
    const res = await promise;
    expect(res.content[0].text).toContain("Push notification sent");
  });
});

describe("statusBarOverride", () => {
  beforeEach(() => vi.clearAllMocks());

  it("overrides status bar", async () => {
    mockSuccess();
    const res = await statusBarOverride(
      {
        deviceId: "ABC",
        time: "9:41",
        batteryLevel: 100,
        wifiBars: 3,
      },
      env,
    );
    expect(res.content[0].text).toContain("overridden");
    expect(execFile).toHaveBeenCalledWith(
      "xcrun",
      expect.arrayContaining(["--time", "9:41", "--batteryLevel", "100", "--wifiBars", "3"]),
      expect.anything(),
      expect.anything(),
    );
  });
});

describe("statusBarClear", () => {
  beforeEach(() => vi.clearAllMocks());

  it("clears status bar", async () => {
    mockSuccess();
    const res = await statusBarClear({ deviceId: "ABC" }, env);
    expect(res.content[0].text).toContain("reset");
  });
});

describe("keyboardInput", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sends keyboard input", async () => {
    mockSuccess();
    const res = await keyboardInput({ deviceId: "ABC", text: "Hello" }, env);
    expect(res.content[0].text).toContain("Hello");
  });
});
