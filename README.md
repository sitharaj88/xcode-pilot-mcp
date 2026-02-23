# xcode-pilot-mcp

[![CI](https://github.com/sitharaj88/xcode-pilot-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/sitharaj88/xcode-pilot-mcp/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/xcode-pilot-mcp.svg)](https://www.npmjs.com/package/xcode-pilot-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org)
[![Docs](https://img.shields.io/badge/docs-online-blue.svg)](https://sitharaj88.github.io/xcode-pilot-mcp/)

A comprehensive [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server for iOS and macOS development. Provides **67 tools** across **11 categories** that give AI assistants full control over the Xcode development lifecycle — from building and testing to simulator management, app deployment, code signing, and more.

> The iOS equivalent of [android-pilot-mcp](https://github.com/sitharaj88/android-pilot-mcp).

**[Read the full documentation](https://sitharaj88.github.io/xcode-pilot-mcp/)**

---

## Table of Contents

- [Features](#features)
- [Requirements](#requirements)
- [Quick Start](#quick-start)
- [Editor Setup](#editor-setup)
- [Usage Examples](#usage-examples)
- [Prompt Cookbook](#prompt-cookbook)
- [Tool Reference](#tool-reference)
- [Architecture](#architecture)
- [Development](#development)
- [License](#license)

---

## Features

| Category                  | Tools | Description                                                          |
| ------------------------- | :---: | -------------------------------------------------------------------- |
| **Build & Compile**       |   8   | Build, clean, archive, export IPA, run tests with `xcodebuild`       |
| **Simulator Management**  |  10   | Create, boot, shutdown, delete, clone simulators with `xcrun simctl` |
| **App Lifecycle**         |   8   | Install, launch, terminate apps, manage permissions                  |
| **Debugging & Logging**   |   7   | Stream logs, capture screenshots, record screen, accessibility audit |
| **Simulator Environment** |   6   | Set GPS location, send push notifications, override status bar       |
| **Code Signing**          |   5   | List identities, inspect provisioning profiles, check entitlements   |
| **Package Management**    |   6   | SPM resolve/update, CocoaPods install/update/outdated                |
| **Project Scaffolding**   |   5   | Create projects, generate SwiftUI views, ViewModels, widgets         |
| **IPA Analysis**          |   4   | Inspect IPA contents, permissions, binary size, dSYM verification    |
| **Code Quality**          |   4   | SwiftLint, swift-format, build warnings extraction                   |
| **Physical Devices**      |   4   | List, install, launch apps on connected iOS devices via `devicectl`  |

---

## Requirements

- **macOS** (required — Xcode tools are macOS-only)
- **Node.js** >= 20
- **Xcode** installed from the App Store
- **Xcode Command Line Tools** — install with:
  ```bash
  xcode-select --install
  ```

### Optional tools (for specific features)

| Tool         | Install                     | Used by                                     |
| ------------ | --------------------------- | ------------------------------------------- |
| SwiftLint    | `brew install swiftlint`    | `swiftlint_run`, `swiftlint_fix`            |
| swift-format | `brew install swift-format` | `swift_format_run`                          |
| CocoaPods    | `gem install cocoapods`     | `pod_install`, `pod_update`, `pod_outdated` |

---

## Quick Start

### Install globally

```bash
npm install -g xcode-pilot-mcp
```

### Or run directly with npx

```bash
npx xcode-pilot-mcp
```

### Verify installation

```bash
# The server starts on stdio — it will listen for MCP messages
xcode-pilot-mcp
```

---

## Editor Setup

### Claude Code

```bash
claude mcp add xcode-pilot -- npx xcode-pilot-mcp
```

### Cursor

Add to your MCP settings (`~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "xcode-pilot": {
      "command": "npx",
      "args": ["-y", "xcode-pilot-mcp"]
    }
  }
}
```

### Windsurf

Add to `~/.windsurf/mcp.json`:

```json
{
  "mcpServers": {
    "xcode-pilot": {
      "command": "npx",
      "args": ["-y", "xcode-pilot-mcp"]
    }
  }
}
```

### VS Code (Copilot)

Add to your VS Code `settings.json`:

```json
{
  "mcp.servers": {
    "xcode-pilot": {
      "command": "npx",
      "args": ["-y", "xcode-pilot-mcp"]
    }
  }
}
```

### Local development

Use the `.mcp.json` at the project root:

```json
{
  "mcpServers": {
    "xcode-pilot": {
      "command": "node",
      "args": ["build/index.js"],
      "transportType": "stdio"
    }
  }
}
```

---

## Usage Examples

### Build and test a project

```
"Build my iOS app with the Debug configuration for the iPhone 16 simulator"
→ Uses xcode_build with scheme, configuration, and destination

"Run all unit tests for the MyApp scheme"
→ Uses xcode_test with the appropriate destination

"Run only the LoginTests test class, skip SlowTests"
→ Uses xcode_test with onlyTesting and skipTesting filters
```

### Manage simulators

```
"List all available simulators"
→ Uses simulator_list to show all devices with their state

"Create a new iPhone 16 Pro simulator with iOS 18"
→ Uses simulator_list_device_types + simulator_list_runtimes to find IDs,
  then simulator_create

"Boot the simulator and install my app"
→ Uses simulator_boot, then app_install with the .app path
```

### Debug and capture

```
"Take a screenshot of the simulator"
→ Uses screenshot, returns the file path

"Record the simulator screen for 15 seconds"
→ Uses screen_record with duration=15

"Show me the last 5 minutes of logs for my app"
→ Uses log_collect with last="5m" and predicate filter

"Stream live logs from the simulator for 10 seconds"
→ Uses log_stream with timeout=10
```

### App lifecycle

```
"Launch com.example.myapp on the booted simulator"
→ Uses app_launch with the bundle ID

"Grant camera permission to my app"
→ Uses app_privacy with action="grant", service="camera"

"Open a deep link: myapp://settings/profile"
→ Uses app_open_url with the custom URL scheme

"Where is my app's data stored?"
→ Uses app_get_container with container="data"
```

### Environment simulation

```
"Set the simulator location to San Francisco"
→ Uses location_set with latitude=37.7749, longitude=-122.4194

"Send a test push notification with title 'Hello'"
→ Uses push_notification with APNs JSON payload

"Set the status bar to 9:41, full battery, full wifi"
→ Uses status_bar_override with time, batteryLevel, wifiBars

"Switch the simulator to dark mode"
→ Uses device_appearance with appearance="dark"
```

### Code signing

```
"List all my code signing identities"
→ Uses signing_identities

"Show me all installed provisioning profiles"
→ Uses provisioning_profiles with summary for each

"Inspect the entitlements of my built app"
→ Uses entitlements_check on the .app bundle
```

### Package management

```
"Resolve all SPM dependencies"
→ Uses spm_resolve

"Update my CocoaPods and check for outdated pods"
→ Uses pod_update then pod_outdated

"Show me the dependency tree for my Swift package"
→ Uses spm_show_dependencies with JSON format
```

### Scaffolding

```
"Create a new SwiftUI iOS project called WeatherApp"
→ Uses project_create with template="swiftui", platform="ios"

"Generate a SwiftUI view called SettingsView with a preview"
→ Uses scaffold_view with includePreview=true

"Create a Core Data model called Task with title, isDone, and dueDate"
→ Uses scaffold_coredata_model with custom attributes
```

### Analysis

```
"Analyze this IPA file — what's the bundle ID, size, and architectures?"
→ Uses ipa_analyze to unzip and inspect

"Check what privacy permissions this IPA requires"
→ Uses ipa_permissions to list NS*UsageDescription keys

"Verify that my dSYM file matches the release binary"
→ Uses dsym_verify to compare UUIDs
```

---

## Prompt Cookbook

Ready-to-use prompts for common iOS development workflows:

### Full build-test-deploy cycle

```
Build my project with the Release configuration, run all tests on an iPhone 16 Pro
simulator, and if tests pass, create an archive. Show me the test results.
```

### Simulator setup from scratch

```
List available iOS runtimes, create a new iPhone 16 simulator with the latest iOS,
boot it, and open the Simulator app so I can see it.
```

### Debug a crash

```
Stream the simulator logs for 30 seconds while I reproduce the crash.
Filter for error-level messages from my app's bundle ID com.myteam.myapp.
```

### App Store screenshot preparation

```
Boot the simulator, set the status bar to 9:41 with full battery and full wifi
signal, set carrier name to an empty string, then take a screenshot.
```

### CI/CD validation

```
Clean the project, build with Release configuration, run all tests,
check SwiftLint violations, and verify the binary size of the built product.
```

### Dependency audit

```
Show me the full SPM dependency tree, then check if any CocoaPods are outdated.
Also run SwiftLint to check code quality.
```

### New feature scaffolding

```
Create a SwiftUI view called ProfileView, a corresponding ProfileViewModel,
and a Core Data model called UserProfile with fields: id (UUID), name (String),
email (String), avatarURL (String), and lastLogin (Date).
```

### Physical device deployment

```
List connected physical devices, install my built app on the first device,
launch it, and stream the device console logs for 20 seconds.
```

---

## Tool Reference

### Build & Compile (8 tools)

| Tool                          | Description                           | Key Parameters                                                                                       |
| ----------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `xcode_build`                 | Build project/workspace               | `scheme` (req), `projectPath`, `configuration`, `destination`, `sdk`, `derivedDataPath`, `extraArgs` |
| `xcode_clean`                 | Clean build artifacts                 | `scheme` (req), `projectPath`                                                                        |
| `xcode_archive`               | Create archive for distribution       | `scheme` (req), `archivePath` (req), `projectPath`, `configuration`                                  |
| `xcode_export`                | Export IPA from archive               | `archivePath` (req), `exportPath` (req), `exportOptionsPlist` (req)                                  |
| `xcode_test`                  | Run unit and UI tests                 | `scheme` (req), `destination` (req), `projectPath`, `testPlan`, `onlyTesting`, `skipTesting`         |
| `xcode_test_without_building` | Run tests without rebuilding          | Same as `xcode_test`                                                                                 |
| `xcode_list`                  | List schemes, targets, configurations | `projectPath`                                                                                        |
| `xcode_build_settings`        | Show resolved build settings          | `projectPath`, `scheme`, `configuration`                                                             |

### Simulator Management (10 tools)

| Tool                          | Description                             | Key Parameters                                        |
| ----------------------------- | --------------------------------------- | ----------------------------------------------------- |
| `simulator_list`              | List all simulators with state          | `state` (filter: "Booted", "Shutdown")                |
| `simulator_create`            | Create new simulator                    | `name` (req), `deviceTypeId` (req), `runtimeId` (req) |
| `simulator_boot`              | Boot a simulator                        | `deviceId` (req)                                      |
| `simulator_shutdown`          | Shutdown simulator(s)                   | `deviceId` (default: "all")                           |
| `simulator_delete`            | Delete a simulator                      | `deviceId` (req, or "unavailable")                    |
| `simulator_erase`             | Erase all content and settings          | `deviceId` (req)                                      |
| `simulator_open`              | Open Simulator.app for a device         | `deviceId` (req)                                      |
| `simulator_list_runtimes`     | List iOS/watchOS/tvOS/visionOS runtimes | —                                                     |
| `simulator_list_device_types` | List device types (iPhone, iPad, etc.)  | —                                                     |
| `simulator_clone`             | Clone an existing simulator             | `deviceId` (req), `newName` (req)                     |

### App Lifecycle (8 tools)

| Tool                | Description                    | Key Parameters                                                          |
| ------------------- | ------------------------------ | ----------------------------------------------------------------------- |
| `app_install`       | Install .app on simulator      | `deviceId` (req), `appPath` (req)                                       |
| `app_uninstall`     | Uninstall by bundle ID         | `deviceId` (req), `bundleId` (req)                                      |
| `app_launch`        | Launch app by bundle ID        | `deviceId` (req), `bundleId` (req), `args`, `consolePty`                |
| `app_terminate`     | Terminate running app          | `deviceId` (req), `bundleId` (req)                                      |
| `app_get_container` | Get app container path         | `deviceId` (req), `bundleId` (req), `container` ("app"/"data"/"groups") |
| `app_list`          | List installed apps            | `deviceId` (req)                                                        |
| `app_open_url`      | Open URL for deep link testing | `deviceId` (req), `url` (req)                                           |
| `app_privacy`       | Grant/revoke/reset permissions | `deviceId` (req), `action` (req), `service` (req), `bundleId`           |

<details>
<summary><strong>Supported privacy services</strong></summary>

`all`, `calendar`, `contacts-limited`, `contacts`, `location`, `location-always`, `photos-add`, `photos`, `media-library`, `microphone`, `motion`, `reminders`, `siri`, `speech-recognition`, `camera`, `faceid`, `health`, `homekit`, `usertracking`

</details>

### Debugging & Logging (7 tools)

| Tool                  | Description                         | Key Parameters                                                   |
| --------------------- | ----------------------------------- | ---------------------------------------------------------------- |
| `log_stream`          | Stream live logs for N seconds      | `deviceId` (req), `predicate`, `level`, `timeout` (default: 10s) |
| `log_collect`         | Collect recent logs                 | `deviceId` (req), `predicate`, `last` ("5m", "1h"), `style`      |
| `screenshot`          | Capture screenshot as PNG           | `deviceId` (req), `outputPath` (auto-generated if omitted)       |
| `screen_record`       | Record screen as MP4                | `deviceId` (req), `outputPath`, `duration` (default: 10s)        |
| `diagnostics`         | Collect diagnostic report           | `outputPath`                                                     |
| `accessibility_audit` | Run accessibility audit (Xcode 15+) | `deviceId` (req)                                                 |
| `device_appearance`   | Set light/dark mode                 | `deviceId` (req), `appearance` ("light"/"dark")                  |

<details>
<summary><strong>Log predicate examples</strong></summary>

```
subsystem == "com.example.app"
eventMessage contains "error"
subsystem == "com.example.app" AND messageType == error
process == "MyApp"
```

</details>

### Simulator Environment (6 tools)

| Tool                  | Description                     | Key Parameters                                                                                                      |
| --------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `location_set`        | Set GPS coordinates             | `deviceId` (req), `latitude` (req), `longitude` (req)                                                               |
| `location_clear`      | Clear simulated location        | `deviceId` (req)                                                                                                    |
| `push_notification`   | Send push via APNs JSON payload | `deviceId` (req), `bundleId` (req), `payload` (req, JSON string)                                                    |
| `status_bar_override` | Override status bar             | `deviceId` (req), `time`, `batteryLevel`, `batteryState`, `wifiBars`, `cellularBars`, `operatorName`, `dataNetwork` |
| `status_bar_clear`    | Reset status bar to defaults    | `deviceId` (req)                                                                                                    |
| `keyboard_input`      | Send text input to simulator    | `deviceId` (req), `text` (req)                                                                                      |

<details>
<summary><strong>Push notification payload example</strong></summary>

```json
{
  "aps": {
    "alert": {
      "title": "New Message",
      "body": "You have a new message from John"
    },
    "badge": 1,
    "sound": "default"
  },
  "customKey": "customValue"
}
```

</details>

### Code Signing & Provisioning (5 tools)

| Tool                    | Description                          | Key Parameters      |
| ----------------------- | ------------------------------------ | ------------------- |
| `signing_identities`    | List code signing identities         | —                   |
| `provisioning_profiles` | List installed profiles with details | —                   |
| `profile_inspect`       | Decode and inspect a profile         | `profilePath` (req) |
| `keychain_list`         | List keychains                       | —                   |
| `entitlements_check`    | Show entitlements of built app       | `appPath` (req)     |

### Package Management (6 tools)

| Tool                    | Description                   | Key Parameters                                     |
| ----------------------- | ----------------------------- | -------------------------------------------------- |
| `spm_resolve`           | Resolve SPM dependencies      | `projectPath`, `scheme`, `clonedSourcePackagesDir` |
| `spm_update`            | Update SPM packages           | `projectPath`                                      |
| `spm_show_dependencies` | Show dependency tree as JSON  | `projectPath`                                      |
| `pod_install`           | Run CocoaPods install         | `projectPath`, `repoUpdate`                        |
| `pod_update`            | Update pods (all or specific) | `projectPath`, `podName`                           |
| `pod_outdated`          | Check outdated pods           | `projectPath`                                      |

### Project Scaffolding (5 tools)

| Tool                      | Description                    | Key Parameters                                                                                                                                                          |
| ------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `project_create`          | Create new Xcode project       | `name` (req), `template` ("swiftui"/"uikit"), `platform` ("ios"/"macos"/"multiplatform"), `outputPath` (req), `bundleId`, `organizationName`, `minimumDeploymentTarget` |
| `scaffold_view`           | Generate SwiftUI View          | `name` (req), `outputPath` (req), `includePreview` (default: true)                                                                                                      |
| `scaffold_viewmodel`      | Generate @Observable ViewModel | `name` (req), `outputPath` (req)                                                                                                                                        |
| `scaffold_coredata_model` | Generate Core Data model       | `name` (req), `outputPath` (req), `attributes` (array of {name, type})                                                                                                  |
| `scaffold_widget`         | Generate WidgetKit extension   | `name` (req), `outputPath` (req), `kind` ("static"/"configurable")                                                                                                      |

<details>
<summary><strong>Supported Core Data attribute types</strong></summary>

`String`, `Integer16`, `Integer32`, `Integer64`, `Double`, `Float`, `Boolean`, `Date`, `Binary`, `UUID`, `URI`

</details>

### IPA & App Analysis (4 tools)

| Tool              | Description                                              | Key Parameters                       |
| ----------------- | -------------------------------------------------------- | ------------------------------------ |
| `ipa_analyze`     | Inspect IPA: size, Info.plist, architectures, frameworks | `ipaPath` (req)                      |
| `ipa_permissions` | List privacy usage descriptions                          | `ipaPath` (req)                      |
| `binary_size`     | Analyze Mach-O binary size by segment                    | `binaryPath` (req)                   |
| `dsym_verify`     | Verify dSYM matches binary UUID                          | `dsymPath` (req), `binaryPath` (req) |

### Code Quality (4 tools)

| Tool               | Description                          | Key Parameters                            |
| ------------------ | ------------------------------------ | ----------------------------------------- |
| `swiftlint_run`    | Run SwiftLint analysis (JSON output) | `path`, `config`                          |
| `swiftlint_fix`    | Auto-fix SwiftLint violations        | `path`, `config`                          |
| `swift_format_run` | Run swift-format lint                | `path` (req), `recursive` (default: true) |
| `build_warnings`   | Extract warnings from build log      | `projectPath`, `derivedDataPath`          |

### Physical Devices (4 tools)

| Tool                      | Description                            | Key Parameters                             |
| ------------------------- | -------------------------------------- | ------------------------------------------ |
| `physical_device_list`    | List connected iOS devices (Xcode 15+) | —                                          |
| `physical_device_install` | Install app on device                  | `deviceId` (req), `appPath` (req)          |
| `physical_device_launch`  | Launch app on device                   | `deviceId` (req), `bundleId` (req)         |
| `physical_device_console` | Stream device console logs             | `deviceId` (req), `timeout` (default: 10s) |

---

## Architecture

```
src/
├── index.ts              # MCP server entry point, registers all 11 tool categories
├── types.ts              # Environment, ExecResult, ExecOptions interfaces
├── executor.ts           # Shell command execution (execFile, spawn, stdin piping)
├── environment.ts        # Xcode environment detection (xcode-select, xcrun, simctl, devicectl)
├── utils/
│   ├── response.ts       # textResponse, errorResponse, execResultResponse, withErrorHandling
│   ├── validation.ts     # Path, bundle ID, and name validation
│   └── logger.ts         # Structured stderr logging (stdout reserved for MCP protocol)
├── tools/
│   ├── build/            # 8 tools — xcodebuild build, clean, archive, export, test
│   ├── simulator/        # 10 tools — xcrun simctl create, boot, shutdown, list, clone
│   ├── app/              # 8 tools — install, launch, terminate, privacy, openurl
│   ├── debug/            # 7 tools — log stream/collect, screenshot, screen record
│   ├── environment/      # 6 tools — location, push notifications, status bar
│   ├── signing/          # 5 tools — identities, profiles, entitlements
│   ├── packages/         # 6 tools — SPM resolve/update, pod install/update
│   ├── scaffold/         # 5 tools — project creation, view/viewmodel/widget generation
│   ├── analyze/          # 4 tools — IPA analysis, binary size, dSYM verification
│   ├── quality/          # 4 tools — SwiftLint, swift-format, build warnings
│   └── device/           # 4 tools — physical device list, install, launch, console
└── templates/            # Swift project and component templates
    ├── SwiftUIView.swift.template
    ├── ViewModel.swift.template
    ├── CoreDataModel.swift.template
    └── Widget.swift.template

tests/                    # 112 tests across 15 test files
├── executor.test.ts
├── environment.test.ts
├── utils/
│   ├── response.test.ts
│   └── validation.test.ts
└── tools/                # One test file per tool category
```

### Design Principles

- **One handler per tool** — each tool is a single async function in its own file
- **Zod validation** — all input parameters validated at the MCP registration layer
- **JSON-first** — prefers `-j` flag for JSON output from simctl commands
- **Graceful errors** — actionable error messages (e.g., "Is the simulator booted?")
- **Response truncation** — long outputs (>100KB) are truncated to prevent protocol overflows
- **Timeout management** — configurable per-tool (builds get 600s, quick queries get 30s)
- **No Xcode required at install** — environment detection happens at runtime

---

## Development

### Setup

```bash
git clone https://github.com/sitharaj88/xcode-pilot-mcp.git
cd xcode-pilot-mcp
npm install
```

### Build

```bash
npm run build        # Compile TypeScript + copy templates + chmod +x
npm run dev          # Watch mode (tsc --watch)
```

### Test

```bash
npm test             # Run all tests
npm run test:coverage  # Run with coverage report
```

### Code Quality

```bash
npm run lint         # ESLint
npm run lint:fix     # ESLint with auto-fix
npm run format       # Prettier write
npm run format:check # Prettier check only
npm run typecheck    # TypeScript --noEmit
npm run check        # All of the above
```

### Scripts Reference

| Script           | Description                                 |
| ---------------- | ------------------------------------------- |
| `build`          | Compile TS, copy templates, make executable |
| `dev`            | TypeScript watch mode                       |
| `test`           | Run vitest                                  |
| `test:coverage`  | Run vitest with V8 coverage                 |
| `lint`           | ESLint check                                |
| `lint:fix`       | ESLint auto-fix                             |
| `format`         | Prettier write                              |
| `format:check`   | Prettier check                              |
| `typecheck`      | TypeScript type check                       |
| `check`          | typecheck + lint + format:check             |
| `prepare`        | Husky git hooks setup                       |
| `prepublishOnly` | Full quality gate before npm publish        |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, coding standards, and PR guidelines.

---

## License

[MIT](LICENSE) — Sitharaj Seenivasan
