import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";

interface LocationSetArgs {
  deviceId: string;
  latitude: number;
  longitude: number;
}

export async function locationSet(args: LocationSetArgs, env: Environment): Promise<ToolResponse> {
  if (!env.simctlAvailable) {
    return errorResponse(
      "simctl is unavailable. Install full Xcode (not just Command Line Tools) and run: sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer",
    );
  }

  const result = await executeCommand("xcrun", [
    "simctl",
    "location",
    args.deviceId,
    "set",
    `${args.latitude},${args.longitude}`,
  ]);

  if (!result.success) {
    return errorResponse(result.stderr || "Failed to set location");
  }

  return textResponse(`Location set to ${args.latitude}, ${args.longitude} on ${args.deviceId}.`);
}
