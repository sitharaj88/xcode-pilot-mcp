import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const { execFile, spawn, homedir } = vi.hoisted(() => ({
  execFile: vi.fn(),
  spawn: vi.fn(),
  homedir: vi.fn(),
}));

vi.mock("node:child_process", () => ({ execFile, spawn }));
vi.mock("node:os", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:os")>();
  return { ...actual, homedir };
});

import { signingIdentities } from "../../src/tools/signing/signing-identities.js";
import { profileInspect } from "../../src/tools/signing/profile-inspect.js";
import { keychainList } from "../../src/tools/signing/keychain-list.js";
import { entitlementsCheck } from "../../src/tools/signing/entitlements-check.js";
import { provisioningProfiles } from "../../src/tools/signing/provisioning-profiles.js";
import type { Environment } from "../../src/types.js";

const env: Environment = {
  xcodePath: "/Applications/Xcode.app/Contents/Developer",
  xcrunPath: "/usr/bin/xcrun",
  xcodebuildPath: "/usr/bin/xcodebuild",
  xcodebuildAvailable: true,
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

  it("shows entitlements using --xml to avoid DER binary output", async () => {
    mockSuccess("<key>com.apple.developer.team-identifier</key>");
    const res = await entitlementsCheck({ appPath: "/path/to/App.app" }, env);
    expect(res.content[0].text).toContain("team-identifier");
    expect(execFile).toHaveBeenCalledWith(
      "codesign",
      ["-d", "--entitlements", "-", "--xml", "/path/to/App.app"],
      expect.anything(),
      expect.anything(),
    );
  });
});

describe("provisioningProfiles", () => {
  let fakeHome: string;

  beforeEach(() => {
    vi.clearAllMocks();
    fakeHome = mkdtempSync(join(tmpdir(), "provisioning-home-"));
    homedir.mockReturnValue(fakeHome);
  });

  afterEach(() => {
    rmSync(fakeHome, { recursive: true, force: true });
  });

  function profilesDirFor(home: string) {
    return join(home, "Library", "MobileDevice", "Provisioning Profiles");
  }

  it("reports no profiles directory when it does not exist", async () => {
    const res = await provisioningProfiles(env);
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("No provisioning profiles directory found");
  });

  it("parses profile fields via security cms + plutil raw extraction", async () => {
    const dir = profilesDirFor(fakeHome);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "test.mobileprovision"), "fake der bytes");

    execFile.mockImplementation(
      (
        command: string,
        _args: string[],
        _o: unknown,
        cb: (e: null, o: string, s: string) => void,
      ) => {
        if (command === "security") {
          cb(null, "<plist><key>Name</key><string>Dev Profile</string></plist>", "");
          return;
        }
      },
    );

    const fieldValues: Record<string, string> = {
      Name: "Dev Profile",
      UUID: "1234-uuid",
      TeamName: "Acme Inc",
      ExpirationDate: "2027-01-01T00:00:00Z",
    };

    const EventEmitter = await import("node:events").then((m) => m.EventEmitter);
    spawn.mockImplementation((_cmd: string, spawnArgs: string[]) => {
      const child = Object.assign(new EventEmitter(), {
        stdin: { write: vi.fn(), end: vi.fn(), on: vi.fn() },
        stdout: new EventEmitter(),
        stderr: new EventEmitter(),
      });
      const field = spawnArgs[1];
      setImmediate(() => {
        child.stdout.emit("data", Buffer.from(`${fieldValues[field] ?? ""}\n`));
        child.emit("close", 0);
      });
      return child;
    });

    const res = await provisioningProfiles(env);
    expect(res.content[0].text).toContain("Dev Profile");
    expect(res.content[0].text).toContain("1234-uuid");
    expect(res.content[0].text).toContain("Acme Inc");
  });

  it("falls back to filename when plutil cannot extract any field", async () => {
    const dir = profilesDirFor(fakeHome);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "broken.mobileprovision"), "fake der bytes");

    execFile.mockImplementation(
      (
        command: string,
        _args: string[],
        _o: unknown,
        cb: (e: null, o: string, s: string) => void,
      ) => {
        if (command === "security") {
          cb(null, "<plist>not useful</plist>", "");
          return;
        }
      },
    );

    const EventEmitter = await import("node:events").then((m) => m.EventEmitter);
    spawn.mockImplementation(() => {
      const child = Object.assign(new EventEmitter(), {
        stdin: { write: vi.fn(), end: vi.fn(), on: vi.fn() },
        stdout: new EventEmitter(),
        stderr: new EventEmitter(),
      });
      setImmediate(() => {
        child.stderr.emit("data", Buffer.from("Could not extract value"));
        child.emit("close", 1);
      });
      return child;
    });

    const res = await provisioningProfiles(env);
    expect(res.content[0].text).toContain("broken.mobileprovision");
    expect(res.content[0].text).toContain("Could not be parsed");
  });
});
