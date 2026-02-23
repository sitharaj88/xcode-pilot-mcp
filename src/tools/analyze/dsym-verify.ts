import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";
import { validateAbsolutePath } from "../../utils/validation.js";

interface DsymVerifyArgs {
  dsymPath: string;
  binaryPath: string;
}

export async function dsymVerify(args: DsymVerifyArgs, _env: Environment): Promise<ToolResponse> {
  validateAbsolutePath(args.dsymPath);
  validateAbsolutePath(args.binaryPath);

  const dsymResult = await executeCommand("dwarfdump", ["--uuid", args.dsymPath]);
  const binaryResult = await executeCommand("dwarfdump", ["--uuid", args.binaryPath]);

  if (!dsymResult.success) {
    return errorResponse(`Failed to read dSYM UUIDs: ${dsymResult.stderr}`);
  }
  if (!binaryResult.success) {
    return errorResponse(`Failed to read binary UUIDs: ${binaryResult.stderr}`);
  }

  const extractUuids = (output: string): string[] => {
    const matches = output.matchAll(/UUID: ([A-F0-9-]+)/gi);
    return [...matches].map((m) => m[1].toUpperCase());
  };

  const dsymUuids = extractUuids(dsymResult.stdout);
  const binaryUuids = extractUuids(binaryResult.stdout);

  const matching = dsymUuids.filter((u) => binaryUuids.includes(u));
  const allMatch = dsymUuids.length > 0 && dsymUuids.every((u) => binaryUuids.includes(u));

  const output = [
    `dSYM UUIDs:`,
    ...dsymUuids.map((u) => `  ${u}`),
    ``,
    `Binary UUIDs:`,
    ...binaryUuids.map((u) => `  ${u}`),
    ``,
    allMatch
      ? `Result: MATCH - All ${matching.length} UUID(s) match. dSYM is valid for this binary.`
      : `Result: MISMATCH - dSYM does not match the binary. ${matching.length}/${dsymUuids.length} UUIDs matched.`,
  ];

  return textResponse(output.join("\n"));
}
