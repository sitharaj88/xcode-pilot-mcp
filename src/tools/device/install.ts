import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { execResultResponse, type ToolResponse } from "../../utils/response.js";

interface InstallArgs {
  deviceId: string;
  appPath: string;
}

export async function physicalDeviceInstall(
  args: InstallArgs,
  _env: Environment,
): Promise<ToolResponse> {
  const result = await executeCommand(
    "xcrun",
    ["devicectl", "device", "install", "app", "--device", args.deviceId, args.appPath],
    { timeout: 120_000 },
  );

  return execResultResponse(result);
}
