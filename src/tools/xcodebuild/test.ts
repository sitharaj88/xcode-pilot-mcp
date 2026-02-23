import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { execResultResponse, type ToolResponse } from "../../utils/response.js";
import { resolveProjectArgs } from "./build-utils.js";

interface TestArgs {
  scheme: string;
  destination: string;
  projectPath?: string;
  testPlan?: string;
  onlyTesting?: string[];
  skipTesting?: string[];
}

export async function xcodeTest(args: TestArgs, env: Environment): Promise<ToolResponse> {
  const cmdArgs = [
    "test",
    ...resolveProjectArgs(args.projectPath),
    "-scheme",
    args.scheme,
    "-destination",
    args.destination,
  ];

  if (args.testPlan) cmdArgs.push("-testPlan", args.testPlan);
  if (args.onlyTesting) {
    for (const target of args.onlyTesting) {
      cmdArgs.push("-only-testing:" + target);
    }
  }
  if (args.skipTesting) {
    for (const target of args.skipTesting) {
      cmdArgs.push("-skip-testing:" + target);
    }
  }

  const result = await executeCommand(env.xcodebuildPath, cmdArgs, { timeout: 600_000 });
  return execResultResponse(result);
}

export async function xcodeTestWithoutBuilding(
  args: TestArgs,
  env: Environment,
): Promise<ToolResponse> {
  const cmdArgs = [
    "test-without-building",
    ...resolveProjectArgs(args.projectPath),
    "-scheme",
    args.scheme,
    "-destination",
    args.destination,
  ];

  if (args.testPlan) cmdArgs.push("-testPlan", args.testPlan);
  if (args.onlyTesting) {
    for (const target of args.onlyTesting) {
      cmdArgs.push("-only-testing:" + target);
    }
  }
  if (args.skipTesting) {
    for (const target of args.skipTesting) {
      cmdArgs.push("-skip-testing:" + target);
    }
  }

  const result = await executeCommand(env.xcodebuildPath, cmdArgs, { timeout: 600_000 });
  return execResultResponse(result);
}
