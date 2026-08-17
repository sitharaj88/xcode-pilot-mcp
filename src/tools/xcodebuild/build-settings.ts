import { executeCommand } from "../../executor.js";
import type { Environment, ExecOptions } from "../../types.js";
import { execResultResponse, type ToolResponse } from "../../utils/response.js";
import { resolveProjectArgs } from "./build-utils.js";

interface BuildSettingsArgs {
  projectPath?: string;
  scheme?: string;
  configuration?: string;
  timeoutSeconds?: number;
}

export async function xcodeBuildSettings(
  args: BuildSettingsArgs,
  env: Environment,
): Promise<ToolResponse> {
  const cmdArgs = ["-showBuildSettings", ...resolveProjectArgs(args.projectPath)];

  if (args.scheme) cmdArgs.push("-scheme", args.scheme);
  if (args.configuration) cmdArgs.push("-configuration", args.configuration);

  const timeout = (args.timeoutSeconds ?? 120) * 1000;
  const options: ExecOptions = { timeout };
  const result = await executeCommand(env.xcodebuildPath, cmdArgs, options);
  return execResultResponse(result);
}
