import { executeCommand } from "./executor.js";
import type { Environment } from "./types.js";
import { logger } from "./utils/logger.js";

export async function detectEnvironment(): Promise<Environment> {
  logger.info("Detecting Xcode environment...");

  const xcodeResult = await executeCommand("xcode-select", ["-p"], { timeout: 10_000 });
  if (!xcodeResult.success) {
    logger.warn(
      "Xcode is not installed or xcode-select path is not set. " +
        "Install Xcode from the App Store and run: sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer",
    );
  }
  const xcodePath = xcodeResult.success ? xcodeResult.stdout.trim() : "";

  const xcrunResult = await executeCommand("which", ["xcrun"], { timeout: 5_000 });
  if (!xcrunResult.success) {
    logger.warn("xcrun not found. Ensure Xcode Command Line Tools are installed.");
  }
  const xcrunPath = xcrunResult.success ? xcrunResult.stdout.trim() : "";

  const xcodebuildResult = await executeCommand("which", ["xcodebuild"], { timeout: 5_000 });
  if (!xcodebuildResult.success) {
    logger.warn("xcodebuild not found. Ensure Xcode is installed.");
  }
  const xcodebuildPath = xcodebuildResult.success ? xcodebuildResult.stdout.trim() : "";
  const xcodebuildAvailable = xcodebuildResult.success;

  const simctlCheck = await executeCommand("xcrun", ["simctl", "help"], { timeout: 10_000 });
  const simctlAvailable = simctlCheck.success;

  const devicectlCheck = await executeCommand("xcrun", ["devicectl", "list", "devices", "--help"], {
    timeout: 10_000,
  });
  const devicectlAvailable = devicectlCheck.success;

  const env: Environment = {
    xcodePath,
    xcrunPath,
    xcodebuildPath,
    xcodebuildAvailable,
    simctlAvailable,
    devicectlAvailable,
  };

  logger.info("Environment detected", {
    xcodePath,
    xcodebuildAvailable,
    simctlAvailable,
    devicectlAvailable,
  });

  return env;
}
