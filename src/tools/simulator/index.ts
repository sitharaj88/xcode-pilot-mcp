import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Environment } from "../../types.js";
import { withErrorHandling } from "../../utils/response.js";
import { simulatorList } from "./list.js";
import { simulatorCreate } from "./create.js";
import { simulatorBoot } from "./boot.js";
import { simulatorShutdown } from "./shutdown.js";
import { simulatorDelete } from "./delete.js";
import { simulatorErase } from "./erase.js";
import { simulatorOpen } from "./open.js";
import { simulatorListRuntimes } from "./list-runtimes.js";
import { simulatorListDeviceTypes } from "./list-device-types.js";
import { simulatorClone } from "./clone.js";

export function registerSimulatorTools(server: McpServer, environment: Environment): void {
  server.tool(
    "simulator_list",
    "List all iOS simulators with their state (Booted, Shutdown, etc.)",
    {
      state: z
        .string()
        .optional()
        .describe('Filter by state: "Booted", "Shutdown", "Creating", etc.'),
    },
    withErrorHandling(async (args) => simulatorList(args, environment)),
  );

  server.tool(
    "simulator_create",
    "Create a new iOS simulator with specified device type and runtime",
    {
      name: z.string().describe('Simulator name (e.g., "My iPhone 16")'),
      deviceTypeId: z
        .string()
        .describe(
          'Device type identifier (e.g., "com.apple.CoreSimulator.SimDeviceType.iPhone-16")',
        ),
      runtimeId: z
        .string()
        .describe('Runtime identifier (e.g., "com.apple.CoreSimulator.SimRuntime.iOS-18-0")'),
    },
    withErrorHandling(async (args) => simulatorCreate(args, environment)),
  );

  server.tool(
    "simulator_boot",
    "Boot a simulator device so it can be used",
    {
      deviceId: z.string().describe("Simulator UDID or name"),
    },
    withErrorHandling(async (args) => simulatorBoot(args, environment)),
  );

  server.tool(
    "simulator_shutdown",
    "Shutdown a simulator or all simulators",
    {
      deviceId: z.string().optional().describe('Simulator UDID or "all" (default: "all")'),
    },
    withErrorHandling(async (args) => simulatorShutdown(args, environment)),
  );

  server.tool(
    "simulator_delete",
    'Delete a simulator device. Use "unavailable" to remove all unavailable devices',
    {
      deviceId: z.string().describe('Simulator UDID or "unavailable"'),
    },
    withErrorHandling(async (args) => simulatorDelete(args, environment)),
  );

  server.tool(
    "simulator_erase",
    "Erase all content and settings from a simulator",
    {
      deviceId: z.string().describe("Simulator UDID"),
    },
    withErrorHandling(async (args) => simulatorErase(args, environment)),
  );

  server.tool(
    "simulator_open",
    "Open Simulator.app and display the specified device",
    {
      deviceId: z.string().describe("Simulator UDID"),
    },
    withErrorHandling(async (args) => simulatorOpen(args, environment)),
  );

  server.tool(
    "simulator_list_runtimes",
    "List available simulator runtimes (iOS, watchOS, tvOS, visionOS)",
    {},
    withErrorHandling(async () => simulatorListRuntimes(environment)),
  );

  server.tool(
    "simulator_list_device_types",
    "List available simulator device types (iPhone, iPad, Apple Watch, etc.)",
    {},
    withErrorHandling(async () => simulatorListDeviceTypes(environment)),
  );

  server.tool(
    "simulator_clone",
    "Clone an existing simulator to create an identical copy",
    {
      deviceId: z.string().describe("UDID of the simulator to clone"),
      newName: z.string().describe("Name for the cloned simulator"),
    },
    withErrorHandling(async (args) => simulatorClone(args, environment)),
  );
}
