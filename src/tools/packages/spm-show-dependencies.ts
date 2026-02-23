import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { execResultResponse, type ToolResponse } from "../../utils/response.js";

interface SpmShowDependenciesArgs {
  projectPath?: string;
}

export async function spmShowDependencies(
  args: SpmShowDependenciesArgs,
  _env: Environment,
): Promise<ToolResponse> {
  const result = await executeCommand(
    "swift",
    ["package", "show-dependencies", "--format", "json"],
    { cwd: args.projectPath },
  );

  return execResultResponse(result);
}
