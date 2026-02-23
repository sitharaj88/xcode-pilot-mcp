import { readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";

interface BuildWarningsArgs {
  projectPath?: string;
  derivedDataPath?: string;
}

export async function buildWarnings(
  args: BuildWarningsArgs,
  _env: Environment,
): Promise<ToolResponse> {
  const derivedData =
    args.derivedDataPath || join(homedir(), "Library", "Developer", "Xcode", "DerivedData");

  if (!existsSync(derivedData)) {
    return errorResponse(`DerivedData directory not found: ${derivedData}`);
  }

  const logsDir = findLatestBuildLogs(derivedData, args.projectPath);
  if (!logsDir) {
    return errorResponse("No build logs found. Build the project first with xcode_build.");
  }

  const result = await executeCommand(
    "xcrun",
    ["xclogparser", "parse", "--project", logsDir, "--reporter", "json"],
    { timeout: 30_000 },
  );

  if (result.success) {
    return textResponse(result.stdout);
  }

  // Fallback: search for warnings in build log text
  const grepResult = await executeCommand(
    "grep",
    ["-r", "warning:", logsDir, "--include=*.xcactivitylog"],
    { timeout: 30_000 },
  );

  if (grepResult.stdout) {
    return textResponse(`Build warnings found:\n\n${grepResult.stdout}`);
  }

  return textResponse("No build warnings found in recent build logs.");
}

function findLatestBuildLogs(derivedData: string, projectPath?: string): string | null {
  try {
    const dirs = readdirSync(derivedData)
      .filter((d) => {
        if (projectPath) {
          const projectName = projectPath
            .split("/")
            .pop()
            ?.replace(/\.(xcworkspace|xcodeproj)$/, "");
          return projectName && d.toLowerCase().startsWith(projectName.toLowerCase());
        }
        return true;
      })
      .map((d) => join(derivedData, d, "Logs", "Build"))
      .filter((d) => existsSync(d));

    return dirs.length > 0 ? dirs[0] : null;
  } catch {
    return null;
  }
}
