import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";
import { validateAbsolutePath, validateSafeName } from "../../utils/validation.js";
import { loadTemplate, renderTemplate } from "./template.js";

interface ScaffoldViewArgs {
  name: string;
  outputPath: string;
  includePreview?: boolean;
}

export async function scaffoldView(
  args: ScaffoldViewArgs,
  _env: Environment,
): Promise<ToolResponse> {
  validateSafeName(args.name);
  validateAbsolutePath(args.outputPath);

  const includePreview = args.includePreview !== false;
  const filePath = join(args.outputPath, `${args.name}.swift`);

  if (existsSync(filePath)) {
    return errorResponse(`File already exists: ${filePath}`);
  }

  mkdirSync(dirname(filePath), { recursive: true });

  const previewBlock = includePreview
    ? `
#Preview {
    {{NAME}}()
}
`
    : "";

  const template = loadTemplate("SwiftUIView.swift.template");
  const content = renderTemplate(template, [
    ["PREVIEW_BLOCK", previewBlock],
    ["NAME", args.name],
  ]);

  writeFileSync(filePath, content);
  return textResponse(`SwiftUI View created: ${filePath}`);
}
