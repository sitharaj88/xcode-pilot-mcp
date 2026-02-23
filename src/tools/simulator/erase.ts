import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";

interface EraseArgs {
  deviceId: string;
}

export async function simulatorErase(args: EraseArgs, _env: Environment): Promise<ToolResponse> {
  const result = await executeCommand("xcrun", ["simctl", "erase", args.deviceId]);

  if (!result.success) {
    return errorResponse(result.stderr || "Failed to erase simulator");
  }

  return textResponse(`Simulator ${args.deviceId} erased successfully.`);
}
