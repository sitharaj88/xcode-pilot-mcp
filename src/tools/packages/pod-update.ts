import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { execResultResponse, type ToolResponse } from "../../utils/response.js";
import { ValidationError } from "../../utils/validation.js";

interface PodUpdateArgs {
  projectPath?: string;
  podName?: string;
}

export async function podUpdate(args: PodUpdateArgs, _env: Environment): Promise<ToolResponse> {
  if (args.podName && args.podName.startsWith("-")) {
    throw new ValidationError(`Pod name cannot start with a dash: "${args.podName}"`);
  }

  const cmdArgs = ["update"];
  if (args.podName) cmdArgs.push(args.podName);

  const result = await executeCommand("pod", cmdArgs, {
    timeout: 300_000,
    cwd: args.projectPath,
  });

  return execResultResponse(result);
}
