import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";

interface ListAppsArgs {
  deviceId: string;
}

export async function appList(args: ListAppsArgs, env: Environment): Promise<ToolResponse> {
  if (!env.simctlAvailable) {
    return errorResponse(
      "simctl is unavailable. Install full Xcode (not just Command Line Tools) and run: sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer",
    );
  }

  const result = await executeCommand("xcrun", ["simctl", "listapps", args.deviceId]);

  if (!result.success) {
    return errorResponse(result.stderr || "Failed to list apps. Is the simulator booted?");
  }

  return textResponse(result.stdout);
}
