import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { execResultResponse, type ToolResponse } from "../../utils/response.js";

export async function signingIdentities(_env: Environment): Promise<ToolResponse> {
  const result = await executeCommand("security", ["find-identity", "-v", "-p", "codesigning"]);
  return execResultResponse(result);
}
