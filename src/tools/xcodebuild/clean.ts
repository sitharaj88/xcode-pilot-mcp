import { executeCommand } from "../../executor.js";
import type { Environment, ExecOptions } from "../../types.js";
import { execResultResponse, type ToolResponse } from "../../utils/response.js";
import { resolveProjectArgs } from "./build-utils.js";

interface CleanArgs {
  scheme: string;
  projectPath?: string;
  timeoutSeconds?: number;
}

export async function xcodeClean(args: CleanArgs, env: Environment): Promise<ToolResponse> {
  const cmdArgs = ["clean", ...resolveProjectArgs(args.projectPath), "-scheme", args.scheme];

  const timeout = (args.timeoutSeconds ?? 600) * 1000;
  const options: ExecOptions = { timeout };
  const result = await executeCommand(env.xcodebuildPath, cmdArgs, options);
  return execResultResponse(result);
}
