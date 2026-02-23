import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";

interface BootArgs {
  deviceId: string;
}

export async function simulatorBoot(args: BootArgs, _env: Environment): Promise<ToolResponse> {
  const result = await executeCommand("xcrun", ["simctl", "boot", args.deviceId]);

  if (!result.success) {
    if (result.stderr.includes("current state: Booted")) {
      return textResponse(`Simulator ${args.deviceId} is already booted.`);
    }
    return errorResponse(result.stderr || "Failed to boot simulator");
  }

  return textResponse(`Simulator ${args.deviceId} booted successfully.`);
}
