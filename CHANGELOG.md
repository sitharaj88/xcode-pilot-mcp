# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-02-23

### Added

- Initial release with **67 tools** across **11 categories**

#### Build & Compile (8 tools)

- `xcode_build` — Build project/workspace with scheme, configuration, destination
- `xcode_clean` — Clean build artifacts
- `xcode_archive` — Create archive for distribution
- `xcode_export` — Export IPA from archive with export options plist
- `xcode_test` — Run unit and UI tests with filtering
- `xcode_test_without_building` — Run tests on previously built code
- `xcode_list` — List schemes, targets, configurations
- `xcode_build_settings` — Show resolved build settings

#### Simulator Management (10 tools)

- `simulator_list` — List all simulators with state filtering
- `simulator_create` — Create simulator with device type + runtime
- `simulator_boot` — Boot a simulator
- `simulator_shutdown` — Shutdown simulator(s)
- `simulator_delete` — Delete a simulator or unavailable devices
- `simulator_erase` — Erase all content and settings
- `simulator_open` — Open Simulator.app for a device
- `simulator_list_runtimes` — List iOS/watchOS/tvOS/visionOS runtimes
- `simulator_list_device_types` — List available device types
- `simulator_clone` — Clone an existing simulator

#### App Lifecycle (8 tools)

- `app_install` — Install .app on simulator
- `app_uninstall` — Uninstall by bundle ID
- `app_launch` — Launch app with arguments and console output
- `app_terminate` — Terminate running app
- `app_get_container` — Get app/data/group container paths
- `app_list` — List installed apps
- `app_open_url` — Open URL for deep link/universal link testing
- `app_privacy` — Grant/revoke/reset 19 privacy permissions

#### Debugging & Logging (7 tools)

- `log_stream` — Stream live logs with predicate and timeout
- `log_collect` — Collect recent logs with time range
- `screenshot` — Capture screenshot as PNG
- `screen_record` — Record screen as MP4 with duration control
- `diagnostics` — Collect diagnostic report
- `accessibility_audit` — Run accessibility audit (Xcode 15+)
- `device_appearance` — Set light/dark mode

#### Simulator Environment (6 tools)

- `location_set` — Set GPS coordinates
- `location_clear` — Clear simulated location
- `push_notification` — Send push notification via APNs payload
- `status_bar_override` — Override status bar (time, battery, wifi, cellular, operator)
- `status_bar_clear` — Reset status bar to defaults
- `keyboard_input` — Send text input to simulator

#### Code Signing & Provisioning (5 tools)

- `signing_identities` — List code signing identities
- `provisioning_profiles` — List installed profiles with name, UUID, team, expiration
- `profile_inspect` — Decode and inspect a provisioning profile
- `keychain_list` — List keychains
- `entitlements_check` — Show entitlements of a built app

#### Package Management (6 tools)

- `spm_resolve` — Resolve Swift Package Manager dependencies
- `spm_update` — Update SPM packages
- `spm_show_dependencies` — Show dependency tree as JSON
- `pod_install` — Run CocoaPods install with optional repo update
- `pod_update` — Update pods (all or specific)
- `pod_outdated` — Check for outdated pods

#### Project Scaffolding (5 tools)

- `project_create` — Create new project (SwiftUI/UIKit, iOS/macOS/multiplatform)
- `scaffold_view` — Generate SwiftUI View with #Preview
- `scaffold_viewmodel` — Generate @Observable ViewModel
- `scaffold_coredata_model` — Generate Core Data NSManagedObject subclass
- `scaffold_widget` — Generate WidgetKit extension (static/configurable)

#### IPA & App Analysis (4 tools)

- `ipa_analyze` — Inspect IPA: size, bundle ID, version, architectures, frameworks
- `ipa_permissions` — List privacy usage descriptions from Info.plist
- `binary_size` — Analyze Mach-O binary size by segment
- `dsym_verify` — Verify dSYM matches binary UUID

#### Code Quality (4 tools)

- `swiftlint_run` — Run SwiftLint analysis with JSON output
- `swiftlint_fix` — Auto-fix SwiftLint violations
- `swift_format_run` — Run swift-format lint
- `build_warnings` — Extract warnings from Xcode build logs

#### Physical Devices (4 tools)

- `physical_device_list` — List connected iOS devices via devicectl
- `physical_device_install` — Install app on physical device
- `physical_device_launch` — Launch app on physical device
- `physical_device_console` — Stream console logs from physical device

### Infrastructure

- TypeScript with ES modules and strict mode
- @modelcontextprotocol/sdk for MCP server
- Zod for input validation
- Vitest for testing (112 tests)
- ESLint + Prettier for code quality
- Husky + lint-staged for pre-commit hooks
- GitHub Actions CI (lint, typecheck, test on Node 20+22, build)
