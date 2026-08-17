import { spawn } from "node:child_process";
import { statSync } from "node:fs";
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
  env: Environment,
): Promise<ToolResponse> {
  if (!env.simctlAvailable) {
    return errorResponse(
      "simctl is unavailable. Install full Xcode (not just Command Line Tools) and run: sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer",
    );
  }

  const duration = args.duration ?? 10;
  const outputPath = args.outputPath || join(tmpdir(), `recording-${Date.now()}.mp4`);

  return new Promise((resolve) => {
    const child = spawn("xcrun", ["simctl", "io", args.deviceId, "recordVideo", outputPath]);

    let stderr = "";
    let killTimer: ReturnType<typeof setTimeout> | undefined;

    child.stderr?.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    const timer = setTimeout(() => {
      child.kill("SIGINT");
      killTimer = setTimeout(() => {
        child.kill("SIGKILL");
      }, 5000);
    }, duration * 1000);

    const verifyRecording = (): ToolResponse => {
      try {
        const stat = statSync(outputPath);
        if (stat.size === 0) {
          return errorResponse(
            "Screen recording produced an empty file. Is the simulator booted, or was the duration too short?",
          );
        }
      } catch {
        return errorResponse(
          "Screen recording did not produce a usable file. Is the simulator booted, or was the duration too short?",
        );
      }
      return textResponse(`Screen recording saved to: ${outputPath}\nDuration: ${duration}s`);
    };

    child.on("close", (code) => {
      clearTimeout(timer);
      if (killTimer) clearTimeout(killTimer);
      if (code === 0 || code === null) {
        resolve(verifyRecording());
      } else {
        resolve(errorResponse(stderr || "Failed to record screen. Is the simulator booted?"));
      }
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      if (killTimer) clearTimeout(killTimer);
      resolve(errorResponse(`Failed to start screen recording: ${err.message}`));
    });
  });
}
