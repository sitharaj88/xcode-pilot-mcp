import { execFile, spawn } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import type { ExecResult, ExecOptions } from "./types.js";

const DEFAULT_TIMEOUT = 120_000;
const DEFAULT_MAX_BUFFER = 10 * 1024 * 1024;

export function executeCommand(
  command: string,
  args: string[] = [],
  options: ExecOptions = {},
): Promise<ExecResult> {
  const { timeout = DEFAULT_TIMEOUT, cwd, env, maxBuffer = DEFAULT_MAX_BUFFER } = options;

  return new Promise((resolve) => {
    execFile(
      command,
      args,
      {
        timeout,
        cwd,
        env: env ? { ...process.env, ...env } : undefined,
        maxBuffer,
      },
      (error, stdout, stderr) => {
        if (error) {
          const timedOut = error.signal === "SIGTERM" || error.killed === true;
          resolve({
            success: false,
            stdout: stdout ?? "",
            stderr: stderr ?? error.message,
            exitCode: error.code && typeof error.code === "number" ? error.code : 1,
            timedOut,
          });
          return;
        }

        resolve({
          success: true,
          stdout: stdout ?? "",
          stderr: stderr ?? "",
          exitCode: 0,
          timedOut: false,
        });
      },
    );
  });
}

export function spawnDetached(
  command: string,
  args: string[] = [],
  options: ExecOptions = {},
): ChildProcess {
  const { cwd, env } = options;

  const child = spawn(command, args, {
    detached: true,
    stdio: "ignore",
    cwd,
    env: env ? { ...process.env, ...env } : undefined,
  });

  child.unref();
  return child;
}

export function executeCommandWithStdin(
  command: string,
  args: string[] = [],
  stdinData: string,
  options: ExecOptions = {},
): Promise<ExecResult> {
  const { timeout = DEFAULT_TIMEOUT, cwd, env, maxBuffer = DEFAULT_MAX_BUFFER } = options;

  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
      env: env ? { ...process.env, ...env } : undefined,
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        child.kill("SIGTERM");
        resolve({
          success: false,
          stdout,
          stderr,
          exitCode: 1,
          timedOut: true,
        });
      }
    }, timeout);

    child.stdout?.on("data", (data: Buffer) => {
      stdout += data.toString();
      if (stdout.length > maxBuffer) {
        stdout = stdout.slice(0, maxBuffer);
      }
    });

    child.stderr?.on("data", (data: Buffer) => {
      stderr += data.toString();
      if (stderr.length > maxBuffer) {
        stderr = stderr.slice(0, maxBuffer);
      }
    });

    child.on("close", (code) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve({
          success: code === 0,
          stdout,
          stderr,
          exitCode: code ?? 1,
          timedOut: false,
        });
      }
    });

    child.on("error", (err) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve({
          success: false,
          stdout,
          stderr: err.message,
          exitCode: 1,
          timedOut: false,
        });
      }
    });

    child.stdin?.write(stdinData);
    child.stdin?.end();
  });
}
