import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";
import { validateAbsolutePath, validateSafeName } from "../../utils/validation.js";
import { loadTemplate, renderTemplate } from "./template.js";

interface ScaffoldViewModelArgs {
  name: string;
  outputPath: string;
}

export async function scaffoldViewModel(
  args: ScaffoldViewModelArgs,
  _env: Environment,
): Promise<ToolResponse> {
  validateSafeName(args.name);
  validateAbsolutePath(args.outputPath);

  const filePath = join(args.outputPath, `${args.name}.swift`);

  if (existsSync(filePath)) {
    return errorResponse(`File already exists: ${filePath}`);
  }

  mkdirSync(dirname(filePath), { recursive: true });

  const template = loadTemplate("ViewModel.swift.template");
  const content = renderTemplate(template, [["NAME", args.name]]);

  writeFileSync(filePath, content);
  return textResponse(`ViewModel created: ${filePath}`);
}
