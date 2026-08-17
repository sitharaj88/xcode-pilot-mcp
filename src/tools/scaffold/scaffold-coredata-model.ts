import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";
import { validateAbsolutePath, validateSafeName } from "../../utils/validation.js";
import { loadTemplate, renderTemplate } from "./template.js";

interface Attribute {
  name: string;
  type: string;
}

interface ScaffoldCoreDataModelArgs {
  name: string;
  outputPath: string;
  attributes?: Attribute[];
}

function swiftType(coreDataType: string): string {
  const mapping: Record<string, string> = {
    String: "String",
    Integer16: "Int16",
    Integer32: "Int32",
    Integer64: "Int64",
    Double: "Double",
    Float: "Float",
    Boolean: "Bool",
    Date: "Date",
    Binary: "Data",
    UUID: "UUID",
    URI: "URL",
  };
  return mapping[coreDataType] || "String";
}

export async function scaffoldCoreDataModel(
  args: ScaffoldCoreDataModelArgs,
  _env: Environment,
): Promise<ToolResponse> {
  validateSafeName(args.name);
  validateAbsolutePath(args.outputPath);

  const filePath = join(args.outputPath, `${args.name}+CoreData.swift`);

  if (existsSync(filePath)) {
    return errorResponse(`File already exists: ${filePath}`);
  }

  mkdirSync(dirname(filePath), { recursive: true });

  const attrs = args.attributes || [
    { name: "id", type: "UUID" },
    { name: "name", type: "String" },
    { name: "createdAt", type: "Date" },
  ];

  for (const attr of attrs) {
    validateSafeName(attr.name);
  }

  const properties = attrs
    .map((a) => `    @NSManaged public var ${a.name}: ${swiftType(a.type)}?`)
    .join("\n");

  const template = loadTemplate("CoreDataModel.swift.template");
  const content = renderTemplate(template, [
    ["PROPERTIES", properties],
    ["NAME", args.name],
  ]);

  writeFileSync(filePath, content);
  return textResponse(
    `Core Data model created: ${filePath}\n\n` +
      "Note: this generates only the NSManagedObject subclass. " +
      `A matching "${args.name}" entity with these attributes must also exist in your .xcdatamodeld file.`,
  );
}
