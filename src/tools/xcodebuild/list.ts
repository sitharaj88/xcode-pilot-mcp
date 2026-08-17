import { executeCommand } from "../../executor.js";
import type { Environment, ExecOptions } from "../../types.js";
import { execResultResponse, type ToolResponse } from "../../utils/response.js";
import { resolveProjectArgs } from "./build-utils.js";

interface ListArgs {
  projectPath?: string;
  timeoutSeconds?: number;
}

export async function xcodeList(args: ListArgs, env: Environment): Promise<ToolResponse> {
  const cmdArgs = ["-list", ...resolveProjectArgs(args.projectPath)];

  const timeout = (args.timeoutSeconds ?? 120) * 1000;
  const options: ExecOptions = { timeout };
  const result = await executeCommand(env.xcodebuildPath, cmdArgs, options);
  return execResultResponse(result);
}
