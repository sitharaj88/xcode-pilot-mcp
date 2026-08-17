import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { executeCommand, executeCommandWithStdin } from "../../executor.js";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";

interface ProfileInfo {
  Name?: string;
  UUID?: string;
  TeamName?: string;
  ExpirationDate?: string;
}

export async function provisioningProfiles(_env: Environment): Promise<ToolResponse> {
  const profilesDir = join(homedir(), "Library", "MobileDevice", "Provisioning Profiles");

  let files: string[];
  try {
    files = readdirSync(profilesDir).filter((f) => f.endsWith(".mobileprovision"));
  } catch {
    return errorResponse(`No provisioning profiles directory found at: ${profilesDir}`);
  }

  if (files.length === 0) {
    return textResponse("No provisioning profiles installed.");
  }

  const profiles: string[] = [];
  for (const file of files) {
    const filePath = join(profilesDir, file);
    const stat = statSync(filePath);
    const result = await executeCommand("security", ["cms", "-D", "-i", filePath], {
      timeout: 10_000,
    });

    if (result.success) {
      const info = await parseProfileXml(result.stdout);
      if (info) {
        profiles.push(
          [
            `File: ${file}`,
            `  Name: ${info.Name ?? "Unknown"}`,
            `  UUID: ${info.UUID ?? "Unknown"}`,
            `  Team: ${info.TeamName ?? "Unknown"}`,
            `  Expires: ${info.ExpirationDate ?? "Unknown"}`,
            `  Size: ${stat.size} bytes`,
          ].join("\n"),
        );
      } else {
        profiles.push(
          `File: ${file}\n  (Could not be parsed; showing filename only)\n  Size: ${stat.size} bytes`,
        );
      }
    } else {
      profiles.push(`File: ${file}\n  (Failed to decode)`);
    }
  }

  return textResponse(`Found ${files.length} provisioning profile(s):\n\n${profiles.join("\n\n")}`);
}

async function parseProfileXml(xml: string): Promise<ProfileInfo | null> {
  // plutil -convert json rejects plists containing <data> values (DeveloperCertificates),
  // so extract each field individually with raw output instead.
  const fields: Array<keyof ProfileInfo> = ["Name", "UUID", "TeamName", "ExpirationDate"];
  const info: ProfileInfo = {};
  let extractedAny = false;

  for (const field of fields) {
    const result = await executeCommandWithStdin(
      "plutil",
      ["-extract", field, "raw", "-o", "-", "-"],
      xml,
      { timeout: 10_000 },
    );
    if (result.success && result.stdout.trim()) {
      info[field] = result.stdout.trim();
      extractedAny = true;
    }
  }

  return extractedAny ? info : null;
}
