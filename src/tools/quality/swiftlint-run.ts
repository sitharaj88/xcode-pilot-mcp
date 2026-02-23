import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";

interface SwiftlintRunArgs {
  path?: string;
  config?: string;
}

export async function swiftlintRun(
  args: SwiftlintRunArgs,
  _env: Environment,
): Promise<ToolResponse> {
  const cmdArgs = ["lint", "--reporter", "json"];

  if (args.path) cmdArgs.push("--path", args.path);
  if (args.config) cmdArgs.push("--config", args.config);

  const result = await executeCommand("swiftlint", cmdArgs, { timeout: 120_000 });

  if (result.stdout) {
    try {
      const violations = JSON.parse(result.stdout);
      if (Array.isArray(violations)) {
        const summary = `SwiftLint found ${violations.length} violation(s).\n\n`;
        return textResponse(summary + result.stdout);
      }
    } catch {
      // Not JSON, return raw
    }
  }

  if (!result.success && !result.stdout) {
    return errorResponse(
      result.stderr || "SwiftLint failed. Is swiftlint installed? (brew install swiftlint)",
    );
  }

  return textResponse(result.stdout || "No violations found.");
}
