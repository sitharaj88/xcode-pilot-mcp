import { executeCommandWithStdin } from "../../executor.js";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";

interface PushNotificationArgs {
  deviceId: string;
  bundleId: string;
  payload: string;
}

export async function pushNotification(
  args: PushNotificationArgs,
  _env: Environment,
): Promise<ToolResponse> {
  try {
    JSON.parse(args.payload);
  } catch {
    return errorResponse("Invalid JSON payload. Provide a valid APNs payload JSON string.");
  }

  const result = await executeCommandWithStdin(
    "xcrun",
    ["simctl", "push", args.deviceId, args.bundleId, "-"],
    args.payload,
  );

  if (!result.success) {
    return errorResponse(result.stderr || "Failed to send push notification");
  }

  return textResponse(`Push notification sent to ${args.bundleId} on ${args.deviceId}.`);
}
