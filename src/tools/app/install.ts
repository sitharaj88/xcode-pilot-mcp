import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";

interface InstallArgs {
  deviceId: string;
  appPath: string;
}

export async function appInstall(args: InstallArgs, _env: Environment): Promise<ToolResponse> {
  const result = await executeCommand("xcrun", ["simctl", "install", args.deviceId, args.appPath]);

  if (!result.success) {
    return errorResponse(result.stderr || "Failed to install app. Is the simulator booted?");
  }

  return textResponse(`App installed successfully on ${args.deviceId}.`);
}
