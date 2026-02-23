import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";

interface CreateArgs {
  name: string;
  deviceTypeId: string;
  runtimeId: string;
}

export async function simulatorCreate(args: CreateArgs, _env: Environment): Promise<ToolResponse> {
  const result = await executeCommand("xcrun", [
    "simctl",
    "create",
    args.name,
    args.deviceTypeId,
    args.runtimeId,
  ]);

  if (!result.success) {
    return errorResponse(result.stderr || "Failed to create simulator");
  }

  const udid = result.stdout.trim();
  return textResponse(`Simulator created successfully.\nUDID: ${udid}\nName: ${args.name}`);
}
