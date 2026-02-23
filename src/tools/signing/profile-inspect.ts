import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { execResultResponse, type ToolResponse } from "../../utils/response.js";
import { validateAbsolutePath } from "../../utils/validation.js";

interface ProfileInspectArgs {
  profilePath: string;
}

export async function profileInspect(
  args: ProfileInspectArgs,
  _env: Environment,
): Promise<ToolResponse> {
  validateAbsolutePath(args.profilePath);

  const result = await executeCommand("security", ["cms", "-D", "-i", args.profilePath], {
    timeout: 10_000,
  });

  return execResultResponse(result);
}
