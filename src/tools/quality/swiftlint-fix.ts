import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { execResultResponse, type ToolResponse } from "../../utils/response.js";

interface SwiftlintFixArgs {
  path?: string;
  config?: string;
}

export async function swiftlintFix(
  args: SwiftlintFixArgs,
  _env: Environment,
): Promise<ToolResponse> {
  const cmdArgs = ["lint", "--fix"];

  if (args.path) cmdArgs.push("--path", args.path);
  if (args.config) cmdArgs.push("--config", args.config);

  const result = await executeCommand("swiftlint", cmdArgs, { timeout: 120_000 });
  return execResultResponse(result);
}
