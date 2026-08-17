import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";

interface DeviceAppearanceArgs {
  deviceId: string;
  appearance: string;
}

export async function deviceAppearance(
  args: DeviceAppearanceArgs,
  env: Environment,
): Promise<ToolResponse> {
  if (!env.simctlAvailable) {
    return errorResponse(
      "simctl is unavailable. Install full Xcode (not just Command Line Tools) and run: sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer",
    );
  }

  const result = await executeCommand("xcrun", [
    "simctl",
    "ui",
    args.deviceId,
    "appearance",
    args.appearance,
  ]);

  if (!result.success) {
    return errorResponse(result.stderr || "Failed to set appearance");
  }

  return textResponse(`Appearance set to ${args.appearance} on ${args.deviceId}.`);
}
