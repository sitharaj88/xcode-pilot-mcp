import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";

interface ListArgs {
  state?: string;
}

export async function simulatorList(args: ListArgs, _env: Environment): Promise<ToolResponse> {
  const result = await executeCommand("xcrun", ["simctl", "list", "devices", "-j"]);

  if (!result.success) {
    return errorResponse(result.stderr || "Failed to list simulators");
  }

  try {
    const data = JSON.parse(result.stdout);
    const devices: Record<string, unknown[]> = data.devices || {};

    if (args.state) {
      const filtered: Record<string, unknown[]> = {};
      for (const [runtime, deviceList] of Object.entries(devices)) {
        const match = (deviceList as Array<{ state?: string }>).filter(
          (d) => d.state?.toLowerCase() === args.state?.toLowerCase(),
        );
        if (match.length > 0) filtered[runtime] = match;
      }
      return textResponse(JSON.stringify({ devices: filtered }, null, 2));
    }

    return textResponse(JSON.stringify(data, null, 2));
  } catch {
    return textResponse(result.stdout);
  }
}
