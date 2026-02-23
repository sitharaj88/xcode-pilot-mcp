import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";

interface OpenUrlArgs {
  deviceId: string;
  url: string;
}

export async function appOpenUrl(args: OpenUrlArgs, _env: Environment): Promise<ToolResponse> {
  const result = await executeCommand("xcrun", ["simctl", "openurl", args.deviceId, args.url]);

  if (!result.success) {
    return errorResponse(result.stderr || "Failed to open URL");
  }

  return textResponse(`URL opened on ${args.deviceId}: ${args.url}`);
}
