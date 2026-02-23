import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Environment } from "../../types.js";
import { withErrorHandling } from "../../utils/response.js";
import { appInstall } from "./install.js";
import { appUninstall } from "./uninstall.js";
import { appLaunch } from "./launch.js";
import { appTerminate } from "./terminate.js";
import { appGetContainer } from "./get-container.js";
import { appList } from "./list.js";
import { appOpenUrl } from "./open-url.js";
import { appPrivacy } from "./privacy.js";

export function registerAppTools(server: McpServer, environment: Environment): void {
  server.tool(
    "app_install",
    "Install a .app bundle on a simulator",
    {
      deviceId: z.string().describe("Simulator UDID"),
      appPath: z.string().describe("Path to the .app bundle"),
    },
    withErrorHandling(async (args) => appInstall(args, environment)),
  );

  server.tool(
    "app_uninstall",
    "Uninstall an app from a simulator by bundle ID",
    {
      deviceId: z.string().describe("Simulator UDID"),
      bundleId: z.string().describe("App bundle identifier (e.g., com.example.app)"),
    },
    withErrorHandling(async (args) => appUninstall(args, environment)),
  );

  server.tool(
    "app_launch",
    "Launch an installed app on a simulator",
    {
      deviceId: z.string().describe("Simulator UDID"),
      bundleId: z.string().describe("App bundle identifier"),
      args: z.array(z.string()).optional().describe("Launch arguments"),
      consolePty: z.boolean().optional().describe("Attach console output"),
    },
    withErrorHandling(async (args) => appLaunch(args, environment)),
  );

  server.tool(
    "app_terminate",
    "Terminate a running app on a simulator",
    {
      deviceId: z.string().describe("Simulator UDID"),
      bundleId: z.string().describe("App bundle identifier"),
    },
    withErrorHandling(async (args) => appTerminate(args, environment)),
  );

  server.tool(
    "app_get_container",
    "Get the file system path to an app's container (app bundle, data, or app group)",
    {
      deviceId: z.string().describe("Simulator UDID"),
      bundleId: z.string().describe("App bundle identifier"),
      container: z
        .string()
        .optional()
        .describe(
          'Container type: "app" (bundle), "data", "groups", or a specific app group identifier',
        ),
    },
    withErrorHandling(async (args) => appGetContainer(args, environment)),
  );

  server.tool(
    "app_list",
    "List all installed apps on a simulator",
    {
      deviceId: z.string().describe("Simulator UDID"),
    },
    withErrorHandling(async (args) => appList(args, environment)),
  );

  server.tool(
    "app_open_url",
    "Open a URL on a simulator for deep link and universal link testing",
    {
      deviceId: z.string().describe("Simulator UDID"),
      url: z.string().describe("URL to open (e.g., https://example.com or myapp://path)"),
    },
    withErrorHandling(async (args) => appOpenUrl(args, environment)),
  );

  server.tool(
    "app_privacy",
    "Grant, revoke, or reset privacy permissions for an app on a simulator",
    {
      deviceId: z.string().describe("Simulator UDID"),
      action: z
        .enum(["grant", "revoke", "reset"])
        .describe("Permission action: grant, revoke, or reset"),
      service: z
        .enum([
          "all",
          "calendar",
          "contacts-limited",
          "contacts",
          "location",
          "location-always",
          "photos-add",
          "photos",
          "media-library",
          "microphone",
          "motion",
          "reminders",
          "siri",
          "speech-recognition",
          "camera",
          "faceid",
          "health",
          "homekit",
          "usertracking",
        ])
        .describe("Privacy service to modify"),
      bundleId: z.string().optional().describe("App bundle identifier (required for grant/revoke)"),
    },
    withErrorHandling(async (args) => appPrivacy(args, environment)),
  );
}
