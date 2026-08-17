import { describe, it, expect, beforeEach, vi } from "vitest";

const { execFile, spawn } = vi.hoisted(() => ({
  execFile: vi.fn(),
  spawn: vi.fn(),
}));

vi.mock("node:child_process", () => ({ execFile, spawn }));

import { appInstall } from "../../src/tools/app/install.js";
import { appUninstall } from "../../src/tools/app/uninstall.js";
import { appLaunch } from "../../src/tools/app/launch.js";
import { appTerminate } from "../../src/tools/app/terminate.js";
import { appGetContainer } from "../../src/tools/app/get-container.js";
import { appList } from "../../src/tools/app/list.js";
import { appOpenUrl } from "../../src/tools/app/open-url.js";
import { appPrivacy } from "../../src/tools/app/privacy.js";
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

describe("appInstall", () => {
  beforeEach(() => vi.clearAllMocks());

  it("installs an app", async () => {
    mockSuccess();
    const res = await appInstall({ deviceId: "ABC", appPath: "/path/to/App.app" }, env);
    expect(res.content[0].text).toContain("installed successfully");
  });

  it("reports failure", async () => {
    mockFailure();
    const res = await appInstall({ deviceId: "ABC", appPath: "/bad" }, env);
    expect(res.isError).toBe(true);
  });

  it("guards when simctl is unavailable", async () => {
    const res = await appInstall({ deviceId: "ABC", appPath: "/path/to/App.app" }, noSimctlEnv);
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("simctl is unavailable");
  });
});

describe("appUninstall", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uninstalls an app", async () => {
    mockSuccess();
    const res = await appUninstall({ deviceId: "ABC", bundleId: "com.example.app" }, env);
    expect(res.content[0].text).toContain("uninstalled");
  });

  it("rejects an invalid bundleId", async () => {
    await expect(
      appUninstall({ deviceId: "ABC", bundleId: "not a bundle id" }, env),
    ).rejects.toThrow();
  });

  it("guards when simctl is unavailable", async () => {
    const res = await appUninstall({ deviceId: "ABC", bundleId: "com.example.app" }, noSimctlEnv);
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("simctl is unavailable");
  });
});

