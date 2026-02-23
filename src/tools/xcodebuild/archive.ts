import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { execResultResponse, type ToolResponse } from "../../utils/response.js";
import { resolveProjectArgs } from "./build-utils.js";

interface ArchiveArgs {
  scheme: string;
  archivePath: string;
  projectPath?: string;
  configuration?: string;
}

export async function xcodeArchive(args: ArchiveArgs, env: Environment): Promise<ToolResponse> {
  const cmdArgs = [
    "archive",
    ...resolveProjectArgs(args.projectPath),
    "-scheme",
    args.scheme,
    "-archivePath",
    args.archivePath,
  ];

  if (args.configuration) cmdArgs.push("-configuration", args.configuration);

  const result = await executeCommand(env.xcodebuildPath, cmdArgs, { timeout: 600_000 });
  return execResultResponse(result);
}
