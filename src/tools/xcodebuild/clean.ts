import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { execResultResponse, type ToolResponse } from "../../utils/response.js";
import { resolveProjectArgs } from "./build-utils.js";

interface CleanArgs {
  scheme: string;
  projectPath?: string;
}

export async function xcodeClean(args: CleanArgs, env: Environment): Promise<ToolResponse> {
  const cmdArgs = ["clean", ...resolveProjectArgs(args.projectPath), "-scheme", args.scheme];

  const result = await executeCommand(env.xcodebuildPath, cmdArgs);
  return execResultResponse(result);
}
