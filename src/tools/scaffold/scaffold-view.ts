import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";
import { validateSafeName } from "../../utils/validation.js";

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

  const includePreview = args.includePreview !== false;
  const filePath = join(args.outputPath, `${args.name}.swift`);

  if (existsSync(filePath)) {
    return errorResponse(`File already exists: ${filePath}`);
  }

  mkdirSync(dirname(filePath), { recursive: true });

  let content = `import SwiftUI

struct ${args.name}: View {
    var body: some View {
        Text("${args.name}")
    }
}
`;

  if (includePreview) {
    content += `
#Preview {
    ${args.name}()
}
`;
  }

  writeFileSync(filePath, content);
  return textResponse(`SwiftUI View created: ${filePath}`);
}
