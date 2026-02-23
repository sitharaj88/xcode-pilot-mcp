import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { execResultResponse, type ToolResponse } from "../../utils/response.js";

interface PodInstallArgs {
  projectPath?: string;
  repoUpdate?: boolean;
}

export async function podInstall(args: PodInstallArgs, _env: Environment): Promise<ToolResponse> {
  const cmdArgs = ["install"];
  if (args.repoUpdate) cmdArgs.push("--repo-update");

  const result = await executeCommand("pod", cmdArgs, {
    timeout: 300_000,
    cwd: args.projectPath,
  });

  return execResultResponse(result);
}
