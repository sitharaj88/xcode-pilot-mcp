import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";

interface StatusBarOverrideArgs {
  deviceId: string;
  time?: string;
  batteryLevel?: number;
  batteryState?: string;
  wifiBars?: number;
  cellularBars?: number;
  operatorName?: string;
  dataNetwork?: string;
}

export async function statusBarOverride(
  args: StatusBarOverrideArgs,
  _env: Environment,
): Promise<ToolResponse> {
  const cmdArgs = ["simctl", "status_bar", args.deviceId, "override"];

  if (args.time) cmdArgs.push("--time", args.time);
  if (args.batteryLevel !== undefined) cmdArgs.push("--batteryLevel", String(args.batteryLevel));
  if (args.batteryState) cmdArgs.push("--batteryState", args.batteryState);
  if (args.wifiBars !== undefined) cmdArgs.push("--wifiBars", String(args.wifiBars));
  if (args.cellularBars !== undefined) cmdArgs.push("--cellularBars", String(args.cellularBars));
  if (args.operatorName) cmdArgs.push("--operatorName", args.operatorName);
  if (args.dataNetwork) cmdArgs.push("--dataNetwork", args.dataNetwork);

  const result = await executeCommand("xcrun", cmdArgs);

  if (!result.success) {
    return errorResponse(result.stderr || "Failed to override status bar");
  }

  return textResponse(`Status bar overridden on ${args.deviceId}.`);
}
