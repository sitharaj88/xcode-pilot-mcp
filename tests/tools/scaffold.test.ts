import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, rmSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

vi.mock("node:child_process", () => ({ execFile: vi.fn(), spawn: vi.fn() }));

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

let tempDir: string;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "scaffold-test-"));
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe("createProject", () => {
  it("creates a SwiftUI project", async () => {
    const res = await createProject(
      { name: "TestApp", template: "swiftui", platform: "ios", outputPath: tempDir },
      env,
    );
    expect(res.content[0].text).toContain("TestApp");
    expect(existsSync(join(tempDir, "TestApp", "Package.swift"))).toBe(true);
    expect(existsSync(join(tempDir, "TestApp", "Sources", "TestApp", "ContentView.swift"))).toBe(
      true,
    );
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
  });

  it("rejects invalid names", async () => {
    await expect(
      createProject(
        { name: "123bad", template: "swiftui", platform: "ios", outputPath: tempDir },
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
});

describe("scaffoldWidget", () => {
  it("creates a static widget", async () => {
    const res = await scaffoldWidget({ name: "StatusWidget", outputPath: tempDir }, env);
    expect(res.content[0].text).toContain("StatusWidget.swift");
    const content = readFileSync(join(tempDir, "StatusWidget.swift"), "utf-8");
    expect(content).toContain("StaticConfiguration");
    expect(content).toContain("TimelineProvider");
  });
});
