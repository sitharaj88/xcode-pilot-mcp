import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";

interface OpenUrlArgs {
  deviceId: string;
  url: string;
}

export async function appOpenUrl(args: OpenUrlArgs, env: Environment): Promise<ToolResponse> {
  if (!env.simctlAvailable) {
    return errorResponse(
      "simctl is unavailable. Install full Xcode (not just Command Line Tools) and run: sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer",
    );
  }

  const result = await executeCommand("xcrun", ["simctl", "openurl", args.deviceId, args.url]);

  if (!result.success) {
    return errorResponse(result.stderr || "Failed to open URL");
  }

  return textResponse(`URL opened on ${args.deviceId}: ${args.url}`);
}
