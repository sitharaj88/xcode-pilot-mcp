import { spawn } from "node:child_process";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";
import { tmpdir } from "node:os";
import { join } from "node:path";

interface ScreenRecordArgs {
  deviceId: string;
  outputPath?: string;
  duration?: number;
}

export async function screenRecord(
  args: ScreenRecordArgs,
  _env: Environment,
): Promise<ToolResponse> {
  const duration = args.duration ?? 10;
  const outputPath = args.outputPath || join(tmpdir(), `recording-${Date.now()}.mp4`);

  return new Promise((resolve) => {
    const child = spawn("xcrun", ["simctl", "io", args.deviceId, "recordVideo", outputPath]);

    let stderr = "";

    child.stderr?.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    const timer = setTimeout(() => {
      child.kill("SIGINT");
    }, duration * 1000);

    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0 || code === null) {
        resolve(textResponse(`Screen recording saved to: ${outputPath}\nDuration: ${duration}s`));
      } else {
        resolve(errorResponse(stderr || "Failed to record screen. Is the simulator booted?"));
      }
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      resolve(errorResponse(`Failed to start screen recording: ${err.message}`));
    });
  });
}
