import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";

interface UninstallArgs {
  deviceId: string;
  bundleId: string;
}

export async function appUninstall(args: UninstallArgs, _env: Environment): Promise<ToolResponse> {
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
