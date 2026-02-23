import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";

interface DeviceAppearanceArgs {
  deviceId: string;
  appearance: string;
}

export async function deviceAppearance(
  args: DeviceAppearanceArgs,
  _env: Environment,
): Promise<ToolResponse> {
  const result = await executeCommand("xcrun", [
    "simctl",
    "ui",
    args.deviceId,
    "appearance",
    args.appearance,
  ]);

  if (!result.success) {
    return errorResponse(result.stderr || "Failed to set appearance");
  }

  return textResponse(`Appearance set to ${args.appearance} on ${args.deviceId}.`);
}
