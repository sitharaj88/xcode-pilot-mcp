import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";

interface TerminateArgs {
  deviceId: string;
  bundleId: string;
}

export async function appTerminate(args: TerminateArgs, _env: Environment): Promise<ToolResponse> {
  const result = await executeCommand("xcrun", [
    "simctl",
    "terminate",
    args.deviceId,
    args.bundleId,
  ]);

  if (!result.success) {
    return errorResponse(result.stderr || "Failed to terminate app");
  }

  return textResponse(`App ${args.bundleId} terminated on ${args.deviceId}.`);
}
