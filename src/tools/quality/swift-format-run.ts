import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { type ToolResponse } from "../../utils/response.js";
import { lintExecResponse } from "./lint-response.js";

interface SwiftFormatRunArgs {
  path: string;
  recursive?: boolean;
}

export async function swiftFormatRun(
  args: SwiftFormatRunArgs,
  _env: Environment,
): Promise<ToolResponse> {
  const cmdArgs = ["lint"];

  if (args.recursive !== false) cmdArgs.push("--recursive");
  cmdArgs.push(args.path);

  const result = await executeCommand("swift-format", cmdArgs, { timeout: 120_000 });
  return lintExecResponse(
    result,
    "swift-format failed. Is swift-format installed? (brew install swift-format)",
  );
}
