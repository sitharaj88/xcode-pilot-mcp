import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Environment } from "../../types.js";
import { withErrorHandling } from "../../utils/response.js";
import { ipaAnalyze } from "./ipa-analyze.js";
import { ipaPermissions } from "./ipa-permissions.js";
import { binarySize } from "./binary-size.js";
import { dsymVerify } from "./dsym-verify.js";

export function registerAnalyzeTools(server: McpServer, environment: Environment): void {
  server.tool(
    "ipa_analyze",
    "Analyze an IPA file: size, bundle ID, version, architectures, embedded frameworks",
    {
      ipaPath: z.string().describe("Absolute path to the .ipa file"),
    },
    withErrorHandling(async (args) => ipaAnalyze(args, environment)),
  );

  server.tool(
    "ipa_permissions",
    "List privacy usage descriptions (NSCameraUsageDescription, etc.) from an IPA's Info.plist",
    {
      ipaPath: z.string().describe("Absolute path to the .ipa file"),
    },
    withErrorHandling(async (args) => ipaPermissions(args, environment)),
  );

  server.tool(
    "binary_size",
    "Analyze Mach-O binary size breakdown by segment",
    {
      binaryPath: z.string().describe("Absolute path to the Mach-O binary"),
    },
    withErrorHandling(async (args) => binarySize(args, environment)),
  );

  server.tool(
    "dsym_verify",
    "Verify that a dSYM file matches a binary by comparing UUIDs",
    {
      dsymPath: z.string().describe("Absolute path to the .dSYM file"),
      binaryPath: z.string().describe("Absolute path to the binary"),
    },
    withErrorHandling(async (args) => dsymVerify(args, environment)),
  );
}
