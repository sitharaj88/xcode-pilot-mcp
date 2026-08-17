import { spawn } from "node:child_process";
import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";
import { validateBundleId } from "../../utils/validation.js";

interface LaunchArgs {
  deviceId: string;
  bundleId: string;
  args?: string[];
  consolePty?: boolean;
  timeout?: number;
}

export async function appLaunch(args: LaunchArgs, env: Environment): Promise<ToolResponse> {
  if (!env.simctlAvailable) {
    return errorResponse(
      "simctl is unavailable. Install full Xcode (not just Command Line Tools) and run: sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer",
    );
  }

  validateBundleId(args.bundleId);

  const cmdArgs = ["simctl", "launch"];

  if (args.consolePty) cmdArgs.push("--console-pty");

  cmdArgs.push(args.deviceId, args.bundleId);

  if (args.args && args.args.length > 0) {
    cmdArgs.push(...args.args);
  }

  if (args.consolePty) {
    return launchWithConsoleCapture(cmdArgs, args);
  }

  const result = await executeCommand("xcrun", cmdArgs);

  if (!result.success) {
    return errorResponse(result.stderr || "Failed to launch app. Is it installed?");
  }

  return textResponse(result.stdout || `App ${args.bundleId} launched on ${args.deviceId}.`);
}

function launchWithConsoleCapture(cmdArgs: string[], args: LaunchArgs): Promise<ToolResponse> {
  const duration = args.timeout ?? 30;

  return new Promise((resolve) => {
    let output = "";
    let stopRequested = false;
    const child = spawn("xcrun", cmdArgs);

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
            `simctl launch exited with code ${code ?? "unknown"}. Is the app installed?\n\n${output}`,
          ),
        );
        return;
      }
      const note = `Console streaming stopped after ${duration}s.`;
      resolve(
        textResponse(
          output.trim() ? `${output}\n\n${note}` : `No console output captured.\n\n${note}`,
        ),
      );
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      if (killTimer) clearTimeout(killTimer);
      resolve(errorResponse(`Failed to launch app: ${err.message}`));
    });
  });
}
