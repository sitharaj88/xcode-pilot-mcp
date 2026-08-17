import { executeCommand } from "../../executor.js";
import type { Environment, ExecOptions } from "../../types.js";
import { execResultResponse, type ToolResponse } from "../../utils/response.js";
import { validateAbsolutePath } from "../../utils/validation.js";

interface ExportArgs {
  archivePath: string;
  exportPath: string;
  exportOptionsPlist: string;
  timeoutSeconds?: number;
}

export async function xcodeExport(args: ExportArgs, env: Environment): Promise<ToolResponse> {
  validateAbsolutePath(args.archivePath);
  validateAbsolutePath(args.exportPath);
  validateAbsolutePath(args.exportOptionsPlist);

  const cmdArgs = [
    "-exportArchive",
    "-archivePath",
    args.archivePath,
    "-exportPath",
    args.exportPath,
    "-exportOptionsPlist",
    args.exportOptionsPlist,
  ];

  const timeout = (args.timeoutSeconds ?? 300) * 1000;
  const options: ExecOptions = { timeout };
  const result = await executeCommand(env.xcodebuildPath, cmdArgs, options);
  return execResultResponse(result);
}
