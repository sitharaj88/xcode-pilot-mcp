import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { execResultResponse, type ToolResponse } from "../../utils/response.js";

interface AccessibilityAuditArgs {
  deviceId: string;
}

export async function accessibilityAudit(
  args: AccessibilityAuditArgs,
  _env: Environment,
): Promise<ToolResponse> {
  const result = await executeCommand("xcrun", ["simctl", "accessibility_audit", args.deviceId]);

  return execResultResponse(result);
}
