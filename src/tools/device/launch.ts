import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { execResultResponse, errorResponse, type ToolResponse } from "../../utils/response.js";
import { validateBundleId } from "../../utils/validation.js";

interface LaunchArgs {
  deviceId: string;
  bundleId: string;
}

export async function physicalDeviceLaunch(
  args: LaunchArgs,
  env: Environment,
): Promise<ToolResponse> {
  if (!env.devicectlAvailable) {
    return errorResponse(
      "devicectl is unavailable. It requires Xcode 15 or later with full Xcode installed (not just Command Line Tools).",
    );
  }

  validateBundleId(args.bundleId);

  const result = await executeCommand("xcrun", [
    "devicectl",
    "device",
    "process",
    "launch",
    "--device",
    args.deviceId,
    args.bundleId,
  ]);

  return execResultResponse(result);
}
