import { executeCommand } from "../../executor.js";
import type { Environment, ExecOptions } from "../../types.js";
import { execResultResponse, type ToolResponse } from "../../utils/response.js";
import { validateAbsolutePath } from "../../utils/validation.js";
import { resolveProjectArgs } from "./build-utils.js";

interface ArchiveArgs {
  scheme: string;
  archivePath: string;
  projectPath?: string;
  configuration?: string;
  timeoutSeconds?: number;
}

export async function xcodeArchive(args: ArchiveArgs, env: Environment): Promise<ToolResponse> {
  validateAbsolutePath(args.archivePath);

  const cmdArgs = [
    "archive",
    ...resolveProjectArgs(args.projectPath),
    "-scheme",
    args.scheme,
    "-archivePath",
    args.archivePath,
  ];

  if (args.configuration) cmdArgs.push("-configuration", args.configuration);

  const timeout = (args.timeoutSeconds ?? 600) * 1000;
  const options: ExecOptions = { timeout };
  const result = await executeCommand(env.xcodebuildPath, cmdArgs, options);
  return execResultResponse(result);
}
