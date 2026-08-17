export interface Environment {
  xcodePath: string;
  xcrunPath: string;
  xcodebuildPath: string;
  xcodebuildAvailable: boolean;
  simctlAvailable: boolean;
  devicectlAvailable: boolean;
}

export interface ExecResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  timedOut: boolean;
  bufferExceeded: boolean;
}

export interface ExecOptions {
  timeout?: number;
  cwd?: string;
  env?: Record<string, string>;
  maxBuffer?: number;
}
