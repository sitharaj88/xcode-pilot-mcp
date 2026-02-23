import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";
import { validateSafeName } from "../../utils/validation.js";

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

  const properties = attrs
    .map((a) => `    @NSManaged public var ${a.name}: ${swiftType(a.type)}?`)
    .join("\n");

  const content = `import Foundation
import CoreData

@objc(${args.name})
public class ${args.name}: NSManagedObject {
    @nonobjc public class func fetchRequest() -> NSFetchRequest<${args.name}> {
        return NSFetchRequest<${args.name}>(entityName: "${args.name}")
    }

${properties}
}

extension ${args.name}: Identifiable {}
`;

  writeFileSync(filePath, content);
  return textResponse(`Core Data model created: ${filePath}`);
}
