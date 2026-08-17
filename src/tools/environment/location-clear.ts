import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";

interface LocationClearArgs {
  deviceId: string;
}

export async function locationClear(
  args: LocationClearArgs,
  env: Environment,
): Promise<ToolResponse> {
  if (!env.simctlAvailable) {
    return errorResponse(
      "simctl is unavailable. Install full Xcode (not just Command Line Tools) and run: sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer",
    );
  }

  const result = await executeCommand("xcrun", ["simctl", "location", args.deviceId, "clear"]);

  if (!result.success) {
    return errorResponse(result.stderr || "Failed to clear location");
  }

  return textResponse(`Simulated location cleared on ${args.deviceId}.`);
}
