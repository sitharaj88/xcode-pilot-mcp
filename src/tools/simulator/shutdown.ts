import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";

interface ShutdownArgs {
  deviceId?: string;
}

export async function simulatorShutdown(
  args: ShutdownArgs,
  _env: Environment,
): Promise<ToolResponse> {
  const target = args.deviceId || "all";
  const result = await executeCommand("xcrun", ["simctl", "shutdown", target]);

  if (!result.success) {
    if (result.stderr.includes("current state: Shutdown")) {
      return textResponse(`Simulator ${target} is already shut down.`);
    }
    return errorResponse(result.stderr || "Failed to shutdown simulator");
  }

  return textResponse(`Simulator ${target} shut down successfully.`);
}
