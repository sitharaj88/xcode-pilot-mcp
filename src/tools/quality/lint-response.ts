import type { ExecResult } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";

/**
 * Lint tools (swiftlint, swift-format) exit non-zero when violations remain,
 * even though the run itself succeeded and produced a report. Only treat the
 * run as a real failure when there is no output at all (tool missing, crash).
 */
export function lintExecResponse(result: ExecResult, notInstalledHint: string): ToolResponse {
  if (result.bufferExceeded) {
    return errorResponse(
      `Output exceeded the 10MB buffer limit.\n\nPartial stdout:\n${result.stdout}\n\nPartial stderr:\n${result.stderr}`,
    );
  }

  if (result.timedOut) {
    return errorResponse(
      `Command timed out.\n\nPartial stdout:\n${result.stdout}\n\nPartial stderr:\n${result.stderr}`,
    );
  }

  if (!result.success && !result.stdout && !result.stderr) {
    return errorResponse(notInstalledHint);
  }

  if (!result.success && !result.stdout) {
    return textResponse(result.stderr);
  }

  return textResponse(result.stdout || result.stderr || "No violations found.");
}
