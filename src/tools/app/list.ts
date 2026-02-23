import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";

interface ListAppsArgs {
  deviceId: string;
}

export async function appList(args: ListAppsArgs, _env: Environment): Promise<ToolResponse> {
  const result = await executeCommand("xcrun", ["simctl", "listapps", args.deviceId]);

  if (!result.success) {
    return errorResponse(result.stderr || "Failed to list apps. Is the simulator booted?");
  }

  return textResponse(result.stdout);
}
