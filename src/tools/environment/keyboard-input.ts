import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";

interface KeyboardInputArgs {
  deviceId: string;
  text: string;
}

export async function keyboardInput(
  args: KeyboardInputArgs,
  _env: Environment,
): Promise<ToolResponse> {
  const result = await executeCommand("xcrun", ["simctl", "io", args.deviceId, "input", args.text]);

  if (!result.success) {
    return errorResponse(
      result.stderr || "Failed to send keyboard input. The simulator may not support this command.",
    );
  }

  return textResponse(`Text input sent to ${args.deviceId}: "${args.text}"`);
}
