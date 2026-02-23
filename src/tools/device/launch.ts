import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { execResultResponse, type ToolResponse } from "../../utils/response.js";

interface LaunchArgs {
  deviceId: string;
  bundleId: string;
}

export async function physicalDeviceLaunch(
  args: LaunchArgs,
  _env: Environment,
): Promise<ToolResponse> {
  const result = await executeCommand("xcrun", [
    "devicectl",
    "device",
    "process",
    "launch",
    "--device",
    args.deviceId,
    args.bundleId,
  ]);

  return execResultResponse(result);
}
