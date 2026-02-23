import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { execResultResponse, type ToolResponse } from "../../utils/response.js";

interface PodOutdatedArgs {
  projectPath?: string;
}

export async function podOutdated(args: PodOutdatedArgs, _env: Environment): Promise<ToolResponse> {
  const result = await executeCommand("pod", ["outdated"], {
    cwd: args.projectPath,
  });

  return execResultResponse(result);
}
