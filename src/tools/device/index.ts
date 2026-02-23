import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Environment } from "../../types.js";
import { withErrorHandling } from "../../utils/response.js";
import { physicalDeviceList } from "./list.js";
import { physicalDeviceInstall } from "./install.js";
import { physicalDeviceLaunch } from "./launch.js";
import { physicalDeviceConsole } from "./console.js";

export function registerDeviceTools(server: McpServer, environment: Environment): void {
  server.tool(
    "physical_device_list",
    "List connected physical iOS devices (requires Xcode 15+ with devicectl)",
    {},
    withErrorHandling(async () => physicalDeviceList(environment)),
  );

  server.tool(
    "physical_device_install",
    "Install an app on a connected physical device",
    {
      deviceId: z.string().describe("Device identifier"),
      appPath: z.string().describe("Path to the .app bundle or .ipa"),
    },
    withErrorHandling(async (args) => physicalDeviceInstall(args, environment)),
  );

  server.tool(
    "physical_device_launch",
    "Launch an installed app on a connected physical device",
    {
      deviceId: z.string().describe("Device identifier"),
      bundleId: z.string().describe("App bundle identifier"),
    },
    withErrorHandling(async (args) => physicalDeviceLaunch(args, environment)),
  );

  server.tool(
    "physical_device_console",
    "Stream console logs from a connected physical device for a specified duration",
    {
      deviceId: z.string().describe("Device identifier"),
      timeout: z.number().optional().describe("Duration in seconds to capture logs (default: 10)"),
    },
    withErrorHandling(async (args) => physicalDeviceConsole(args, environment)),
  );
}
