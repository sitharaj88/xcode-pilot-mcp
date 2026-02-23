import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Environment } from "../../types.js";
import { withErrorHandling } from "../../utils/response.js";
import { swiftlintRun } from "./swiftlint-run.js";
import { swiftlintFix } from "./swiftlint-fix.js";
import { swiftFormatRun } from "./swift-format-run.js";
import { buildWarnings } from "./build-warnings.js";

export function registerQualityTools(server: McpServer, environment: Environment): void {
  server.tool(
    "swiftlint_run",
    "Run SwiftLint analysis and report violations as JSON",
    {
      path: z.string().optional().describe("Path to lint (defaults to current directory)"),
      config: z.string().optional().describe("Path to .swiftlint.yml config file"),
    },
    withErrorHandling(async (args) => swiftlintRun(args, environment)),
  );

  server.tool(
    "swiftlint_fix",
    "Auto-fix SwiftLint violations in the specified path",
    {
      path: z.string().optional().describe("Path to fix (defaults to current directory)"),
      config: z.string().optional().describe("Path to .swiftlint.yml config file"),
    },
    withErrorHandling(async (args) => swiftlintFix(args, environment)),
  );

  server.tool(
    "swift_format_run",
    "Run swift-format lint to check formatting",
    {
      path: z.string().describe("Path to check formatting"),
      recursive: z.boolean().optional().describe("Recurse into subdirectories (default: true)"),
    },
    withErrorHandling(async (args) => swiftFormatRun(args, environment)),
  );

  server.tool(
    "build_warnings",
    "Extract and summarize warnings from the most recent Xcode build log",
    {
      projectPath: z.string().optional().describe("Project path to narrow down DerivedData search"),
      derivedDataPath: z.string().optional().describe("Custom DerivedData path"),
    },
    withErrorHandling(async (args) => buildWarnings(args, environment)),
  );
}
