import { executeCommand } from "../../executor.js";
import type { Environment, ExecOptions } from "../../types.js";
import { execResultResponse, type ToolResponse } from "../../utils/response.js";
import { resolveProjectArgs } from "./build-utils.js";

interface BuildArgs {
  scheme: string;
  projectPath?: string;
  configuration?: string;
  destination?: string;
  sdk?: string;
  derivedDataPath?: string;
  extraArgs?: string[];
  timeoutSeconds?: number;
}

export async function xcodeBuild(args: BuildArgs, env: Environment): Promise<ToolResponse> {
  const cmdArgs = ["build", ...resolveProjectArgs(args.projectPath), "-scheme", args.scheme];

  if (args.configuration) cmdArgs.push("-configuration", args.configuration);
  if (args.destination) cmdArgs.push("-destination", args.destination);
  if (args.sdk) cmdArgs.push("-sdk", args.sdk);
  if (args.derivedDataPath) cmdArgs.push("-derivedDataPath", args.derivedDataPath);
  if (args.extraArgs) cmdArgs.push(...args.extraArgs);

  const timeout = (args.timeoutSeconds ?? 600) * 1000;
  const options: ExecOptions = { timeout };
  const result = await executeCommand(env.xcodebuildPath, cmdArgs, options);
  return execResultResponse(result);
}
