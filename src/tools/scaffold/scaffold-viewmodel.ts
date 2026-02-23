import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";
import { validateSafeName } from "../../utils/validation.js";

interface ScaffoldViewModelArgs {
  name: string;
  outputPath: string;
}

export async function scaffoldViewModel(
  args: ScaffoldViewModelArgs,
  _env: Environment,
): Promise<ToolResponse> {
  validateSafeName(args.name);

  const filePath = join(args.outputPath, `${args.name}.swift`);

  if (existsSync(filePath)) {
    return errorResponse(`File already exists: ${filePath}`);
  }

  mkdirSync(dirname(filePath), { recursive: true });

  const content = `import Foundation
import Observation

@Observable
final class ${args.name} {
    // MARK: - Properties

    var isLoading = false
    var errorMessage: String?

    // MARK: - Methods

    func load() async {
        isLoading = true
        defer { isLoading = false }

        do {
            // TODO: Implement data loading
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
`;

  writeFileSync(filePath, content);
  return textResponse(`ViewModel created: ${filePath}`);
}
