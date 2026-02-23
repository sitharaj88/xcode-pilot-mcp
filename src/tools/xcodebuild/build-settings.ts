import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { execResultResponse, type ToolResponse } from "../../utils/response.js";
import { resolveProjectArgs } from "./build-utils.js";

interface BuildSettingsArgs {
  projectPath?: string;
  scheme?: string;
  configuration?: string;
}

export async function xcodeBuildSettings(
  args: BuildSettingsArgs,
  env: Environment,
): Promise<ToolResponse> {
  const cmdArgs = ["-showBuildSettings", ...resolveProjectArgs(args.projectPath)];

  if (args.scheme) cmdArgs.push("-scheme", args.scheme);
  if (args.configuration) cmdArgs.push("-configuration", args.configuration);

  const result = await executeCommand(env.xcodebuildPath, cmdArgs, { timeout: 30_000 });
  return execResultResponse(result);
}
