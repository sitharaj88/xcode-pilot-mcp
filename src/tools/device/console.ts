import { spawn } from "node:child_process";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";
import { validateBundleId } from "../../utils/validation.js";

interface ConsoleArgs {
  deviceId: string;
  bundleId: string;
  timeout?: number;
}

export async function physicalDeviceConsole(
  args: ConsoleArgs,
  env: Environment,
): Promise<ToolResponse> {
  if (!env.devicectlAvailable) {
    return errorResponse(
      "devicectl is unavailable. It requires Xcode 15 or later with full Xcode installed (not just Command Line Tools).",
    );
  }

  validateBundleId(args.bundleId);

  const duration = args.timeout ?? 10;

  return new Promise((resolve) => {
    let output = "";
    let stopRequested = false;
    const child = spawn("xcrun", [
      "devicectl",
      "device",
      "process",
      "launch",
      "--console",
      "--device",
      args.deviceId,
      args.bundleId,
    ]);

    let killTimer: ReturnType<typeof setTimeout> | undefined;

    const timer = setTimeout(() => {
      stopRequested = true;
      child.kill("SIGINT");
      killTimer = setTimeout(() => {
        child.kill("SIGKILL");
      }, 5000);
    }, duration * 1000);

    child.stdout?.on("data", (data: Buffer) => {
      output += data.toString();
      if (output.length > 100_000) {
        stopRequested = true;
        child.kill("SIGINT");
      }
    });

    child.stderr?.on("data", (data: Buffer) => {
      output += data.toString();
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (killTimer) clearTimeout(killTimer);
      if (!stopRequested && code !== 0) {
        resolve(
          errorResponse(
            `devicectl exited with code ${code ?? "unknown"} before streaming finished. Is the app installed on the device?\n\n${output}`,
          ),
        );
        return;
      }
      resolve(
        textResponse(
          output.trim()
            ? output
            : `App launched but no console output was captured in ${duration}s (streaming stopped as requested).`,
        ),
      );
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      if (killTimer) clearTimeout(killTimer);
      resolve(errorResponse(`Failed to launch app with console streaming: ${err.message}`));
    });
  });
}
