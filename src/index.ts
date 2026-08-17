#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { detectEnvironment } from "./environment.js";
import { logger } from "./utils/logger.js";
import { registerBuildTools } from "./tools/xcodebuild/index.js";
import { registerSimulatorTools } from "./tools/simulator/index.js";
import { registerAppTools } from "./tools/app/index.js";
import { registerDebugTools } from "./tools/debug/index.js";
import { registerEnvironmentTools } from "./tools/environment/index.js";
import { registerSigningTools } from "./tools/signing/index.js";
import { registerPackageTools } from "./tools/packages/index.js";
import { registerScaffoldTools } from "./tools/scaffold/index.js";
import { registerAnalyzeTools } from "./tools/analyze/index.js";
import { registerQualityTools } from "./tools/quality/index.js";
import { registerDeviceTools } from "./tools/device/index.js";

function readPackageVersion(): string {
  const moduleDir = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    join(moduleDir, "..", "package.json"),
    join(moduleDir, "..", "..", "package.json"),
  ];

  for (const candidate of candidates) {
    try {
      const pkg = JSON.parse(readFileSync(candidate, "utf-8")) as { version?: string };
      if (pkg.version) {
        return pkg.version;
      }
    } catch {
      continue;
    }
  }

  logger.warn("Could not resolve package.json version, defaulting to 0.0.0");
  return "0.0.0";
}

async function main(): Promise<void> {
  logger.info("Starting xcode-pilot MCP server...");

  const environment = await detectEnvironment();

  const server = new McpServer({
    name: "xcode-pilot",
    version: readPackageVersion(),
  });

  registerBuildTools(server, environment);
  registerSimulatorTools(server, environment);
  registerAppTools(server, environment);
  registerDebugTools(server, environment);
  registerEnvironmentTools(server, environment);
  registerSigningTools(server, environment);
  registerPackageTools(server, environment);
  registerScaffoldTools(server, environment);
  registerAnalyzeTools(server, environment);
  registerQualityTools(server, environment);
  registerDeviceTools(server, environment);

  logger.info("All tools registered");

  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info("xcode-pilot MCP server running on stdio");

  const shutdown = async (): Promise<void> => {
    logger.info("Shutting down xcode-pilot MCP server...");
    await server.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error) => {
  logger.error("Fatal error starting server", {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
