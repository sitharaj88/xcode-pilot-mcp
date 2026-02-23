import { executeCommand } from "./executor.js";
import type { Environment } from "./types.js";
import { logger } from "./utils/logger.js";

export async function detectEnvironment(): Promise<Environment> {
  logger.info("Detecting Xcode environment...");

  const xcodeResult = await executeCommand("xcode-select", ["-p"], { timeout: 10_000 });
  if (!xcodeResult.success) {
    throw new Error(
      "Xcode is not installed or xcode-select path is not set. " +
        "Install Xcode from the App Store and run: sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer",
    );
  }
  const xcodePath = xcodeResult.stdout.trim();

  const xcrunResult = await executeCommand("which", ["xcrun"], { timeout: 5_000 });
  if (!xcrunResult.success) {
    throw new Error("xcrun not found. Ensure Xcode Command Line Tools are installed.");
  }
  const xcrunPath = xcrunResult.stdout.trim();

  const xcodebuildResult = await executeCommand("which", ["xcodebuild"], { timeout: 5_000 });
  if (!xcodebuildResult.success) {
    throw new Error("xcodebuild not found. Ensure Xcode is installed.");
  }
  const xcodebuildPath = xcodebuildResult.stdout.trim();

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
    simctlAvailable,
    devicectlAvailable,
  };

  logger.info("Environment detected", {
    xcodePath,
    simctlAvailable,
    devicectlAvailable,
  });

  return env;
}
