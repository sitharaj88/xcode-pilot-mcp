import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";
import { validateSafeName } from "../../utils/validation.js";

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

  const filePath = join(args.outputPath, `${args.name}.swift`);

  if (existsSync(filePath)) {
    return errorResponse(`File already exists: ${filePath}`);
  }

  mkdirSync(dirname(filePath), { recursive: true });

  const isConfigurable = args.kind === "configurable";

  const content = `import WidgetKit
import SwiftUI

struct ${args.name}Entry: TimelineEntry {
    let date: Date
    let message: String
}

struct ${args.name}Provider: TimelineProvider {
    func placeholder(in context: Context) -> ${args.name}Entry {
        ${args.name}Entry(date: Date(), message: "Placeholder")
    }

    func getSnapshot(in context: Context, completion: @escaping (${args.name}Entry) -> Void) {
        let entry = ${args.name}Entry(date: Date(), message: "Snapshot")
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<${args.name}Entry>) -> Void) {
        let entry = ${args.name}Entry(date: Date(), message: "Hello")
        let timeline = Timeline(entries: [entry], policy: .atEnd)
        completion(timeline)
    }
}

struct ${args.name}View: View {
    var entry: ${args.name}Provider.Entry

    var body: some View {
        VStack {
            Text(entry.message)
            Text(entry.date, style: .time)
        }
    }
}

@main
struct ${args.name}: Widget {
    let kind: String = "${args.name}"

    var body: some WidgetConfiguration {
        ${
          isConfigurable
            ? `IntentConfiguration(kind: kind, provider: ${args.name}Provider()) { entry in
            ${args.name}View(entry: entry)
        }
        .configurationDisplayName("${args.name}")
        .description("A configurable widget.")`
            : `StaticConfiguration(kind: kind, provider: ${args.name}Provider()) { entry in
            ${args.name}View(entry: entry)
        }
        .configurationDisplayName("${args.name}")
        .description("A static widget.")`
        }
    }
}

#Preview(as: .systemSmall) {
    ${args.name}()
} timeline: {
    ${args.name}Entry(date: .now, message: "Preview")
}
`;

  writeFileSync(filePath, content);
  return textResponse(`Widget created: ${filePath}`);
}
