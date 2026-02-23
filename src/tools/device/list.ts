import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";

export async function physicalDeviceList(_env: Environment): Promise<ToolResponse> {
  const result = await executeCommand("xcrun", ["devicectl", "list", "devices", "-j"]);

  if (!result.success) {
    return errorResponse(
      result.stderr ||
        "Failed to list devices. Ensure Xcode 15+ is installed and devicectl is available.",
    );
  }

  return textResponse(result.stdout);
}
