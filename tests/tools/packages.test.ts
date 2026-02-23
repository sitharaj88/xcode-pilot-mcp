import { describe, it, expect, beforeEach, vi } from "vitest";

const { execFile } = vi.hoisted(() => ({
  execFile: vi.fn(),
}));

vi.mock("node:child_process", () => ({ execFile, spawn: vi.fn() }));

import { spmResolve } from "../../src/tools/packages/spm-resolve.js";
import { spmUpdate } from "../../src/tools/packages/spm-update.js";
import { spmShowDependencies } from "../../src/tools/packages/spm-show-dependencies.js";
import { podInstall } from "../../src/tools/packages/pod-install.js";
import { podUpdate } from "../../src/tools/packages/pod-update.js";
import { podOutdated } from "../../src/tools/packages/pod-outdated.js";
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

describe("spmResolve", () => {
  beforeEach(() => vi.clearAllMocks());

  it("resolves dependencies", async () => {
    mockSuccess("Resolved source packages");
    const res = await spmResolve({}, env);
    expect(res.content[0].text).toContain("Resolved");
  });

  it("passes project path", async () => {
    mockSuccess("Resolved");
    await spmResolve({ projectPath: "App.xcworkspace" }, env);
    expect(execFile).toHaveBeenCalledWith(
      "/usr/bin/xcodebuild",
      expect.arrayContaining(["-resolvePackageDependencies", "-workspace", "App.xcworkspace"]),
      expect.anything(),
      expect.anything(),
    );
  });
});

describe("spmUpdate", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates packages", async () => {
    mockSuccess("Updated");
    const res = await spmUpdate({}, env);
    expect(res.content[0].text).toContain("Updated");
    expect(execFile).toHaveBeenCalledWith(
      "swift",
      ["package", "update"],
      expect.anything(),
      expect.anything(),
    );
  });
});

describe("spmShowDependencies", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows dependencies as JSON", async () => {
    mockSuccess('{"name":"MyApp","dependencies":[]}');
    const res = await spmShowDependencies({}, env);
    expect(res.content[0].text).toContain("MyApp");
  });
});

describe("podInstall", () => {
  beforeEach(() => vi.clearAllMocks());

  it("installs pods", async () => {
    mockSuccess("Installing pods");
    const res = await podInstall({}, env);
    expect(res.content[0].text).toContain("Installing");
  });

  it("includes repo-update flag", async () => {
    mockSuccess("done");
    await podInstall({ repoUpdate: true }, env);
    expect(execFile).toHaveBeenCalledWith(
      "pod",
      ["install", "--repo-update"],
      expect.anything(),
      expect.anything(),
    );
  });
});

describe("podUpdate", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates all pods", async () => {
    mockSuccess("Updated");
    const res = await podUpdate({}, env);
    expect(res.content[0].text).toContain("Updated");
  });

  it("updates specific pod", async () => {
    mockSuccess("Updated Alamofire");
    await podUpdate({ podName: "Alamofire" }, env);
    expect(execFile).toHaveBeenCalledWith(
      "pod",
      ["update", "Alamofire"],
      expect.anything(),
      expect.anything(),
    );
  });
});

describe("podOutdated", () => {
  beforeEach(() => vi.clearAllMocks());

  it("checks outdated pods", async () => {
    mockSuccess("The following pod updates are available:");
    const res = await podOutdated({}, env);
    expect(res.content[0].text).toContain("updates");
  });
});
