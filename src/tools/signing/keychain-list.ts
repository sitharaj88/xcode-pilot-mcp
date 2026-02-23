import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { execResultResponse, type ToolResponse } from "../../utils/response.js";

export async function keychainList(_env: Environment): Promise<ToolResponse> {
  const result = await executeCommand("security", ["list-keychains"]);
  return execResultResponse(result);
}
