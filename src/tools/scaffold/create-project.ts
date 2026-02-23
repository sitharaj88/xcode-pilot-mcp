import { mkdirSync, writeFileSync, cpSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";
import { validateSafeName } from "../../utils/validation.js";

interface CreateProjectArgs {
  name: string;
  template: string;
  platform: string;
  outputPath: string;
  bundleId?: string;
  organizationName?: string;
  minimumDeploymentTarget?: string;
}

export async function createProject(
  args: CreateProjectArgs,
  _env: Environment,
): Promise<ToolResponse> {
  validateSafeName(args.name);

  const projectDir = join(args.outputPath, args.name);
  if (existsSync(projectDir)) {
    return errorResponse(`Directory already exists: ${projectDir}`);
  }

  const bundleId = args.bundleId || `com.example.${args.name.toLowerCase()}`;
  const orgName = args.organizationName || "Organization";
  const deployTarget = args.minimumDeploymentTarget || "17.0";

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const templateDir = join(__dirname, "..", "..", "templates", `${args.template}-project`);

  if (existsSync(templateDir) && readdirSync(templateDir).length > 0) {
    mkdirSync(projectDir, { recursive: true });
    cpSync(templateDir, projectDir, { recursive: true });
    return textResponse(`Project "${args.name}" created from template at: ${projectDir}`);
  }

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

  const platformSetting =
    args.platform === "macos"
      ? `.macOS("14.0")`
      : args.platform === "multiplatform"
        ? `.iOS("${deployTarget}"), .macOS("14.0")`
        : `.iOS("${deployTarget}")`;

  writeFileSync(
    join(projectDir, "Package.swift"),
    `// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "${args.name}",
    platforms: [
        ${platformSetting}
    ],
    products: [
        .library(name: "${args.name}", targets: ["${args.name}"])
    ],
    targets: [
        .target(name: "${args.name}", path: "Sources/${args.name}"),
        .testTarget(name: "${args.name}Tests", dependencies: ["${args.name}"], path: "Tests/${args.name}Tests")
    ]
)
`,
  );

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

  const lines = [
    `Project "${args.name}" created at: ${projectDir}`,
    `  Template: ${args.template}`,
    `  Platform: ${args.platform}`,
    `  Bundle ID: ${bundleId}`,
    `  Organization: ${orgName}`,
    `  Minimum Deployment Target: ${deployTarget}`,
    "",
    "Files created:",
    `  Package.swift`,
    `  Sources/${args.name}/`,
    `  Tests/${args.name}Tests/`,
  ];

  return textResponse(lines.join("\n"));
}
