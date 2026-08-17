import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Environment } from "../../types.js";
import { withErrorHandling } from "../../utils/response.js";
import { createProject } from "./create-project.js";
import { scaffoldView } from "./scaffold-view.js";
import { scaffoldViewModel } from "./scaffold-viewmodel.js";
import { scaffoldCoreDataModel } from "./scaffold-coredata-model.js";
import { scaffoldWidget } from "./scaffold-widget.js";

export function registerScaffoldTools(server: McpServer, environment: Environment): void {
  server.tool(
    "project_create",
    "Create a new Xcode app project (source tree + XcodeGen project.yml). If xcodegen is installed " +
      "on PATH, runs `xcodegen generate` and returns the resulting .xcodeproj path; otherwise " +
      "creates the source tree and project.yml and reports how to generate the .xcodeproj manually",
    {
      name: z
        .string()
        .describe("Project name (must start with a letter; letters, numbers, underscores)"),
      template: z.enum(["swiftui", "uikit"]).describe("Project template: SwiftUI or UIKit"),
      platform: z.enum(["ios", "macos", "multiplatform"]).describe("Target platform"),
      outputPath: z.string().describe("Parent directory where the project folder will be created"),
      bundleId: z
        .string()
        .optional()
        .describe("Bundle identifier (default: com.<organizationName>.<name>)"),
      organizationName: z.string().optional().describe("Organization name"),
      minimumDeploymentTarget: z
        .string()
        .optional()
        .describe('Minimum deployment target (default: "17.0")'),
    },
    withErrorHandling(async (args) => createProject(args, environment)),
  );

  server.tool(
    "scaffold_view",
    "Generate a SwiftUI View file with optional preview provider",
    {
      name: z.string().describe("View name (e.g., ProfileView)"),
      outputPath: z.string().describe("Directory to create the file in"),
      includePreview: z.boolean().optional().describe("Include #Preview macro (default: true)"),
    },
    withErrorHandling(async (args) => scaffoldView(args, environment)),
  );

  server.tool(
    "scaffold_viewmodel",
    "Generate an @Observable ViewModel class",
    {
      name: z.string().describe("ViewModel name (e.g., ProfileViewModel)"),
      outputPath: z.string().describe("Directory to create the file in"),
    },
    withErrorHandling(async (args) => scaffoldViewModel(args, environment)),
  );

  server.tool(
    "scaffold_coredata_model",
    "Generate a Core Data NSManagedObject subclass with attributes",
    {
      name: z.string().describe("Entity name (e.g., User, Task)"),
      outputPath: z.string().describe("Directory to create the file in"),
      attributes: z
        .array(
          z.object({
            name: z.string().describe("Attribute name"),
            type: z
              .enum([
                "String",
                "Integer16",
                "Integer32",
                "Integer64",
                "Double",
                "Float",
                "Boolean",
                "Date",
                "Binary",
                "UUID",
                "URI",
              ])
              .describe("Core Data attribute type"),
          }),
        )
        .optional()
        .describe("Entity attributes (defaults to id, name, createdAt)"),
    },
    withErrorHandling(async (args) => scaffoldCoreDataModel(args, environment)),
  );

  server.tool(
    "scaffold_widget",
    "Generate a WidgetKit extension: 'static' uses TimelineProvider/StaticConfiguration, " +
      "'configurable' uses the AppIntents-based WidgetConfigurationIntent/AppIntentConfiguration API (iOS 17+)",
    {
      name: z.string().describe("Widget name (e.g., StatusWidget)"),
      outputPath: z.string().describe("Directory to create the file in"),
      kind: z
        .enum(["static", "configurable"])
        .optional()
        .describe('Widget type (default: "static")'),
    },
    withErrorHandling(async (args) => scaffoldWidget(args, environment)),
  );
}
