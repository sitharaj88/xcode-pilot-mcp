import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, utimesSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join } from "node:path";
import { tmpdir } from "node:os";

const { execFile } = vi.hoisted(() => ({
  execFile: vi.fn(),
}));

vi.mock("node:child_process", () => ({ execFile, spawn: vi.fn() }));

import { swiftlintRun } from "../../src/tools/quality/swiftlint-run.js";
import { swiftlintFix } from "../../src/tools/quality/swiftlint-fix.js";
import { swiftFormatRun } from "../../src/tools/quality/swift-format-run.js";
import { buildWarnings } from "../../src/tools/quality/build-warnings.js";
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

function mockFailure(stderr = "Failed", stdout = "") {
  const error = Object.assign(new Error("fail"), { code: 1 });
  execFile.mockImplementation(
    (_c: string, _a: string[], _o: unknown, cb: (e: Error, o: string, s: string) => void) => {
      cb(error, stdout, stderr);
    },
  );
}

describe("swiftlintRun", () => {
  beforeEach(() => vi.clearAllMocks());

  it("reports violations", async () => {
    const violations = JSON.stringify([
      { file: "test.swift", line: 1, reason: "Trailing whitespace" },
    ]);
    mockSuccess(violations);
    const res = await swiftlintRun({}, env);
    expect(res.content[0].text).toContain("1 violation(s)");
  });

  it("reports no violations", async () => {
    mockSuccess("[]");
    const res = await swiftlintRun({}, env);
    expect(res.content[0].text).toContain("0 violation(s)");
  });

  it("handles swiftlint not installed", async () => {
    mockFailure("command not found: swiftlint");
    const res = await swiftlintRun({}, env);
    expect(res.isError).toBe(true);
  });

  it("includes path and config", async () => {
    mockSuccess("[]");
    await swiftlintRun({ path: "/src", config: "/config/.swiftlint.yml" }, env);
    expect(execFile).toHaveBeenCalledWith(
      "swiftlint",
      expect.arrayContaining(["--path", "/src", "--config", "/config/.swiftlint.yml"]),
      expect.anything(),
      expect.anything(),
    );
  });
});

describe("swiftlintFix", () => {
  beforeEach(() => vi.clearAllMocks());

  it("auto-fixes violations", async () => {
    mockSuccess("Done correcting");
    const res = await swiftlintFix({}, env);
    expect(res.content[0].text).toContain("Done");
  });

  it("treats a non-zero exit with remaining violations as success", async () => {
    mockFailure("", "Correcting Foo.swift\nDone linting! Found 2 violations, 0 serious in 1 file.");
    const res = await swiftlintFix({}, env);
    expect(res.isError).toBeFalsy();
    expect(res.content[0].text).toContain("Done linting");
  });

  it("errors when swiftlint produces no output at all", async () => {
    mockFailure("", "");
    const res = await swiftlintFix({}, env);
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("swiftlint installed");
  });
});

describe("swiftFormatRun", () => {
  beforeEach(() => vi.clearAllMocks());

  it("runs swift-format lint", async () => {
    mockSuccess("no issues found");
    const res = await swiftFormatRun({ path: "/src" }, env);
    expect(res.content[0].text).toContain("no issues");
    expect(execFile).toHaveBeenCalledWith(
      "swift-format",
      ["lint", "--recursive", "/src"],
      expect.anything(),
      expect.anything(),
    );
  });

  it("treats a non-zero exit with violations on stderr as success", async () => {
    mockFailure("Foo.swift:2:11: warning: [Spacing] add 1 space", "");
    const res = await swiftFormatRun({ path: "/src" }, env);
    expect(res.isError).toBeFalsy();
    expect(res.content[0].text).toContain("add 1 space");
  });

  it("errors when swift-format produces no output at all", async () => {
    mockFailure("", "");
    const res = await swiftFormatRun({ path: "/src" }, env);
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("swift-format installed");
  });
});

describe("buildWarnings", () => {
  let tempDir: string;

  beforeEach(() => {
    vi.clearAllMocks();
    tempDir = mkdtempSync(join(tmpdir(), "build-warnings-test-"));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  function makeLog(projectDirName: string, logFileName: string, content: Buffer, mtime: Date) {
    const logsDir = join(tempDir, projectDirName, "Logs", "Build");
    mkdirSync(logsDir, { recursive: true });
    const logPath = join(logsDir, logFileName);
    writeFileSync(logPath, content);
    utimesSync(logPath, mtime, mtime);
    utimesSync(join(tempDir, projectDirName), mtime, mtime);
    return logPath;
  }

  it("errors when DerivedData does not exist", async () => {
    const res = await buildWarnings({ derivedDataPath: join(tempDir, "missing") }, env);
    expect(res.isError).toBe(true);
  });

  it("errors when no build logs are found", async () => {
    mkdirSync(join(tempDir, "Empty-abc"), { recursive: true });
    const res = await buildWarnings({ derivedDataPath: tempDir }, env);
    expect(res.isError).toBe(true);
  });

  it("uses the newest .xcactivitylog by mtime and calls xclogparser --file", async () => {
    const older = new Date(Date.now() - 60_000);
    const newer = new Date();
    makeLog("MyApp-old", "old.xcactivitylog", gzipSync(Buffer.from("old")), older);
    const newestLog = makeLog(
      "MyApp-new",
      "new.xcactivitylog",
      gzipSync(Buffer.from("new")),
      newer,
    );

    mockSuccess("issues json output");
    const res = await buildWarnings({ derivedDataPath: tempDir }, env);

    expect(res.content[0].text).toContain("issues json output");
    expect(execFile).toHaveBeenCalledWith(
      "xcrun",
      ["xclogparser", "parse", "--file", newestLog, "--reporter", "issues"],
      expect.anything(),
      expect.anything(),
    );
  });

  it("falls back to gunzip scanning when xclogparser fails", async () => {
    const now = new Date();
    const raw =
      "note: building\n" +
      "Foo.swift:1:1: warning: unused variable 'x'\n" +
      "Foo.swift:1:1: warning: unused variable 'x'\n" +
      "Bar.swift:2:2: error: missing return\n";
    const logPath = makeLog("MyApp-abc", "build.xcactivitylog", gzipSync(Buffer.from(raw)), now);
    void logPath;

    mockFailure("xclogparser not found", "");
    const res = await buildWarnings({ derivedDataPath: tempDir }, env);

    expect(res.isError).toBeFalsy();
    expect(res.content[0].text).toContain("unused variable 'x'");
    expect(res.content[0].text).toContain("missing return");
    const occurrences = res.content[0].text.split("unused variable 'x'").length - 1;
    expect(occurrences).toBe(1);
  });

  it("reports no warnings when the decompressed log has none", async () => {
    const now = new Date();
    makeLog("MyApp-clean", "build.xcactivitylog", gzipSync(Buffer.from("note: all good\n")), now);

    mockFailure("xclogparser not found", "");
    const res = await buildWarnings({ derivedDataPath: tempDir }, env);
    expect(res.content[0].text).toContain("No build warnings found");
  });
});
