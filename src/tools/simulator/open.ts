import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";

interface OpenArgs {
  deviceId: string;
}

export async function simulatorOpen(args: OpenArgs, _env: Environment): Promise<ToolResponse> {
  const result = await executeCommand("open", [
    "-a",
    "Simulator",
    "--args",
    "-CurrentDeviceUDID",
    args.deviceId,
  ]);

  if (!result.success) {
    return errorResponse(result.stderr || "Failed to open Simulator.app");
  }

  return textResponse(`Simulator.app opened for device ${args.deviceId}.`);
}
