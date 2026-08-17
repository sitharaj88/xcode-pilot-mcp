import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Environment } from "../../types.js";
import { withErrorHandling } from "../../utils/response.js";
import { xcodeBuild } from "./build.js";
import { xcodeClean } from "./clean.js";
import { xcodeArchive } from "./archive.js";
import { xcodeExport } from "./export.js";
import { xcodeTest, xcodeTestWithoutBuilding } from "./test.js";
import { xcodeList } from "./list.js";
import { xcodeBuildSettings } from "./build-settings.js";

export function registerBuildTools(server: McpServer, environment: Environment): void {
  server.tool(
    "xcode_build",
    "Build an Xcode project or workspace with the specified scheme and configuration",
    {
      scheme: z.string().describe("Build scheme name"),
      projectPath: z
        .string()
        .optional()
        .describe(
          "When omitted, xcodebuild runs in the MCP server process's working directory (usually not the project directory); passing projectPath explicitly is recommended",
        ),
      configuration: z
        .string()
        .optional()
        .describe('Build configuration (e.g., "Debug", "Release")'),
      destination: z
        .string()
        .optional()
        .describe('Build destination (e.g., "platform=iOS Simulator,name=iPhone 16,OS=latest")'),
      sdk: z
        .string()
        .optional()
        .describe('SDK to build with (e.g., "iphonesimulator", "iphoneos")'),
      derivedDataPath: z.string().optional().describe("Custom derived data path"),
      extraArgs: z.array(z.string()).optional().describe("Additional xcodebuild arguments"),
      timeoutSeconds: z
        .number()
        .int()
        .min(30)
        .max(3600)
        .optional()
        .describe("Command timeout in seconds (default: 600)"),
    },
    withErrorHandling(async (args) => xcodeBuild(args, environment)),
  );

  server.tool(
    "xcode_clean",
    "Clean build artifacts for the specified scheme",
    {
      scheme: z.string().describe("Build scheme name"),
      projectPath: z
        .string()
        .optional()
        .describe(
          "When omitted, xcodebuild runs in the MCP server process's working directory (usually not the project directory); passing projectPath explicitly is recommended",
        ),
      timeoutSeconds: z
        .number()
        .int()
        .min(30)
        .max(3600)
        .optional()
        .describe("Command timeout in seconds (default: 600)"),
    },
    withErrorHandling(async (args) => xcodeClean(args, environment)),
  );

  server.tool(
    "xcode_archive",
    "Create an Xcode archive for distribution",
    {
      scheme: z.string().describe("Build scheme name"),
      archivePath: z.string().describe("Output path for the .xcarchive; absolute path required"),
      projectPath: z
        .string()
        .optional()
        .describe(
          "When omitted, xcodebuild runs in the MCP server process's working directory (usually not the project directory); passing projectPath explicitly is recommended",
        ),
      configuration: z.string().optional().describe('Build configuration (default: "Release")'),
      timeoutSeconds: z
        .number()
        .int()
        .min(30)
        .max(3600)
        .optional()
        .describe("Command timeout in seconds (default: 600)"),
    },
    withErrorHandling(async (args) => xcodeArchive(args, environment)),
  );

  server.tool(
    "xcode_export",
    "Export an IPA from an Xcode archive using an export options plist",
    {
      archivePath: z.string().describe("Path to the .xcarchive; absolute path required"),
      exportPath: z
        .string()
        .describe("Output directory for the exported IPA; absolute path required"),
      exportOptionsPlist: z
        .string()
        .describe("Path to the export options plist file; absolute path required"),
      timeoutSeconds: z
        .number()
        .int()
        .min(30)
        .max(3600)
        .optional()
        .describe("Command timeout in seconds (default: 300)"),
    },
    withErrorHandling(async (args) => xcodeExport(args, environment)),
  );

  server.tool(
    "xcode_test",
    "Run unit and UI tests for the specified scheme and destination",
    {
      scheme: z.string().describe("Build scheme name"),
      destination: z
        .string()
        .describe('Test destination (e.g., "platform=iOS Simulator,name=iPhone 16")'),
      projectPath: z
        .string()
        .optional()
        .describe(
          "When omitted, xcodebuild runs in the MCP server process's working directory (usually not the project directory); passing projectPath explicitly is recommended",
        ),
      testPlan: z.string().optional().describe("Test plan name"),
      onlyTesting: z
        .array(z.string())
        .optional()
        .describe("Run only these test targets/classes/methods"),
      skipTesting: z
        .array(z.string())
        .optional()
        .describe("Skip these test targets/classes/methods"),
      timeoutSeconds: z
        .number()
        .int()
        .min(30)
        .max(3600)
        .optional()
        .describe("Command timeout in seconds (default: 600)"),
    },
    withErrorHandling(async (args) => xcodeTest(args, environment)),
  );

  server.tool(
    "xcode_test_without_building",
    "Run tests on previously built code without rebuilding",
    {
      scheme: z.string().describe("Build scheme name"),
      destination: z.string().describe("Test destination"),
      projectPath: z
        .string()
        .optional()
        .describe(
          "When omitted, xcodebuild runs in the MCP server process's working directory (usually not the project directory); passing projectPath explicitly is recommended",
        ),
      testPlan: z.string().optional().describe("Test plan name"),
      onlyTesting: z.array(z.string()).optional().describe("Run only these test targets"),
      skipTesting: z.array(z.string()).optional().describe("Skip these test targets"),
      timeoutSeconds: z
        .number()
        .int()
        .min(30)
        .max(3600)
        .optional()
        .describe("Command timeout in seconds (default: 600)"),
    },
    withErrorHandling(async (args) => xcodeTestWithoutBuilding(args, environment)),
  );

  server.tool(
    "xcode_list",
    "List available schemes, targets, and configurations in the project",
    {
      projectPath: z
        .string()
        .optional()
        .describe(
          "When omitted, xcodebuild runs in the MCP server process's working directory (usually not the project directory); passing projectPath explicitly is recommended",
        ),
      timeoutSeconds: z
        .number()
        .int()
        .min(30)
        .max(3600)
        .optional()
        .describe("Command timeout in seconds (default: 120)"),
    },
    withErrorHandling(async (args) => xcodeList(args, environment)),
  );

  server.tool(
    "xcode_build_settings",
    "Show resolved build settings for a scheme and configuration",
    {
      projectPath: z
        .string()
        .optional()
        .describe(
          "When omitted, xcodebuild runs in the MCP server process's working directory (usually not the project directory); passing projectPath explicitly is recommended",
        ),
      scheme: z.string().optional().describe("Build scheme name"),
      configuration: z.string().optional().describe("Build configuration"),
      timeoutSeconds: z
        .number()
        .int()
        .min(30)
        .max(3600)
        .optional()
        .describe("Command timeout in seconds (default: 120)"),
    },
    withErrorHandling(async (args) => xcodeBuildSettings(args, environment)),
  );
}
