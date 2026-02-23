import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";
import { tmpdir } from "node:os";
import { join } from "node:path";

interface ScreenshotArgs {
  deviceId: string;
  outputPath?: string;
}

export async function screenshot(args: ScreenshotArgs, _env: Environment): Promise<ToolResponse> {
  const outputPath = args.outputPath || join(tmpdir(), `screenshot-${Date.now()}.png`);

  const result = await executeCommand("xcrun", [
    "simctl",
    "io",
    args.deviceId,
    "screenshot",
    outputPath,
  ]);

  if (!result.success) {
    return errorResponse(result.stderr || "Failed to capture screenshot. Is the simulator booted?");
  }

  return textResponse(`Screenshot saved to: ${outputPath}`);
}
