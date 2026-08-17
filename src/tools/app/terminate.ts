import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";
import { validateBundleId } from "../../utils/validation.js";

interface TerminateArgs {
  deviceId: string;
  bundleId: string;
}

export async function appTerminate(args: TerminateArgs, env: Environment): Promise<ToolResponse> {
  if (!env.simctlAvailable) {
    return errorResponse(
      "simctl is unavailable. Install full Xcode (not just Command Line Tools) and run: sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer",
    );
  }

  validateBundleId(args.bundleId);

  const result = await executeCommand("xcrun", [
    "simctl",
    "terminate",
    args.deviceId,
    args.bundleId,
  ]);

  if (!result.success) {
    return errorResponse(result.stderr || "Failed to terminate app");
  }

  return textResponse(`App ${args.bundleId} terminated on ${args.deviceId}.`);
}
