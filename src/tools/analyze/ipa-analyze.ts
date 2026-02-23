import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";
import { validateAbsolutePath } from "../../utils/validation.js";
import { statSync, readdirSync, existsSync } from "node:fs";

interface IpaAnalyzeArgs {
  ipaPath: string;
}

export async function ipaAnalyze(args: IpaAnalyzeArgs, _env: Environment): Promise<ToolResponse> {
  validateAbsolutePath(args.ipaPath);

  let ipaSize: number;
  try {
    ipaSize = statSync(args.ipaPath).size;
  } catch {
    return errorResponse(`IPA file not found: ${args.ipaPath}`);
  }

  const tempDir = mkdtempSync(join(tmpdir(), "ipa-"));

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
      return errorResponse("Invalid IPA: no .app bundle found in Payload");
    }

    const appDir = join(payloadDir, appDirs[0]);
    const appName = appDirs[0].replace(".app", "");

    const plistResult = await executeCommand("plutil", [
      "-convert",
      "json",
      "-o",
      "-",
      join(appDir, "Info.plist"),
    ]);

    let plistInfo = "";
    if (plistResult.success) {
      try {
        const plist = JSON.parse(plistResult.stdout);
        plistInfo = [
          `  Bundle ID: ${plist.CFBundleIdentifier || "Unknown"}`,
          `  Version: ${plist.CFBundleShortVersionString || "Unknown"} (${plist.CFBundleVersion || "Unknown"})`,
          `  Display Name: ${plist.CFBundleDisplayName || plist.CFBundleName || "Unknown"}`,
          `  Min OS Version: ${plist.MinimumOSVersion || "Unknown"}`,
          `  SDK: ${plist.DTSDKName || "Unknown"}`,
        ].join("\n");
      } catch {
        plistInfo = "  (Failed to parse Info.plist)";
      }
    }

    const binaryPath = join(appDir, appName);
    let archInfo = "  Unknown";
    if (existsSync(binaryPath)) {
      const lipoResult = await executeCommand("lipo", ["-info", binaryPath]);
      if (lipoResult.success) {
        archInfo = `  ${lipoResult.stdout.trim()}`;
      }
    }

    const frameworksDir = join(appDir, "Frameworks");
    let frameworksList = "  None";
    if (existsSync(frameworksDir)) {
      const frameworks = readdirSync(frameworksDir).filter(
        (f) => f.endsWith(".framework") || f.endsWith(".dylib"),
      );
      frameworksList =
        frameworks.length > 0 ? frameworks.map((f) => `  - ${f}`).join("\n") : "  None";
    }

    const output = [
      `IPA Analysis: ${args.ipaPath}`,
      ``,
      `Size: ${(ipaSize / 1024 / 1024).toFixed(2)} MB (${ipaSize} bytes)`,
      ``,
      `Info.plist:`,
      plistInfo,
      ``,
      `Architectures:`,
      archInfo,
      ``,
      `Embedded Frameworks:`,
      frameworksList,
    ].join("\n");

    return textResponse(output);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}
