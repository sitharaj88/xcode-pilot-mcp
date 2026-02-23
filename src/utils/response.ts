import type { ExecResult } from "../types.js";
import { logger } from "./logger.js";

const MAX_RESPONSE_LENGTH = 100_000;

export interface ToolResponse {
  [key: string]: unknown;
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
}

export function textResponse(text: string): ToolResponse {
  const truncated =
    text.length > MAX_RESPONSE_LENGTH
      ? text.slice(0, MAX_RESPONSE_LENGTH) + "\n\n... [output truncated]"
      : text;

  return {
    content: [{ type: "text", text: truncated }],
  };
}

export function errorResponse(text: string): ToolResponse {
  return {
    content: [{ type: "text", text }],
    isError: true,
  };
}

export function execResultResponse(result: ExecResult): ToolResponse {
  if (result.timedOut) {
    return errorResponse(
      `Command timed out.\n\nPartial stdout:\n${result.stdout}\n\nPartial stderr:\n${result.stderr}`,
    );
  }

  if (!result.success) {
    const message = result.stderr || result.stdout || "Command failed with no output";
    return errorResponse(message);
  }

  const output = result.stdout || result.stderr || "Command completed successfully (no output)";
  return textResponse(output);
}

export function withErrorHandling<T>(
  handler: (args: T) => Promise<ToolResponse>,
): (args: T) => Promise<ToolResponse> {
  return async (args: T): Promise<ToolResponse> => {
    try {
      return await handler(args);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error("Tool execution failed", { error: message });
      return errorResponse(`Unexpected error: ${message}`);
    }
  };
}
