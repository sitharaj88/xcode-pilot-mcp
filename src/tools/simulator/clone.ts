import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";

interface CloneArgs {
  deviceId: string;
  newName: string;
}

export async function simulatorClone(args: CloneArgs, _env: Environment): Promise<ToolResponse> {
  const result = await executeCommand("xcrun", ["simctl", "clone", args.deviceId, args.newName]);

  if (!result.success) {
    return errorResponse(result.stderr || "Failed to clone simulator");
  }

  const udid = result.stdout.trim();
  return textResponse(`Simulator cloned successfully.\nNew UDID: ${udid}\nName: ${args.newName}`);
}
