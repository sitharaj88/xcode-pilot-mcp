import type { ExecResult } from "../types.js";
import { logger } from "./logger.js";

const MAX_RESPONSE_LENGTH = 100_000;
const HEAD_LENGTH = 30_000;
const TAIL_LENGTH = 70_000;

export interface ToolResponse {
  [key: string]: unknown;
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
}

function truncateHeadTail(text: string): string {
  if (text.length <= MAX_RESPONSE_LENGTH) {
    return text;
  }

  const head = text.slice(0, HEAD_LENGTH);
  const tail = text.slice(text.length - TAIL_LENGTH);
  const omitted = text.length - HEAD_LENGTH - TAIL_LENGTH;

  return `${head}\n\n... [output truncated: ${omitted} chars omitted] ...\n\n${tail}`;
}

export function textResponse(text: string): ToolResponse {
  return {
    content: [{ type: "text", text: truncateHeadTail(text) }],
  };
}

export function errorResponse(text: string): ToolResponse {
  return {
    content: [{ type: "text", text: truncateHeadTail(text) }],
    isError: true,
  };
}

export function execResultResponse(result: ExecResult): ToolResponse {
  if (result.bufferExceeded) {
    return errorResponse(
      `Output exceeded the 10MB buffer limit.\n\nPartial stdout:\n${result.stdout}\n\nPartial stderr:\n${result.stderr}`,
    );
  }

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
