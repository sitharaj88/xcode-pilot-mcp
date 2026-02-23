import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";

export async function simulatorListRuntimes(_env: Environment): Promise<ToolResponse> {
  const result = await executeCommand("xcrun", ["simctl", "list", "runtimes", "-j"]);

  if (!result.success) {
    return errorResponse(result.stderr || "Failed to list runtimes");
  }

  return textResponse(result.stdout);
}
