import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";

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
      const nameMatch = result.stdout.match(/<key>Name<\/key>\s*<string>([^<]+)<\/string>/);
      const uuidMatch = result.stdout.match(/<key>UUID<\/key>\s*<string>([^<]+)<\/string>/);
      const teamMatch = result.stdout.match(/<key>TeamName<\/key>\s*<string>([^<]+)<\/string>/);
      const expirationMatch = result.stdout.match(
        /<key>ExpirationDate<\/key>\s*<date>([^<]+)<\/date>/,
      );

      profiles.push(
        [
          `File: ${file}`,
          `  Name: ${nameMatch?.[1] ?? "Unknown"}`,
          `  UUID: ${uuidMatch?.[1] ?? "Unknown"}`,
          `  Team: ${teamMatch?.[1] ?? "Unknown"}`,
          `  Expires: ${expirationMatch?.[1] ?? "Unknown"}`,
          `  Size: ${stat.size} bytes`,
        ].join("\n"),
      );
    } else {
      profiles.push(`File: ${file}\n  (Failed to decode)`);
    }
  }

  return textResponse(`Found ${files.length} provisioning profile(s):\n\n${profiles.join("\n\n")}`);
}
