import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";
import { validateBundleId } from "../../utils/validation.js";

interface PrivacyArgs {
  deviceId: string;
  action: string;
  service: string;
  bundleId?: string;
}

export async function appPrivacy(args: PrivacyArgs, env: Environment): Promise<ToolResponse> {
  if (!env.simctlAvailable) {
    return errorResponse(
      "simctl is unavailable. Install full Xcode (not just Command Line Tools) and run: sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer",
    );
  }

  const cmdArgs = ["simctl", "privacy", args.deviceId, args.action, args.service];

  if (args.bundleId) {
    validateBundleId(args.bundleId);
    cmdArgs.push(args.bundleId);
  } else if (args.action !== "reset") {
    return errorResponse("bundleId is required for grant and revoke actions");
  }

  const result = await executeCommand("xcrun", cmdArgs);

  if (!result.success) {
    return errorResponse(result.stderr || `Failed to ${args.action} ${args.service} permission`);
  }

  return textResponse(
    `Privacy: ${args.action} ${args.service} for ${args.bundleId || "all apps"} on ${args.deviceId}.`,
  );
}
