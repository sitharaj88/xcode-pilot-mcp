import { spawn } from "node:child_process";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";

interface ConsoleArgs {
  deviceId: string;
  timeout?: number;
}

export async function physicalDeviceConsole(
  args: ConsoleArgs,
  _env: Environment,
): Promise<ToolResponse> {
  const duration = args.timeout ?? 10;

  return new Promise((resolve) => {
    let output = "";
    const child = spawn("xcrun", [
      "devicectl",
      "device",
      "process",
      "console",
      "--device",
      args.deviceId,
    ]);

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
        resolve(textResponse("No console output captured in the given timeframe."));
      }
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      resolve(errorResponse(`Failed to start device console: ${err.message}`));
    });
  });
}
