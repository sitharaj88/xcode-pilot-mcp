import { describe, it, expect, beforeEach, vi } from "vitest";

const { execFile } = vi.hoisted(() => ({
  execFile: vi.fn(),
}));

vi.mock("node:child_process", () => ({ execFile, spawn: vi.fn() }));

import { signingIdentities } from "../../src/tools/signing/signing-identities.js";
import { profileInspect } from "../../src/tools/signing/profile-inspect.js";
import { keychainList } from "../../src/tools/signing/keychain-list.js";
import { entitlementsCheck } from "../../src/tools/signing/entitlements-check.js";
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

describe("signingIdentities", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists signing identities", async () => {
    mockSuccess('1) ABC123 "Apple Development: dev@example.com"\n1 valid identities found');
    const res = await signingIdentities(env);
    expect(res.content[0].text).toContain("Apple Development");
  });
});

describe("profileInspect", () => {
  beforeEach(() => vi.clearAllMocks());

  it("decodes a profile", async () => {
    mockSuccess("<plist><key>Name</key><string>Dev Profile</string></plist>");
    const res = await profileInspect({ profilePath: "/tmp/profile.mobileprovision" }, env);
    expect(res.content[0].text).toContain("Dev Profile");
  });

  it("validates absolute path", async () => {
    await expect(profileInspect({ profilePath: "relative" }, env)).rejects.toThrow();
  });
});

describe("keychainList", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists keychains", async () => {
    mockSuccess('"/Users/dev/Library/Keychains/login.keychain-db"');
    const res = await keychainList(env);
    expect(res.content[0].text).toContain("login.keychain");
  });
});

describe("entitlementsCheck", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows entitlements", async () => {
    mockSuccess("<key>com.apple.developer.team-identifier</key>");
    const res = await entitlementsCheck({ appPath: "/path/to/App.app" }, env);
    expect(res.content[0].text).toContain("team-identifier");
  });
});
