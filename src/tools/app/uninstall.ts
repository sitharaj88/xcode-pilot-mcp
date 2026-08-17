import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";
import { validateBundleId } from "../../utils/validation.js";

interface UninstallArgs {
  deviceId: string;
  bundleId: string;
}

export async function appUninstall(args: UninstallArgs, env: Environment): Promise<ToolResponse> {
  if (!env.simctlAvailable) {
    return errorResponse(
      "simctl is unavailable. Install full Xcode (not just Command Line Tools) and run: sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer",
    );
  }

  validateBundleId(args.bundleId);

  const result = await executeCommand("xcrun", [
    "simctl",
    "uninstall",
    args.deviceId,
    args.bundleId,
  ]);

  if (!result.success) {
    return errorResponse(result.stderr || "Failed to uninstall app");
  }

  return textResponse(`App ${args.bundleId} uninstalled from ${args.deviceId}.`);
}
