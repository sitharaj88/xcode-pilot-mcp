import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { execResultResponse, type ToolResponse } from "../../utils/response.js";
import { validateAbsolutePath } from "../../utils/validation.js";

interface BinarySizeArgs {
  binaryPath: string;
}

export async function binarySize(args: BinarySizeArgs, _env: Environment): Promise<ToolResponse> {
  validateAbsolutePath(args.binaryPath);

  const result = await executeCommand("size", ["-m", args.binaryPath]);
  return execResultResponse(result);
}
