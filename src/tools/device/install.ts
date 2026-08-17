import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { execResultResponse, errorResponse, type ToolResponse } from "../../utils/response.js";
import { validateAbsolutePath } from "../../utils/validation.js";

interface InstallArgs {
  deviceId: string;
  appPath: string;
}

export async function physicalDeviceInstall(
  args: InstallArgs,
  env: Environment,
): Promise<ToolResponse> {
  if (!env.devicectlAvailable) {
    return errorResponse(
      "devicectl is unavailable. It requires Xcode 15 or later with full Xcode installed (not just Command Line Tools).",
    );
  }

  validateAbsolutePath(args.appPath);

  const result = await executeCommand(
    "xcrun",
    ["devicectl", "device", "install", "app", "--device", args.deviceId, args.appPath],
    { timeout: 300_000 },
  );

  return execResultResponse(result);
}
