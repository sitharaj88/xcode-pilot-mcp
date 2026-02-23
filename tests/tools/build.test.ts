import { describe, it, expect, beforeEach, vi } from "vitest";

const { execFile } = vi.hoisted(() => ({
  execFile: vi.fn(),
}));

vi.mock("node:child_process", () => ({ execFile, spawn: vi.fn() }));

import { xcodeBuild } from "../../src/tools/build/build.js";
import { xcodeClean } from "../../src/tools/build/clean.js";
import { xcodeArchive } from "../../src/tools/build/archive.js";
import { xcodeExport } from "../../src/tools/build/export.js";
import { xcodeTest, xcodeTestWithoutBuilding } from "../../src/tools/build/test.js";
import { xcodeList } from "../../src/tools/build/list.js";
import { xcodeBuildSettings } from "../../src/tools/build/build-settings.js";
import { resolveProjectArgs } from "../../src/tools/build/build-utils.js";
import type { Environment } from "../../src/types.js";

const env: Environment = {
  xcodePath: "/Applications/Xcode.app/Contents/Developer",
  xcrunPath: "/usr/bin/xcrun",
  xcodebuildPath: "/usr/bin/xcodebuild",
  simctlAvailable: true,
  devicectlAvailable: true,
};

function mockSuccess(stdout = "Build Succeeded") {
  execFile.mockImplementation(
    (_c: string, _a: string[], _o: unknown, cb: (e: null, o: string, s: string) => void) => {
      cb(null, stdout, "");
    },
  );
}

function mockFailure(stderr = "Build Failed") {
  const error = Object.assign(new Error("fail"), { code: 65 });
  execFile.mockImplementation(
    (_c: string, _a: string[], _o: unknown, cb: (e: Error, o: string, s: string) => void) => {
      cb(error, "", stderr);
    },
  );
}

describe("resolveProjectArgs", () => {
  it("returns empty for no path", () => {
    expect(resolveProjectArgs()).toEqual([]);
  });

  it("uses -workspace for .xcworkspace", () => {
    expect(resolveProjectArgs("App.xcworkspace")).toEqual(["-workspace", "App.xcworkspace"]);
  });

  it("uses -project for .xcodeproj", () => {
    expect(resolveProjectArgs("App.xcodeproj")).toEqual(["-project", "App.xcodeproj"]);
  });
});

describe("xcodeBuild", () => {
  beforeEach(() => vi.clearAllMocks());

  it("builds with required params", async () => {
    mockSuccess();
    const res = await xcodeBuild({ scheme: "MyApp" }, env);
    expect(res.content[0].text).toContain("Build Succeeded");
    expect(execFile).toHaveBeenCalledWith(
      "/usr/bin/xcodebuild",
      expect.arrayContaining(["build", "-scheme", "MyApp"]),
      expect.anything(),
      expect.anything(),
    );
  });

  it("includes optional params", async () => {
    mockSuccess();
    await xcodeBuild(
      {
        scheme: "MyApp",
        projectPath: "App.xcworkspace",
        configuration: "Release",
        destination: "platform=iOS Simulator",
        sdk: "iphonesimulator",
      },
      env,
    );
    expect(execFile).toHaveBeenCalledWith(
      "/usr/bin/xcodebuild",
      expect.arrayContaining([
        "-workspace",
        "App.xcworkspace",
        "-configuration",
        "Release",
        "-destination",
        "platform=iOS Simulator",
        "-sdk",
        "iphonesimulator",
      ]),
      expect.anything(),
      expect.anything(),
    );
  });

  it("handles build failure", async () => {
    mockFailure();
    const res = await xcodeBuild({ scheme: "MyApp" }, env);
    expect(res.isError).toBe(true);
  });
});

describe("xcodeClean", () => {
  beforeEach(() => vi.clearAllMocks());

  it("cleans the project", async () => {
    mockSuccess("Clean Succeeded");
    const res = await xcodeClean({ scheme: "MyApp" }, env);
    expect(res.content[0].text).toContain("Clean Succeeded");
  });
});

describe("xcodeArchive", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates an archive", async () => {
    mockSuccess("Archive Succeeded");
    const res = await xcodeArchive({ scheme: "MyApp", archivePath: "/tmp/MyApp.xcarchive" }, env);
    expect(res.content[0].text).toContain("Archive Succeeded");
    expect(execFile).toHaveBeenCalledWith(
      "/usr/bin/xcodebuild",
      expect.arrayContaining(["archive", "-archivePath", "/tmp/MyApp.xcarchive"]),
      expect.anything(),
      expect.anything(),
    );
  });
});

describe("xcodeExport", () => {
  beforeEach(() => vi.clearAllMocks());

  it("exports from archive", async () => {
    mockSuccess("Export Succeeded");
    const res = await xcodeExport(
      {
        archivePath: "/tmp/MyApp.xcarchive",
        exportPath: "/tmp/export",
        exportOptionsPlist: "/tmp/options.plist",
      },
      env,
    );
    expect(res.content[0].text).toContain("Export Succeeded");
  });
});

describe("xcodeTest", () => {
  beforeEach(() => vi.clearAllMocks());

  it("runs tests", async () => {
    mockSuccess("Test Succeeded");
    const res = await xcodeTest(
      { scheme: "MyApp", destination: "platform=iOS Simulator,name=iPhone 16" },
      env,
    );
    expect(res.content[0].text).toContain("Test Succeeded");
  });

  it("includes test filtering", async () => {
    mockSuccess();
    await xcodeTest(
      {
        scheme: "MyApp",
        destination: "platform=iOS Simulator",
        onlyTesting: ["MyAppTests/LoginTests"],
        skipTesting: ["MyAppTests/SlowTests"],
      },
      env,
    );
    expect(execFile).toHaveBeenCalledWith(
      "/usr/bin/xcodebuild",
      expect.arrayContaining([
        "-only-testing:MyAppTests/LoginTests",
        "-skip-testing:MyAppTests/SlowTests",
      ]),
      expect.anything(),
      expect.anything(),
    );
  });
});

describe("xcodeTestWithoutBuilding", () => {
  beforeEach(() => vi.clearAllMocks());

  it("runs test-without-building", async () => {
    mockSuccess();
    const res = await xcodeTestWithoutBuilding(
      { scheme: "MyApp", destination: "platform=iOS Simulator" },
      env,
    );
    expect(execFile).toHaveBeenCalledWith(
      "/usr/bin/xcodebuild",
      expect.arrayContaining(["test-without-building"]),
      expect.anything(),
      expect.anything(),
    );
    expect(res.content[0].text).toBeDefined();
  });
});

describe("xcodeList", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists schemes", async () => {
    mockSuccess("Schemes:\n  MyApp\n  MyAppTests");
    const res = await xcodeList({}, env);
    expect(res.content[0].text).toContain("MyApp");
  });
});

describe("xcodeBuildSettings", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows build settings", async () => {
    mockSuccess("PRODUCT_NAME = MyApp");
    const res = await xcodeBuildSettings({ scheme: "MyApp" }, env);
    expect(res.content[0].text).toContain("PRODUCT_NAME");
  });
});
