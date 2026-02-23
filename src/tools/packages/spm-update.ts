import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { execResultResponse, type ToolResponse } from "../../utils/response.js";

interface SpmUpdateArgs {
  projectPath?: string;
}

export async function spmUpdate(args: SpmUpdateArgs, _env: Environment): Promise<ToolResponse> {
  const result = await executeCommand("swift", ["package", "update"], {
    timeout: 300_000,
    cwd: args.projectPath,
  });

  return execResultResponse(result);
}
