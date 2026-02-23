import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Environment } from "../../types.js";
import { withErrorHandling } from "../../utils/response.js";
import { locationSet } from "./location-set.js";
import { locationClear } from "./location-clear.js";
import { pushNotification } from "./push-notification.js";
import { statusBarOverride } from "./status-bar-override.js";
import { statusBarClear } from "./status-bar-clear.js";
import { keyboardInput } from "./keyboard-input.js";

export function registerEnvironmentTools(server: McpServer, environment: Environment): void {
  server.tool(
    "location_set",
    "Set a simulated GPS location on a simulator",
    {
      deviceId: z.string().describe("Simulator UDID"),
      latitude: z.number().describe("Latitude coordinate"),
      longitude: z.number().describe("Longitude coordinate"),
    },
    withErrorHandling(async (args) => locationSet(args, environment)),
  );

  server.tool(
    "location_clear",
    "Clear the simulated GPS location on a simulator",
    {
      deviceId: z.string().describe("Simulator UDID"),
    },
    withErrorHandling(async (args) => locationClear(args, environment)),
  );

  server.tool(
    "push_notification",
    "Send a push notification to an app on a simulator via APNs payload JSON",
    {
      deviceId: z.string().describe("Simulator UDID"),
      bundleId: z.string().describe("App bundle identifier"),
      payload: z
        .string()
        .describe('APNs payload as JSON string (e.g., \'{"aps":{"alert":"Hello","badge":1}}\')'),
    },
    withErrorHandling(async (args) => pushNotification(args, environment)),
  );

  server.tool(
    "status_bar_override",
    "Override the simulator status bar display (time, battery, wifi, cellular, etc.)",
    {
      deviceId: z.string().describe("Simulator UDID"),
      time: z.string().optional().describe('Time string (e.g., "9:41")'),
      batteryLevel: z.number().min(0).max(100).optional().describe("Battery level (0-100)"),
      batteryState: z
        .enum(["charged", "charging", "discharging"])
        .optional()
        .describe("Battery state"),
      wifiBars: z.number().min(0).max(3).optional().describe("WiFi signal bars (0-3)"),
      cellularBars: z.number().min(0).max(4).optional().describe("Cellular signal bars (0-4)"),
      operatorName: z.string().optional().describe("Carrier/operator name"),
      dataNetwork: z
        .string()
        .optional()
        .describe('Data network type (e.g., "wifi", "4g", "5g", "lte")'),
    },
    withErrorHandling(async (args) => statusBarOverride(args, environment)),
  );

  server.tool(
    "status_bar_clear",
    "Reset the simulator status bar to default values",
    {
      deviceId: z.string().describe("Simulator UDID"),
    },
    withErrorHandling(async (args) => statusBarClear(args, environment)),
  );

  server.tool(
    "keyboard_input",
    "Send text input to a simulator",
    {
      deviceId: z.string().describe("Simulator UDID"),
      text: z.string().describe("Text to input"),
    },
    withErrorHandling(async (args) => keyboardInput(args, environment)),
  );
}
