import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";

interface LocationClearArgs {
  deviceId: string;
}

export async function locationClear(
  args: LocationClearArgs,
  _env: Environment,
): Promise<ToolResponse> {
  const result = await executeCommand("xcrun", ["simctl", "location", args.deviceId, "clear"]);

  if (!result.success) {
    return errorResponse(result.stderr || "Failed to clear location");
  }

  return textResponse(`Simulated location cleared on ${args.deviceId}.`);
}
