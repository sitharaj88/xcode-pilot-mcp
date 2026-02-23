export function resolveProjectArgs(projectPath?: string): string[] {
  if (!projectPath) return [];

  if (projectPath.endsWith(".xcworkspace")) {
    return ["-workspace", projectPath];
  }
  if (projectPath.endsWith(".xcodeproj")) {
    return ["-project", projectPath];
  }

  return ["-project", projectPath];
}
