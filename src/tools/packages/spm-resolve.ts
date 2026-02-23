import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { execResultResponse, type ToolResponse } from "../../utils/response.js";
import { resolveProjectArgs } from "../xcodebuild/build-utils.js";

interface SpmResolveArgs {
  projectPath?: string;
  scheme?: string;
  clonedSourcePackagesDir?: string;
}

export async function spmResolve(args: SpmResolveArgs, env: Environment): Promise<ToolResponse> {
  const cmdArgs = ["-resolvePackageDependencies", ...resolveProjectArgs(args.projectPath)];

  if (args.scheme) cmdArgs.push("-scheme", args.scheme);
  if (args.clonedSourcePackagesDir) {
    cmdArgs.push("-clonedSourcePackagesDirPath", args.clonedSourcePackagesDir);
  }

  const result = await executeCommand(env.xcodebuildPath, cmdArgs, { timeout: 300_000 });
  return execResultResponse(result);
}
