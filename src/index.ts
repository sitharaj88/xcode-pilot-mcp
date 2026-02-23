#!/usr/bin/env node

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

async function main(): Promise<void> {
  logger.info("Starting xcode-pilot MCP server...");

  const environment = await detectEnvironment();

  const server = new McpServer({
    name: "xcode-pilot",
    version: "1.0.0",
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

  logger.info("All tools registered (67 tools across 11 categories)");

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
