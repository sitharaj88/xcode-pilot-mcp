import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";

export async function simulatorListDeviceTypes(_env: Environment): Promise<ToolResponse> {
  const result = await executeCommand("xcrun", ["simctl", "list", "devicetypes", "-j"]);

  if (!result.success) {
    return errorResponse(result.stderr || "Failed to list device types");
  }

  return textResponse(result.stdout);
}
