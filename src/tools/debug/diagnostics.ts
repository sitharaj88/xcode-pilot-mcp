import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";

interface DiagnosticsArgs {
  outputPath?: string;
}

export async function diagnostics(args: DiagnosticsArgs, _env: Environment): Promise<ToolResponse> {
  const cmdArgs = ["simctl", "diagnose", "-b"];

  if (args.outputPath) cmdArgs.push("-o", args.outputPath);

  const result = await executeCommand("xcrun", cmdArgs, { timeout: 120_000 });

  if (!result.success) {
    return errorResponse(result.stderr || "Failed to collect diagnostics");
  }

  return textResponse(result.stdout || "Diagnostics collected successfully.");
}
