import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { execResultResponse, type ToolResponse } from "../../utils/response.js";
import { resolveProjectArgs } from "./build-utils.js";

interface ListArgs {
  projectPath?: string;
}

export async function xcodeList(args: ListArgs, env: Environment): Promise<ToolResponse> {
  const cmdArgs = ["-list", ...resolveProjectArgs(args.projectPath)];

  const result = await executeCommand(env.xcodebuildPath, cmdArgs, { timeout: 30_000 });
  return execResultResponse(result);
}
