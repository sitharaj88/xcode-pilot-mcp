import { describe, it, expect, beforeEach, vi } from "vitest";

const { execFile } = vi.hoisted(() => ({
  execFile: vi.fn(),
}));

vi.mock("node:child_process", () => ({ execFile, spawn: vi.fn() }));

import { binarySize } from "../../src/tools/analyze/binary-size.js";
import { dsymVerify } from "../../src/tools/analyze/dsym-verify.js";
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