describe("appLaunch", () => {
  beforeEach(() => vi.clearAllMocks());

  it("launches an app", async () => {
    mockSuccess("com.example.app: 12345");
    const res = await appLaunch({ deviceId: "ABC", bundleId: "com.example.app" }, env);
    expect(res.content[0].text).toContain("com.example.app");
  });

  it("rejects an invalid bundleId", async () => {
    await expect(
      appLaunch({ deviceId: "ABC", bundleId: "not a bundle id" }, env),
    ).rejects.toThrow();
  });

  it("guards when simctl is unavailable", async () => {
    const res = await appLaunch({ deviceId: "ABC", bundleId: "com.example.app" }, noSimctlEnv);
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("simctl is unavailable");
  });

  describe("with consolePty", () => {
    it("captures console output via spawn and SIGINTs after the timeout", async () => {
      vi.useFakeTimers();
      const EventEmitter = await import("node:events").then((m) => m.EventEmitter);
      const mockChild = Object.assign(new EventEmitter(), {
        stdout: new EventEmitter(),
        stderr: new EventEmitter(),
        kill: vi.fn(),
      });
      spawn.mockReturnValue(mockChild);

      const promise = appLaunch(
        { deviceId: "ABC", bundleId: "com.example.app", consolePty: true, timeout: 5 },
        env,
      );

      expect(spawn).toHaveBeenCalledWith(
        "xcrun",
        expect.arrayContaining(["--console-pty", "ABC", "com.example.app"]),
      );

      mockChild.stdout.emit("data", Buffer.from("console line\n"));
      vi.advanceTimersByTime(5000);
      expect(mockChild.kill).toHaveBeenCalledWith("SIGINT");
      mockChild.emit("close", null);

      const res = await promise;
      expect(res.isError).toBeUndefined();
      expect(res.content[0].text).toContain("console line");
      expect(res.content[0].text).toContain("stopped after 5s");

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

      const promise = appLaunch(
        { deviceId: "ABC", bundleId: "com.example.app", consolePty: true, timeout: 5 },
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
  });
});

describe("appTerminate", () => {
  beforeEach(() => vi.clearAllMocks());

  it("terminates an app", async () => {
    mockSuccess();
    const res = await appTerminate({ deviceId: "ABC", bundleId: "com.example.app" }, env);
    expect(res.content[0].text).toContain("terminated");
  });

  it("rejects an invalid bundleId", async () => {
    await expect(
      appTerminate({ deviceId: "ABC", bundleId: "not a bundle id" }, env),
    ).rejects.toThrow();
  });

  it("guards when simctl is unavailable", async () => {
    const res = await appTerminate({ deviceId: "ABC", bundleId: "com.example.app" }, noSimctlEnv);
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("simctl is unavailable");
  });
});

describe("appGetContainer", () => {
  beforeEach(() => vi.clearAllMocks());

  it("gets app container path", async () => {
    mockSuccess("/path/to/container\n");
    const res = await appGetContainer({ deviceId: "ABC", bundleId: "com.example.app" }, env);
    expect(res.content[0].text).toBe("/path/to/container");
  });

  it("gets data container", async () => {
    mockSuccess("/data/path\n");
    await appGetContainer({ deviceId: "ABC", bundleId: "com.example.app", container: "data" }, env);
    expect(execFile).toHaveBeenCalledWith(
      "xcrun",
      expect.arrayContaining(["data"]),
      expect.anything(),
      expect.anything(),
    );
  });

  it("rejects an invalid bundleId", async () => {
    await expect(
      appGetContainer({ deviceId: "ABC", bundleId: "not a bundle id" }, env),
    ).rejects.toThrow();
  });

  it("guards when simctl is unavailable", async () => {
    const res = await appGetContainer(
      { deviceId: "ABC", bundleId: "com.example.app" },
      noSimctlEnv,
    );
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("simctl is unavailable");
  });
});

describe("appList", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists installed apps", async () => {
    mockSuccess("com.example.app\ncom.apple.Safari");
    const res = await appList({ deviceId: "ABC" }, env);
    expect(res.content[0].text).toContain("com.example.app");
  });

  it("guards when simctl is unavailable", async () => {
    const res = await appList({ deviceId: "ABC" }, noSimctlEnv);
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("simctl is unavailable");
  });
});

describe("appOpenUrl", () => {
  beforeEach(() => vi.clearAllMocks());

  it("opens a URL", async () => {
    mockSuccess();
    const res = await appOpenUrl({ deviceId: "ABC", url: "https://example.com" }, env);
    expect(res.content[0].text).toContain("https://example.com");
  });

  it("guards when simctl is unavailable", async () => {
    const res = await appOpenUrl({ deviceId: "ABC", url: "https://example.com" }, noSimctlEnv);
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("simctl is unavailable");
  });
});

describe("appPrivacy", () => {
  beforeEach(() => vi.clearAllMocks());

  it("grants permission", async () => {
    mockSuccess();
    const res = await appPrivacy(
      {
        deviceId: "ABC",
        action: "grant",
        service: "camera",
        bundleId: "com.example.app",
      },
      env,
    );
    expect(res.content[0].text).toContain("grant");
    expect(res.content[0].text).toContain("camera");
  });

  it("requires bundleId for grant", async () => {
    const res = await appPrivacy({ deviceId: "ABC", action: "grant", service: "camera" }, env);
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("bundleId is required");
  });

  it("rejects an invalid bundleId when provided", async () => {
    await expect(
      appPrivacy(
        { deviceId: "ABC", action: "grant", service: "camera", bundleId: "not a bundle id" },
        env,
      ),
    ).rejects.toThrow();
  });

  it("guards when simctl is unavailable", async () => {
    const res = await appPrivacy({ deviceId: "ABC", action: "reset", service: "all" }, noSimctlEnv);
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("simctl is unavailable");
  });
});
