import { describe, it, expect, beforeEach, vi } from "vitest";

const { execFile } = vi.hoisted(() => ({
  execFile: vi.fn(),
}));

vi.mock("node:child_process", () => ({ execFile, spawn: vi.fn() }));

import { simulatorList } from "../../src/tools/simulator/list.js";
import { simulatorCreate } from "../../src/tools/simulator/create.js";
import { simulatorBoot } from "../../src/tools/simulator/boot.js";
import { simulatorShutdown } from "../../src/tools/simulator/shutdown.js";
import { simulatorDelete } from "../../src/tools/simulator/delete.js";
import { simulatorErase } from "../../src/tools/simulator/erase.js";
import { simulatorOpen } from "../../src/tools/simulator/open.js";
import { simulatorListRuntimes } from "../../src/tools/simulator/list-runtimes.js";
import { simulatorListDeviceTypes } from "../../src/tools/simulator/list-device-types.js";
import { simulatorClone } from "../../src/tools/simulator/clone.js";
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

describe("simulatorList", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists devices from JSON output", async () => {
    const json = JSON.stringify({
      devices: {
        "com.apple.CoreSimulator.SimRuntime.iOS-18-0": [
          { name: "iPhone 16", udid: "ABC-123", state: "Booted" },
        ],
      },
    });
    mockSuccess(json);
    const res = await simulatorList({}, env);
    expect(res.content[0].text).toContain("iPhone 16");
  });

  it("filters by state", async () => {
    const json = JSON.stringify({
      devices: {
        "iOS-18": [
          { name: "iPhone 16", state: "Booted" },
          { name: "iPhone 15", state: "Shutdown" },
        ],
      },
    });
    mockSuccess(json);
    const res = await simulatorList({ state: "Booted" }, env);
    expect(res.content[0].text).toContain("iPhone 16");
    expect(res.content[0].text).not.toContain("iPhone 15");
  });
});

describe("simulatorCreate", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a simulator and returns UDID", async () => {
    mockSuccess("ABC-123-DEF\n");
    const res = await simulatorCreate(
      {
        name: "Test iPhone",
        deviceTypeId: "com.apple.CoreSimulator.SimDeviceType.iPhone-16",
        runtimeId: "com.apple.CoreSimulator.SimRuntime.iOS-18-0",
      },
      env,
    );
    expect(res.content[0].text).toContain("ABC-123-DEF");
    expect(res.content[0].text).toContain("Test iPhone");
  });
});

describe("simulatorBoot", () => {
  beforeEach(() => vi.clearAllMocks());

  it("boots a simulator", async () => {
    mockSuccess();
    const res = await simulatorBoot({ deviceId: "ABC-123" }, env);
    expect(res.content[0].text).toContain("booted successfully");
  });

  it("handles already booted", async () => {
    mockFailure("current state: Booted");
    const res = await simulatorBoot({ deviceId: "ABC-123" }, env);
    expect(res.content[0].text).toContain("already booted");
  });
});

describe("simulatorShutdown", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shuts down all by default", async () => {
    mockSuccess();
    const res = await simulatorShutdown({}, env);
    expect(res.content[0].text).toContain("all");
    expect(execFile).toHaveBeenCalledWith(
      "xcrun",
      ["simctl", "shutdown", "all"],
      expect.anything(),
      expect.anything(),
    );
  });
});

describe("simulatorDelete", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes a simulator", async () => {
    mockSuccess();
    const res = await simulatorDelete({ deviceId: "ABC-123" }, env);
    expect(res.content[0].text).toContain("deleted");
  });
});

describe("simulatorErase", () => {
  beforeEach(() => vi.clearAllMocks());

  it("erases a simulator", async () => {
    mockSuccess();
    const res = await simulatorErase({ deviceId: "ABC-123" }, env);
    expect(res.content[0].text).toContain("erased");
  });
});

describe("simulatorOpen", () => {
  beforeEach(() => vi.clearAllMocks());

  it("opens Simulator.app", async () => {
    mockSuccess();
    const res = await simulatorOpen({ deviceId: "ABC-123" }, env);
    expect(res.content[0].text).toContain("opened");
    expect(execFile).toHaveBeenCalledWith(
      "open",
      ["-a", "Simulator", "--args", "-CurrentDeviceUDID", "ABC-123"],
      expect.anything(),
      expect.anything(),
    );
  });
});

describe("simulatorListRuntimes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists runtimes", async () => {
    mockSuccess('{"runtimes": []}');
    const res = await simulatorListRuntimes(env);
    expect(res.content[0].text).toContain("runtimes");
  });
});

describe("simulatorListDeviceTypes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists device types", async () => {
    mockSuccess('{"devicetypes": []}');
    const res = await simulatorListDeviceTypes(env);
    expect(res.content[0].text).toContain("devicetypes");
  });
});

describe("simulatorClone", () => {
  beforeEach(() => vi.clearAllMocks());

  it("clones a simulator", async () => {
    mockSuccess("NEW-UDID-456\n");
    const res = await simulatorClone({ deviceId: "ABC-123", newName: "Clone" }, env);
    expect(res.content[0].text).toContain("NEW-UDID-456");
    expect(res.content[0].text).toContain("Clone");
  });
});
