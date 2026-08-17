import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, mkdirSync, rmSync, existsSync, readFileSync } from "node:fs";
import { join, basename } from "node:path";
import { tmpdir } from "node:os";

const { execFile } = vi.hoisted(() => ({
  execFile: vi.fn(),
}));

vi.mock("node:child_process", () => ({ execFile, spawn: vi.fn() }));

import { createProject } from "../../src/tools/scaffold/create-project.js";
import { scaffoldView } from "../../src/tools/scaffold/scaffold-view.js";
import { scaffoldViewModel } from "../../src/tools/scaffold/scaffold-viewmodel.js";
import { scaffoldCoreDataModel } from "../../src/tools/scaffold/scaffold-coredata-model.js";
import { scaffoldWidget } from "../../src/tools/scaffold/scaffold-widget.js";
import type { Environment } from "../../src/types.js";

const env: Environment = {
  xcodePath: "/Applications/Xcode.app/Contents/Developer",
  xcrunPath: "/usr/bin/xcrun",
  xcodebuildPath: "/usr/bin/xcodebuild",
  simctlAvailable: true,
  devicectlAvailable: true,
};

type ExecCb = (e: (Error & { code?: number }) | null, o: string, s: string) => void;

function mockXcodegenMissing() {
  execFile.mockImplementation((_cmd: string, _args: string[], _opts: unknown, cb: ExecCb) => {
    cb(Object.assign(new Error("not found"), { code: 1 }), "", "xcodegen not found");
  });
}

function mockXcodegenAvailable(options: { generateSucceeds?: boolean } = {}) {
  const generateSucceeds = options.generateSucceeds !== false;
  execFile.mockImplementation(
    (cmd: string, args: string[], opts: { cwd?: string } | undefined, cb: ExecCb) => {
      if (cmd === "which") {
        cb(null, "/opt/homebrew/bin/xcodegen\n", "");
        return;
      }
      if (cmd === "xcodegen" && args[0] === "generate") {
        if (generateSucceeds && opts?.cwd) {
          const projectName = basename(opts.cwd);
          mkdirSync(join(opts.cwd, `${projectName}.xcodeproj`), { recursive: true });
          cb(null, "Generated project", "");
        } else {
          cb(Object.assign(new Error("generate failed"), { code: 1 }), "", "spec invalid");
        }
        return;
      }
      cb(Object.assign(new Error("unexpected command")), "", "");
    },
  );
}

let tempDir: string;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "scaffold-test-"));
  mockXcodegenMissing();
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
  vi.clearAllMocks();
});

describe("createProject", () => {
  it("creates a SwiftUI project with a project.yml when xcodegen is unavailable", async () => {
    const res = await createProject(
      { name: "TestApp", template: "swiftui", platform: "ios", outputPath: tempDir },
      env,
    );
    expect(res.content[0].text).toContain("TestApp");
    expect(res.content[0].text).toContain("brew install xcodegen");
    expect(existsSync(join(tempDir, "TestApp", "project.yml"))).toBe(true);
    expect(existsSync(join(tempDir, "TestApp", "Sources", "TestApp", "ContentView.swift"))).toBe(
      true,
    );
    const yaml = readFileSync(join(tempDir, "TestApp", "project.yml"), "utf-8");
    expect(yaml).toContain("platform: iOS");
    expect(yaml).toContain("type: application");
  });

  it("creates a UIKit project", async () => {
    const res = await createProject(
      { name: "UIKitApp", template: "uikit", platform: "ios", outputPath: tempDir },
      env,
    );
    expect(res.content[0].text).toContain("UIKitApp");
    expect(existsSync(join(tempDir, "UIKitApp", "Sources", "UIKitApp", "AppDelegate.swift"))).toBe(
      true,
    );
    const yaml = readFileSync(join(tempDir, "UIKitApp", "project.yml"), "utf-8");
    expect(yaml).toContain("INFOPLIST_KEY_UIApplicationSceneManifest_Generation");
  });

  it("generates a multiplatform project.yml", async () => {
    await createProject(
      { name: "MultiApp", template: "swiftui", platform: "multiplatform", outputPath: tempDir },
      env,
    );
    const yaml = readFileSync(join(tempDir, "MultiApp", "project.yml"), "utf-8");
    expect(yaml).toContain("platform: [iOS, macOS]");
    expect(yaml).toContain("target: MultiApp_iOS");
  });

  it("rejects invalid names", async () => {
    await expect(
      createProject(
        { name: "123bad", template: "swiftui", platform: "ios", outputPath: tempDir },
        env,
      ),
    ).rejects.toThrow();
  });

  it("rejects relative outputPath", async () => {
    await expect(
      createProject(
        { name: "RelPath", template: "swiftui", platform: "ios", outputPath: "relative/path" },
        env,
      ),
    ).rejects.toThrow();
  });

  it("rejects existing directories", async () => {
    await createProject(
      { name: "Dup", template: "swiftui", platform: "ios", outputPath: tempDir },
      env,
    );
    const res = await createProject(
      { name: "Dup", template: "swiftui", platform: "ios", outputPath: tempDir },
      env,
    );
    expect(res.isError).toBe(true);
  });

  it("runs xcodegen generate and reports the .xcodeproj path when xcodegen is available", async () => {
    mockXcodegenAvailable();
    const res = await createProject(
      { name: "GenApp", template: "swiftui", platform: "ios", outputPath: tempDir },
      env,
    );
    expect(res.isError).toBeFalsy();
    expect(res.content[0].text).toContain(join(tempDir, "GenApp", "GenApp.xcodeproj"));
    expect(existsSync(join(tempDir, "GenApp", "GenApp.xcodeproj"))).toBe(true);
    expect(execFile).toHaveBeenCalledWith(
      "xcodegen",
      ["generate"],
      expect.objectContaining({ cwd: join(tempDir, "GenApp") }),
      expect.anything(),
    );
  });

  it("reports xcodegen generate failures without erroring the whole call", async () => {
    mockXcodegenAvailable({ generateSucceeds: false });
    const res = await createProject(
      { name: "FailApp", template: "swiftui", platform: "ios", outputPath: tempDir },
      env,
    );
    expect(res.content[0].text).toContain("xcodegen generate` failed");
    expect(existsSync(join(tempDir, "FailApp", "project.yml"))).toBe(true);
  });
});

