import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";

interface GetContainerArgs {
  deviceId: string;
  bundleId: string;
  container?: string;
}

export async function appGetContainer(
  args: GetContainerArgs,
  _env: Environment,
): Promise<ToolResponse> {
  const cmdArgs = ["simctl", "get_app_container", args.deviceId, args.bundleId];

  if (args.container) cmdArgs.push(args.container);

  const result = await executeCommand("xcrun", cmdArgs);

  if (!result.success) {
    return errorResponse(result.stderr || "Failed to get app container. Is the app installed?");
  }

  return textResponse(result.stdout.trim());
}
