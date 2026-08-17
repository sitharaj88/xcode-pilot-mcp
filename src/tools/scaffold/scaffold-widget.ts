import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";
import { validateAbsolutePath, validateSafeName } from "../../utils/validation.js";
import { loadTemplate, renderTemplate } from "./template.js";

interface ScaffoldWidgetArgs {
  name: string;
  outputPath: string;
  kind?: string;
}

export async function scaffoldWidget(
  args: ScaffoldWidgetArgs,
  _env: Environment,
): Promise<ToolResponse> {
  validateSafeName(args.name);
  validateAbsolutePath(args.outputPath);

  const filePath = join(args.outputPath, `${args.name}.swift`);

  if (existsSync(filePath)) {
    return errorResponse(`File already exists: ${filePath}`);
  }

  mkdirSync(dirname(filePath), { recursive: true });

  const isConfigurable = args.kind === "configurable";
  const templateName = isConfigurable
    ? "WidgetConfigurable.swift.template"
    : "Widget.swift.template";

  const template = loadTemplate(templateName);
  const content = renderTemplate(template, [["NAME", args.name]]);

  writeFileSync(filePath, content);
  return textResponse(`Widget created: ${filePath}`);
}
