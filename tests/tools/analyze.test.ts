import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  mkdtempSync,
  mkdirSync,
  rmSync,
  writeFileSync,
  openSync,
  ftruncateSync,
  closeSync,
  cpSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const { execFile } = vi.hoisted(() => ({
  execFile: vi.fn(),
}));

vi.mock("node:child_process", () => ({ execFile, spawn: vi.fn() }));

import { binarySize } from "../../src/tools/analyze/binary-size.js";
import { dsymVerify } from "../../src/tools/analyze/dsym-verify.js";
import { ipaAnalyze } from "../../src/tools/analyze/ipa-analyze.js";
import { ipaPermissions } from "../../src/tools/analyze/ipa-permissions.js";
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

describe("binarySize", () => {
  beforeEach(() => vi.clearAllMocks());

  it("analyzes binary size", async () => {
    mockSuccess("Segment __TEXT: 1024\nSegment __DATA: 512");
    const res = await binarySize({ binaryPath: "/path/to/binary" }, env);
    expect(res.content[0].text).toContain("__TEXT");
  });

  it("validates absolute path", async () => {
    await expect(binarySize({ binaryPath: "relative" }, env)).rejects.toThrow();
  });
});

describe("dsymVerify", () => {
  beforeEach(() => vi.clearAllMocks());

  it("verifies matching UUIDs", async () => {
    execFile.mockImplementation(
      (_c: string, _a: string[], _o: unknown, cb: (e: null, o: string, s: string) => void) => {
        const uuid = "UUID: A1B2C3D4-E5F6-7890-ABCD-EF1234567890 (arm64)";
        cb(null, uuid, "");
      },
    );

    const res = await dsymVerify(
      { dsymPath: "/path/to/App.dSYM", binaryPath: "/path/to/binary" },
      env,
    );
    expect(res.content[0].text).toContain("MATCH");
  });

  it("detects mismatching UUIDs", async () => {
    let calls = 0;
    execFile.mockImplementation(
      (_c: string, _a: string[], _o: unknown, cb: (e: null, o: string, s: string) => void) => {
        calls++;
        if (calls === 1) {
          cb(null, "UUID: AAAA-BBBB (arm64)", "");
        } else {
          cb(null, "UUID: CCCC-DDDD (arm64)", "");
        }
      },
    );

    const res = await dsymVerify(
      { dsymPath: "/path/to/App.dSYM", binaryPath: "/path/to/binary" },
      env,
    );
    expect(res.content[0].text).toContain("MISMATCH");
  });
});

function makeSparseFile(path: string, size: number) {
  const fd = openSync(path, "w");
  ftruncateSync(fd, size);
  closeSync(fd);
}

describe("ipaAnalyze / ipaPermissions size guard", () => {
  let tempDir: string;

  beforeEach(() => {
    vi.clearAllMocks();
    tempDir = mkdtempSync(join(tmpdir(), "ipa-size-test-"));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("ipaAnalyze refuses IPAs over 4GB", async () => {
    const ipaPath = join(tempDir, "Huge.ipa");
    makeSparseFile(ipaPath, 5 * 1024 ** 3);

    const res = await ipaAnalyze({ ipaPath }, env);
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("too large");
    expect(execFile).not.toHaveBeenCalled();
  });

  it("ipaPermissions refuses IPAs over 4GB", async () => {
    const ipaPath = join(tempDir, "Huge.ipa");
    makeSparseFile(ipaPath, 5 * 1024 ** 3);

    const res = await ipaPermissions({ ipaPath }, env);
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("too large");
    expect(execFile).not.toHaveBeenCalled();
  });

  it("ipaAnalyze reports missing files without size guard interference", async () => {
    const res = await ipaAnalyze({ ipaPath: join(tempDir, "Missing.ipa") }, env);
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("not found");
  });
});

describe("ipaPermissions", () => {
  let tempDir: string;

  beforeEach(() => {
    vi.clearAllMocks();
    tempDir = mkdtempSync(join(tmpdir(), "ipa-perms-test-"));
    mkdirSync(join(tempDir, "Payload", "App.app"), { recursive: true });
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("returns a friendly error when plutil output is not valid JSON", async () => {
    const ipaPath = join(tempDir, "App.ipa");
    writeFileSync(ipaPath, "not a real zip");

    execFile.mockImplementation(
      (
        cmd: string,
        cmdArgs: string[],
        _opts: unknown,
        cb: (e: null, o: string, s: string) => void,
      ) => {
        if (cmd === "unzip") {
          const dest = cmdArgs[cmdArgs.indexOf("-d") + 1];
          cpSync(join(tempDir, "Payload"), join(dest, "Payload"), { recursive: true });
          cb(null, "", "");
          return;
        }
        if (cmd === "plutil") {
          cb(null, "{not valid json", "");
          return;
        }
        cb(null, "", "");
      },
    );

    const res = await ipaPermissions({ ipaPath }, env);
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("Failed to parse Info.plist");
  });
});
