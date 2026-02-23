import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";

interface LaunchArgs {
  deviceId: string;
  bundleId: string;
  args?: string[];
  consolePty?: boolean;
}

export async function appLaunch(args: LaunchArgs, _env: Environment): Promise<ToolResponse> {
  const cmdArgs = ["simctl", "launch"];

  if (args.consolePty) cmdArgs.push("--console-pty");

  cmdArgs.push(args.deviceId, args.bundleId);

  if (args.args && args.args.length > 0) {
    cmdArgs.push(...args.args);
  }

  const result = await executeCommand("xcrun", cmdArgs);

  if (!result.success) {
    return errorResponse(result.stderr || "Failed to launch app. Is it installed?");
  }

  return textResponse(result.stdout || `App ${args.bundleId} launched on ${args.deviceId}.`);
}
