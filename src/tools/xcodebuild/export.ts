import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { execResultResponse, type ToolResponse } from "../../utils/response.js";
import { validateAbsolutePath } from "../../utils/validation.js";

interface ExportArgs {
  archivePath: string;
  exportPath: string;
  exportOptionsPlist: string;
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

  const result = await executeCommand(env.xcodebuildPath, cmdArgs, { timeout: 300_000 });
  return execResultResponse(result);
}
