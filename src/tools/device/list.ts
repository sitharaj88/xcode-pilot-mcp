import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";

export async function physicalDeviceList(env: Environment): Promise<ToolResponse> {
  if (!env.devicectlAvailable) {
    return errorResponse(
      "devicectl is unavailable. It requires Xcode 15 or later with full Xcode installed (not just Command Line Tools).",
    );
  }

  const dir = mkdtempSync(join(tmpdir(), "devicectl-list-"));
  const outputFile = join(dir, "devices.json");

  try {
    const result = await executeCommand("xcrun", [
      "devicectl",
      "list",
      "devices",
      "--json-output",
      outputFile,
    ]);

    if (!result.success) {
      return errorResponse(
        result.stderr ||
          "Failed to list devices. Ensure Xcode 15+ is installed and devicectl is available.",
      );
    }

    const json = readFileSync(outputFile, "utf-8");
    return textResponse(json);
  } catch (err) {
    return errorResponse(
      `Failed to read device list output: ${err instanceof Error ? err.message : String(err)}`,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
