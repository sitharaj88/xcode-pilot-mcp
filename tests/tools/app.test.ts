import { describe, it, expect, beforeEach, vi } from "vitest";

const { execFile } = vi.hoisted(() => ({
  execFile: vi.fn(),
}));

vi.mock("node:child_process", () => ({ execFile, spawn: vi.fn() }));

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
});

describe("appUninstall", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uninstalls an app", async () => {
    mockSuccess();
    const res = await appUninstall({ deviceId: "ABC", bundleId: "com.example.app" }, env);
    expect(res.content[0].text).toContain("uninstalled");
  });
});

describe("appLaunch", () => {
  beforeEach(() => vi.clearAllMocks());

  it("launches an app", async () => {
    mockSuccess("com.example.app: 12345");
    const res = await appLaunch({ deviceId: "ABC", bundleId: "com.example.app" }, env);
    expect(res.content[0].text).toContain("com.example.app");
  });

  it("includes console-pty flag", async () => {
    mockSuccess();
    await appLaunch({ deviceId: "ABC", bundleId: "com.example.app", consolePty: true }, env);
    expect(execFile).toHaveBeenCalledWith(
      "xcrun",
      expect.arrayContaining(["--console-pty"]),
      expect.anything(),
      expect.anything(),
    );
  });
});

describe("appTerminate", () => {
  beforeEach(() => vi.clearAllMocks());

  it("terminates an app", async () => {
    mockSuccess();
    const res = await appTerminate({ deviceId: "ABC", bundleId: "com.example.app" }, env);
    expect(res.content[0].text).toContain("terminated");
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
});

describe("appList", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists installed apps", async () => {
    mockSuccess("com.example.app\ncom.apple.Safari");
    const res = await appList({ deviceId: "ABC" }, env);
    expect(res.content[0].text).toContain("com.example.app");
  });
});

describe("appOpenUrl", () => {
  beforeEach(() => vi.clearAllMocks());

  it("opens a URL", async () => {
    mockSuccess();
    const res = await appOpenUrl({ deviceId: "ABC", url: "https://example.com" }, env);
    expect(res.content[0].text).toContain("https://example.com");
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
});
