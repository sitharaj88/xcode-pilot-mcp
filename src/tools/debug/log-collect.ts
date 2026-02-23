import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { execResultResponse, type ToolResponse } from "../../utils/response.js";

interface LogCollectArgs {
  deviceId: string;
  predicate?: string;
  last?: string;
  style?: string;
}

export async function logCollect(args: LogCollectArgs, _env: Environment): Promise<ToolResponse> {
  const cmdArgs = ["simctl", "spawn", args.deviceId, "log", "show"];

  if (args.last) cmdArgs.push("--last", args.last);
  if (args.predicate) cmdArgs.push("--predicate", args.predicate);
  if (args.style) cmdArgs.push("--style", args.style);

  const result = await executeCommand("xcrun", cmdArgs, { timeout: 30_000 });
  return execResultResponse(result);
}
