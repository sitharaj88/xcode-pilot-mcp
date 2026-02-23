import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { execResultResponse, type ToolResponse } from "../../utils/response.js";
import { validateAbsolutePath } from "../../utils/validation.js";

interface EntitlementsCheckArgs {
  appPath: string;
}

export async function entitlementsCheck(
  args: EntitlementsCheckArgs,
  _env: Environment,
): Promise<ToolResponse> {
  validateAbsolutePath(args.appPath);

  const result = await executeCommand("codesign", ["-d", "--entitlements", "-", args.appPath]);

  return execResultResponse(result);
}
