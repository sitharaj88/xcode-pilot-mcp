import { isAbsolute } from "node:path";

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export function validateAbsolutePath(path: string): string {
  if (!path || !isAbsolute(path)) {
    throw new ValidationError(`Path must be absolute: "${path}"`);
  }
  return path;
}

export function validateBundleId(bundleId: string): string {
  if (!bundleId || !/^[a-zA-Z][a-zA-Z0-9.-]*(\.[a-zA-Z][a-zA-Z0-9-]*)+$/.test(bundleId)) {
    throw new ValidationError(
      `Invalid bundle identifier: "${bundleId}". Expected format: com.example.app`,
    );
  }
  return bundleId;
}

export function validateSafeName(name: string): string {
  if (!name || !/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(name)) {
    throw new ValidationError(
      `Invalid name: "${name}". Must start with a letter and contain only letters, numbers, hyphens, and underscores.`,
    );
  }
  return name;
}
