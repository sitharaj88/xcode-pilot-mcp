import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { execResultResponse, errorResponse, type ToolResponse } from "../../utils/response.js";

interface LogCollectArgs {
  deviceId: string;
  predicate?: string;
  last?: string;
  style?: string;
}

export async function logCollect(args: LogCollectArgs, env: Environment): Promise<ToolResponse> {
  if (!env.simctlAvailable) {
    return errorResponse(
      "simctl is unavailable. Install full Xcode (not just Command Line Tools) and run: sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer",
    );
  }

  const cmdArgs = ["simctl", "spawn", args.deviceId, "log", "show"];

  if (args.last) cmdArgs.push("--last", args.last);
  if (args.predicate) cmdArgs.push("--predicate", args.predicate);
  if (args.style) cmdArgs.push("--style", args.style);

  const result = await executeCommand("xcrun", cmdArgs, { timeout: 30_000 });
  return execResultResponse(result);
}
