import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Environment } from "../../types.js";
import { withErrorHandling } from "../../utils/response.js";
import { spmResolve } from "./spm-resolve.js";
import { spmUpdate } from "./spm-update.js";
import { spmShowDependencies } from "./spm-show-dependencies.js";
import { podInstall } from "./pod-install.js";
import { podUpdate } from "./pod-update.js";
import { podOutdated } from "./pod-outdated.js";

export function registerPackageTools(server: McpServer, environment: Environment): void {
  server.tool(
    "spm_resolve",
    "Resolve Swift Package Manager dependencies for a project",
    {
      projectPath: z.string().optional().describe("Path to .xcworkspace or .xcodeproj"),
      scheme: z.string().optional().describe("Build scheme"),
      clonedSourcePackagesDir: z
        .string()
        .optional()
        .describe("Custom directory for cloned source packages"),
    },
    withErrorHandling(async (args) => spmResolve(args, environment)),
  );

  server.tool(
    "spm_update",
    "Update Swift Package Manager dependencies to their latest allowed versions",
    {
      projectPath: z.string().optional().describe("Project directory containing Package.swift"),
    },
    withErrorHandling(async (args) => spmUpdate(args, environment)),
  );

  server.tool(
    "spm_show_dependencies",
    "Show the Swift Package Manager dependency tree as JSON",
    {
      projectPath: z.string().optional().describe("Project directory containing Package.swift"),
    },
    withErrorHandling(async (args) => spmShowDependencies(args, environment)),
  );

  server.tool(
    "pod_install",
    "Run CocoaPods install to set up pod dependencies",
    {
      projectPath: z.string().optional().describe("Project directory containing Podfile"),
      repoUpdate: z
        .boolean()
        .optional()
        .describe("Run --repo-update to update the local spec repo"),
    },
    withErrorHandling(async (args) => podInstall(args, environment)),
  );

  server.tool(
    "pod_update",
    "Update CocoaPods dependencies (all or a specific pod)",
    {
      projectPath: z.string().optional().describe("Project directory containing Podfile"),
      podName: z.string().optional().describe("Specific pod to update (updates all if omitted)"),
    },
    withErrorHandling(async (args) => podUpdate(args, environment)),
  );

  server.tool(
    "pod_outdated",
    "Check for outdated CocoaPods dependencies",
    {
      projectPath: z.string().optional().describe("Project directory containing Podfile"),
    },
    withErrorHandling(async (args) => podOutdated(args, environment)),
  );
}
