import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";
import {
  validateAbsolutePath,
  validateBundleId,
  validateSafeName,
} from "../../utils/validation.js";

interface CreateProjectArgs {
  name: string;
  template: string;
  platform: string;
  outputPath: string;
  bundleId?: string;
  organizationName?: string;
  minimumDeploymentTarget?: string;
}

function organizationSlug(organizationName: string): string {
  const slug = organizationName.toLowerCase().replace(/[^a-z0-9]+/g, "");
  return slug || "example";
}

function buildProjectYaml(opts: {
  name: string;
  template: string;
  platform: string;
  bundleId: string;
  deployTarget: string;
}): string {
  const { name, template, platform, bundleId, deployTarget } = opts;

  const appSettings = [
    `        PRODUCT_BUNDLE_IDENTIFIER: ${bundleId}`,
    `        SWIFT_VERSION: "5.0"`,
    `        GENERATE_INFOPLIST_FILE: YES`,
    `        CURRENT_PROJECT_VERSION: "1"`,
    `        MARKETING_VERSION: "1.0"`,
  ];
  if (template === "uikit") {
    appSettings.push(`        INFOPLIST_KEY_UIApplicationSceneManifest_Generation: YES`);
  }

  if (platform === "multiplatform") {
    return `name: ${name}
configs:
  Debug: debug
  Release: release
targets:
  ${name}:
    type: application
    platform: [iOS, macOS]
    deploymentTarget:
      iOS: "${deployTarget}"
      macOS: "14.0"
    sources:
      - path: Sources
    settings:
      base:
${appSettings.join("\n")}
  ${name}Tests:
    type: bundle.unit-test
    platform: iOS
    deploymentTarget: "${deployTarget}"
    sources:
      - path: Tests
    settings:
      base:
        GENERATE_INFOPLIST_FILE: YES
    dependencies:
      - target: ${name}_iOS
`;
  }

  const xgPlatform = platform === "macos" ? "macOS" : "iOS";
  const targetDeployTarget = platform === "macos" ? "14.0" : deployTarget;

  return `name: ${name}
configs:
  Debug: debug
  Release: release
targets:
  ${name}:
    type: application
    platform: ${xgPlatform}
    deploymentTarget: "${targetDeployTarget}"
    sources:
      - path: Sources
    settings:
      base:
${appSettings.join("\n")}
  ${name}Tests:
    type: bundle.unit-test
    platform: ${xgPlatform}
    deploymentTarget: "${targetDeployTarget}"
    sources:
      - path: Tests
    settings:
      base:
        GENERATE_INFOPLIST_FILE: YES
    dependencies:
      - target: ${name}
`;
}

export async function createProject(
  args: CreateProjectArgs,
  _env: Environment,
): Promise<ToolResponse> {
  validateSafeName(args.name);
  validateAbsolutePath(args.outputPath);

  const projectDir = join(args.outputPath, args.name);
  if (existsSync(projectDir)) {
    return errorResponse(`Directory already exists: ${projectDir}`);
  }

  const orgName = args.organizationName || "Organization";
  const bundleId = validateBundleId(
    args.bundleId || `com.${organizationSlug(orgName)}.${args.name.toLowerCase()}`,
  );
  const deployTarget = args.minimumDeploymentTarget || "17.0";

  mkdirSync(join(projectDir, "Sources", args.name), { recursive: true });
  mkdirSync(join(projectDir, "Tests", `${args.name}Tests`), { recursive: true });

  if (args.template === "swiftui") {
    writeFileSync(
      join(projectDir, "Sources", args.name, `${args.name}App.swift`),
      `import SwiftUI

@main
struct ${args.name}App: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
`,
    );

    writeFileSync(
      join(projectDir, "Sources", args.name, "ContentView.swift"),
      `import SwiftUI

struct ContentView: View {
    var body: some View {
        VStack {
            Image(systemName: "globe")
                .imageScale(.large)
                .foregroundStyle(.tint)
            Text("Hello, world!")
        }
        .padding()
    }
}

#Preview {
    ContentView()
}
`,
    );
  } else {
    writeFileSync(
      join(projectDir, "Sources", args.name, "AppDelegate.swift"),
      `import UIKit

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        return true
    }

    func application(
        _ application: UIApplication,
        configurationForConnecting connectingSceneSession: UISceneSession,
        options: UIScene.ConnectionOptions
    ) -> UISceneConfiguration {
        return UISceneConfiguration(name: "Default Configuration", sessionRole: connectingSceneSession.role)
    }
}
`,
    );

    writeFileSync(
      join(projectDir, "Sources", args.name, "SceneDelegate.swift"),
      `import UIKit

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(
        _ scene: UIScene,
        willConnectTo session: UISceneSession,
        options connectionOptions: UIScene.ConnectionOptions
    ) {
        guard let windowScene = (scene as? UIWindowScene) else { return }
        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = ViewController()
        window?.makeKeyAndVisible()
    }
}
`,
    );

    writeFileSync(
      join(projectDir, "Sources", args.name, "ViewController.swift"),
      `import UIKit

class ViewController: UIViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemBackground
    }
}
`,
    );
  }

  writeFileSync(
    join(projectDir, "Tests", `${args.name}Tests`, `${args.name}Tests.swift`),
    `import XCTest
@testable import ${args.name}

final class ${args.name}Tests: XCTestCase {
    func testExample() throws {
        XCTAssertTrue(true)
    }
}
`,
  );

  const projectYaml = buildProjectYaml({
    name: args.name,
    template: args.template,
    platform: args.platform,
    bundleId,
    deployTarget,
  });
  writeFileSync(join(projectDir, "project.yml"), projectYaml);

  const summary = [
    `Project "${args.name}" created at: ${projectDir}`,
    `  Template: ${args.template}`,
    `  Platform: ${args.platform}`,
    `  Bundle ID: ${bundleId}`,
    `  Organization: ${orgName}`,
    `  Minimum Deployment Target: ${deployTarget}`,
    "",
    "Files created:",
    `  project.yml`,
    `  Sources/${args.name}/`,
    `  Tests/${args.name}Tests/`,
  ];

  const which = await executeCommand("which", ["xcodegen"]);
  if (!which.success || !which.stdout.trim()) {
    return textResponse(
      [
        ...summary,
        "",
        "xcodegen is not installed, so no .xcodeproj was generated.",
        "Run this to finish setting up the project:",
        "  brew install xcodegen && xcodegen generate",
        `  (from ${projectDir})`,
      ].join("\n"),
    );
  }

  const generate = await executeCommand("xcodegen", ["generate"], {
    cwd: projectDir,
    timeout: 60_000,
  });

  const xcodeprojPath = join(projectDir, `${args.name}.xcodeproj`);
  if (generate.success && existsSync(xcodeprojPath)) {
    return textResponse([...summary, "", `Xcode project generated: ${xcodeprojPath}`].join("\n"));
  }

  return textResponse(
    [
      ...summary,
      "",
      "xcodegen was found but `xcodegen generate` failed:",
      generate.stderr || generate.stdout || "(no output)",
      "",
      `Fix the issue and re-run xcodegen generate from ${projectDir}`,
    ].join("\n"),
  );
}
