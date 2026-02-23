import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Environment } from "../../types.js";
import { withErrorHandling } from "../../utils/response.js";
import { signingIdentities } from "./signing-identities.js";
import { provisioningProfiles } from "./provisioning-profiles.js";
import { profileInspect } from "./profile-inspect.js";
import { keychainList } from "./keychain-list.js";
import { entitlementsCheck } from "./entitlements-check.js";

export function registerSigningTools(server: McpServer, environment: Environment): void {
  server.tool(
    "signing_identities",
    "List all code signing identities available on this machine",
    {},
    withErrorHandling(async () => signingIdentities(environment)),
  );

  server.tool(
    "provisioning_profiles",
    "List all installed provisioning profiles with name, UUID, team, and expiration",
    {},
    withErrorHandling(async () => provisioningProfiles(environment)),
  );

  server.tool(
    "profile_inspect",
    "Decode and inspect a provisioning profile to see its full contents",
    {
      profilePath: z.string().describe("Absolute path to the .mobileprovision file"),
    },
    withErrorHandling(async (args) => profileInspect(args, environment)),
  );

  server.tool(
    "keychain_list",
    "List all keychains on this machine",
    {},
    withErrorHandling(async () => keychainList(environment)),
  );

  server.tool(
    "entitlements_check",
    "Show the entitlements embedded in a built app bundle",
    {
      appPath: z.string().describe("Absolute path to the .app bundle"),
    },
    withErrorHandling(async (args) => entitlementsCheck(args, environment)),
  );
}
