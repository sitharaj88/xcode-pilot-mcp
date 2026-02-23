import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Environment } from "../../types.js";
import { withErrorHandling } from "../../utils/response.js";
import { logStream } from "./log-stream.js";
import { logCollect } from "./log-collect.js";
import { screenshot } from "./screenshot.js";
import { screenRecord } from "./screen-record.js";
import { diagnostics } from "./diagnostics.js";
import { accessibilityAudit } from "./accessibility-audit.js";
import { deviceAppearance } from "./device-appearance.js";

export function registerDebugTools(server: McpServer, environment: Environment): void {
  server.tool(
    "log_stream",
    "Stream live logs from a simulator for a specified duration",
    {
      deviceId: z.string().describe("Simulator UDID"),
      predicate: z
        .string()
        .optional()
        .describe(
          "Log predicate filter (e.g., 'subsystem == \"com.example.app\"', 'eventMessage contains \"error\"')",
        ),
      level: z.enum(["default", "info", "debug"]).optional().describe("Minimum log level"),
      timeout: z.number().optional().describe("Duration in seconds to capture logs (default: 10)"),
    },
    withErrorHandling(async (args) => logStream(args, environment)),
  );

  server.tool(
    "log_collect",
    "Collect recent logs from a simulator with time range and predicate filtering",
    {
      deviceId: z.string().describe("Simulator UDID"),
      predicate: z.string().optional().describe("Log predicate filter"),
      last: z.string().optional().describe('Time range (e.g., "5m", "1h", "30s")'),
      style: z.enum(["compact", "json"]).optional().describe("Output style"),
    },
    withErrorHandling(async (args) => logCollect(args, environment)),
  );

  server.tool(
    "screenshot",
    "Capture a screenshot from a simulator as PNG",
    {
      deviceId: z.string().describe("Simulator UDID"),
      outputPath: z.string().optional().describe("Output file path (auto-generated if not set)"),
    },
    withErrorHandling(async (args) => screenshot(args, environment)),
  );

  server.tool(
    "screen_record",
    "Record the simulator screen as MP4 for a specified duration",
    {
      deviceId: z.string().describe("Simulator UDID"),
      outputPath: z.string().optional().describe("Output file path (auto-generated if not set)"),
      duration: z.number().optional().describe("Recording duration in seconds (default: 10)"),
    },
    withErrorHandling(async (args) => screenRecord(args, environment)),
  );

  server.tool(
    "diagnostics",
    "Collect a diagnostic report from the simulator subsystem",
    {
      outputPath: z.string().optional().describe("Output directory for the diagnostic archive"),
    },
    withErrorHandling(async (args) => diagnostics(args, environment)),
  );

  server.tool(
    "accessibility_audit",
    "Run an accessibility audit on the current screen of a simulator (requires Xcode 15+)",
    {
      deviceId: z.string().describe("Simulator UDID"),
    },
    withErrorHandling(async (args) => accessibilityAudit(args, environment)),
  );

  server.tool(
    "device_appearance",
    "Set the simulator to light or dark mode",
    {
      deviceId: z.string().describe("Simulator UDID"),
      appearance: z.enum(["light", "dark"]).describe("Appearance mode"),
    },
    withErrorHandling(async (args) => deviceAppearance(args, environment)),
  );
}
