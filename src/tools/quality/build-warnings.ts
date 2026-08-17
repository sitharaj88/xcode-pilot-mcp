import { readdirSync, existsSync, statSync, readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { join } from "node:path";
import { homedir } from "node:os";
import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";

interface BuildWarningsArgs {
  projectPath?: string;
  derivedDataPath?: string;
}

const MAX_FALLBACK_LINES = 200;

export async function buildWarnings(
  args: BuildWarningsArgs,
  _env: Environment,
): Promise<ToolResponse> {
  const derivedData =
    args.derivedDataPath || join(homedir(), "Library", "Developer", "Xcode", "DerivedData");

  if (!existsSync(derivedData)) {
    return errorResponse(`DerivedData directory not found: ${derivedData}`);
  }

  const logFile = findNewestBuildLog(derivedData, args.projectPath);
  if (!logFile) {
    return errorResponse("No build logs found. Build the project first with xcode_build.");
  }

  const result = await executeCommand(
    "xcrun",
    ["xclogparser", "parse", "--file", logFile, "--reporter", "issues"],
    { timeout: 30_000 },
  );

  if (result.success) {
    return textResponse(result.stdout);
  }

  return extractWarningsFromLog(logFile);
}

function findNewestBuildLog(derivedData: string, projectPath?: string): string | null {
  try {
    const projectFilter = projectPath
      ?.split("/")
      .pop()
      ?.replace(/\.(xcworkspace|xcodeproj)$/, "")
      .toLowerCase();

    const candidateDirs = readdirSync(derivedData)
      .filter((d) => !projectFilter || d.toLowerCase().startsWith(projectFilter))
      .map((d) => join(derivedData, d))
      .filter((d) => {
        try {
          return statSync(d).isDirectory();
        } catch {
          return false;
        }
      })
      .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);

    for (const dir of candidateDirs) {
      const buildLogsDir = join(dir, "Logs", "Build");
      if (!existsSync(buildLogsDir)) continue;

      const logs = readdirSync(buildLogsDir)
        .filter((f) => f.endsWith(".xcactivitylog"))
        .map((f) => join(buildLogsDir, f))
        .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);

      if (logs.length > 0) {
        return logs[0];
      }
    }

    return null;
  } catch {
    return null;
  }
}

function extractWarningsFromLog(logFile: string): ToolResponse {
  let decompressed: string;
  try {
    const compressed = readFileSync(logFile);
    decompressed = gunzipSync(compressed).toString("utf-8");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return errorResponse(`Failed to decompress build log ${logFile}: ${message}`);
  }

  const seen = new Set<string>();
  const matches: string[] = [];

  for (const rawLine of decompressed.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || (!line.includes("warning:") && !line.includes("error:"))) {
      continue;
    }
    if (seen.has(line)) {
      continue;
    }
    seen.add(line);
    matches.push(line);
    if (matches.length >= MAX_FALLBACK_LINES) {
      break;
    }
  }

  if (matches.length === 0) {
    return textResponse("No build warnings found in recent build logs.");
  }

  return textResponse(`Build warnings found (${matches.length}):\n\n${matches.join("\n")}`);
}
