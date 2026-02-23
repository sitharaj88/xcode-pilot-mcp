import { mkdtempSync, rmSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";
import { validateAbsolutePath } from "../../utils/validation.js";

interface IpaPermissionsArgs {
  ipaPath: string;
}

export async function ipaPermissions(
  args: IpaPermissionsArgs,
  _env: Environment,
): Promise<ToolResponse> {
  validateAbsolutePath(args.ipaPath);

  const tempDir = mkdtempSync(join(tmpdir(), "ipa-perms-"));

  try {
    const unzipResult = await executeCommand("unzip", ["-o", args.ipaPath, "-d", tempDir], {
      timeout: 60_000,
    });

    if (!unzipResult.success) {
      return errorResponse(`Failed to unzip IPA: ${unzipResult.stderr}`);
    }

    const payloadDir = join(tempDir, "Payload");
    if (!existsSync(payloadDir)) {
      return errorResponse("Invalid IPA: no Payload directory found");
    }

    const appDirs = readdirSync(payloadDir).filter((f) => f.endsWith(".app"));
    if (appDirs.length === 0) {
      return errorResponse("Invalid IPA: no .app bundle found");
    }

    const appDir = join(payloadDir, appDirs[0]);
    const plistResult = await executeCommand("plutil", [
      "-convert",
      "json",
      "-o",
      "-",
      join(appDir, "Info.plist"),
    ]);

    if (!plistResult.success) {
      return errorResponse("Failed to read Info.plist");
    }

    const plist = JSON.parse(plistResult.stdout);
    const permissions: string[] = [];

    for (const [key, value] of Object.entries(plist)) {
      if (key.startsWith("NS") && key.endsWith("UsageDescription")) {
        permissions.push(`${key}:\n  "${value}"`);
      }
    }

    if (permissions.length === 0) {
      return textResponse("No privacy usage descriptions found in Info.plist.");
    }

    return textResponse(
      `Privacy permissions (${permissions.length} found):\n\n${permissions.join("\n\n")}`,
    );
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}
