import { spawn } from "node:child_process";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";

interface LogStreamArgs {
  deviceId: string;
  predicate?: string;
  level?: string;
  timeout?: number;
}

export async function logStream(args: LogStreamArgs, _env: Environment): Promise<ToolResponse> {
  const duration = args.timeout ?? 10;
  const cmdArgs = ["simctl", "spawn", args.deviceId, "log", "stream"];

  if (args.predicate) cmdArgs.push("--predicate", args.predicate);
  if (args.level) cmdArgs.push("--level", args.level);

  return new Promise((resolve) => {
    let output = "";
    const child = spawn("xcrun", cmdArgs);

    const timer = setTimeout(() => {
      child.kill("SIGINT");
    }, duration * 1000);

    child.stdout?.on("data", (data: Buffer) => {
      output += data.toString();
      if (output.length > 100_000) {
        child.kill("SIGINT");
      }
    });

    child.stderr?.on("data", (data: Buffer) => {
      output += data.toString();
    });

    child.on("close", () => {
      clearTimeout(timer);
      if (output.trim()) {
        resolve(textResponse(output));
      } else {
        resolve(textResponse("No log entries captured in the given timeframe."));
      }
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      resolve(errorResponse(`Failed to stream logs: ${err.message}`));
    });
  });
}