describe("scaffoldView", () => {
  it("creates a SwiftUI view file", async () => {
    const res = await scaffoldView({ name: "ProfileView", outputPath: tempDir }, env);
    expect(res.content[0].text).toContain("ProfileView.swift");
    const content = readFileSync(join(tempDir, "ProfileView.swift"), "utf-8");
    expect(content).toContain("struct ProfileView: View");
    expect(content).toContain("#Preview");
  });

  it("respects includePreview=false", async () => {
    await scaffoldView({ name: "SimpleView", outputPath: tempDir, includePreview: false }, env);
    const content = readFileSync(join(tempDir, "SimpleView.swift"), "utf-8");
    expect(content).not.toContain("#Preview");
  });
});

describe("scaffoldViewModel", () => {
  it("creates an Observable ViewModel", async () => {
    const res = await scaffoldViewModel({ name: "ProfileViewModel", outputPath: tempDir }, env);
    expect(res.content[0].text).toContain("ProfileViewModel.swift");
    const content = readFileSync(join(tempDir, "ProfileViewModel.swift"), "utf-8");
    expect(content).toContain("@Observable");
    expect(content).toContain("class ProfileViewModel");
  });
});

describe("scaffoldCoreDataModel", () => {
  it("creates a CoreData model with default attributes", async () => {
    const res = await scaffoldCoreDataModel({ name: "User", outputPath: tempDir }, env);
    expect(res.content[0].text).toContain("User+CoreData.swift");
    expect(res.content[0].text).toContain(".xcdatamodeld");
    const content = readFileSync(join(tempDir, "User+CoreData.swift"), "utf-8");
    expect(content).toContain("@objc(User)");
    expect(content).toContain("NSManagedObject");
  });

  it("creates with custom attributes", async () => {
    await scaffoldCoreDataModel(
      {
        name: "Task",
        outputPath: tempDir,
        attributes: [
          { name: "title", type: "String" },
          { name: "isDone", type: "Boolean" },
        ],
      },
      env,
    );
    const content = readFileSync(join(tempDir, "Task+CoreData.swift"), "utf-8");
    expect(content).toContain("var title: String?");
    expect(content).toContain("var isDone: Bool?");
  });

  it("rejects unsafe attribute names", async () => {
    await expect(
      scaffoldCoreDataModel(
        {
          name: "Bad",
          outputPath: tempDir,
          attributes: [{ name: "x: Int }", type: "String" }],
        },
        env,
      ),
    ).rejects.toThrow();
    expect(existsSync(join(tempDir, "Bad+CoreData.swift"))).toBe(false);
  });
});

describe("scaffoldWidget", () => {
  it("creates a static widget", async () => {
    const res = await scaffoldWidget({ name: "StatusWidget", outputPath: tempDir }, env);
    expect(res.content[0].text).toContain("StatusWidget.swift");
    const content = readFileSync(join(tempDir, "StatusWidget.swift"), "utf-8");
    expect(content).toContain("StaticConfiguration");
    expect(content).toContain("TimelineProvider");
  });

  it("creates a configurable widget using AppIntentConfiguration", async () => {
    const res = await scaffoldWidget(
      { name: "ConfigWidget", outputPath: tempDir, kind: "configurable" },
      env,
    );
    expect(res.content[0].text).toContain("ConfigWidget.swift");
    const content = readFileSync(join(tempDir, "ConfigWidget.swift"), "utf-8");
    expect(content).toContain("import AppIntents");
    expect(content).toContain("WidgetConfigurationIntent");
    expect(content).toContain("AppIntentTimelineProvider");
    expect(content).toContain(
      "AppIntentConfiguration(kind: kind, intent: ConfigWidgetConfigIntent.self, provider: ConfigWidgetProvider())",
    );
    expect(content).not.toContain("IntentConfiguration(kind: kind, provider:");
  });
});
