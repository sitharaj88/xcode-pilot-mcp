# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-08-17

### Fixed

- `physical_device_console` — Reimplemented to require bundleId and launch app via `devicectl device process launch --console`
- `physical_device_list` — Fixed JSON output parsing by using temp file
- `app_launch` with `consolePty` — Now returns captured console output in response instead of returning early
- `project_create` — Rewritten to generate XcodeGen project.yml and run `xcodegen generate`
- `scaffold_widget` kind:"configurable" — Fixed to use modern AppIntents-based API (iOS 17+)
- `build_warnings` — Fixed gzip handling and build log parsing
- Entitlements XML extraction — Fixed --xml format parsing
- Provisioning profile parsing — Improved robustness with header/footer validation
- Response truncation — Implemented head+tail strategy to preserve both start and end of long logs; 100KB cap on success and error output
- Error response cap — Errors now properly capped at 100KB to prevent protocol overflow
- Log capture timeout vs maxBuffer — Clarified semantics and fixed edge cases
- Graceful startup without Xcode — Server now starts successfully and provides clear guidance when xcodebuild/devicectl unavailable
- Swift identifier validation — Fixed to accept leading underscore

### Added

- `timeoutSeconds` parameter (30-3600 sec) on all xcodebuild tools with appropriate defaults
- `app_launch` `timeout` parameter (1-300 sec, default 30) for console capture duration
- `physical_device_console` `timeout` parameter (1-300 sec, default 10)
- Bundle ID validation with required format checks
- Latitude/longitude range validation (±90/±180) in `location_set`
- IPA size guard to warn on large binaries
- Availability guards for Xcode/devicectl detection at startup
- WidgetConfigurable.swift.template for iOS 17+ AppIntents widgets
- Templates now documented as source of truth for scaffold tools

### Removed

- `keyboard_input` tool — iOS simulator no longer exposes reliable keyboard input API
- `accessibility_audit` tool — Functionality moved to native Xcode accessibility inspector

### Changed

- `physical_device_list` — Now uses --json-output via temporary file (no user-facing change)
- `project_create` — Now generates both sources and XcodeGen project.yml; runs `xcodegen generate` if installed
- `scaffold_coredata_model` — Documentation clarified: response notes matching .xcdatamodeld entity is required
- Physical device + simulator tools — Return clear guidance instead of raw errors when tools unavailable

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
