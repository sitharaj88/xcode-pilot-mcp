import { executeCommandWithStdin } from "../../executor.js";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";
import { validateBundleId } from "../../utils/validation.js";

const APNS_MAX_PAYLOAD_BYTES = 4096;

interface PushNotificationArgs {
  deviceId: string;
  bundleId: string;
  payload: string;
}

export async function pushNotification(
  args: PushNotificationArgs,
  env: Environment,
): Promise<ToolResponse> {
  if (!env.simctlAvailable) {
    return errorResponse(
      "simctl is unavailable. Install full Xcode (not just Command Line Tools) and run: sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer",
    );
  }

  validateBundleId(args.bundleId);

  let parsed: unknown;
  try {
    parsed = JSON.parse(args.payload);
  } catch {
    return errorResponse("Invalid JSON payload. Provide a valid APNs payload JSON string.");
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    Array.isArray(parsed) ||
    !("aps" in parsed)
  ) {
    return errorResponse(
      'Invalid APNs payload. The payload must be a JSON object containing an "aps" key.',
    );
  }

  const payloadBytes = Buffer.byteLength(args.payload, "utf-8");
  if (payloadBytes > APNS_MAX_PAYLOAD_BYTES) {
    return errorResponse(
      `Payload too large: ${payloadBytes} bytes exceeds the APNs limit of ${APNS_MAX_PAYLOAD_BYTES} bytes.`,
    );
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
