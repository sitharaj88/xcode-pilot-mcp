import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";

interface DeleteArgs {
  deviceId: string;
}

export async function simulatorDelete(args: DeleteArgs, _env: Environment): Promise<ToolResponse> {
  const result = await executeCommand("xcrun", ["simctl", "delete", args.deviceId]);

  if (!result.success) {
    return errorResponse(result.stderr || "Failed to delete simulator");
  }

  return textResponse(`Simulator ${args.deviceId} deleted successfully.`);
}
