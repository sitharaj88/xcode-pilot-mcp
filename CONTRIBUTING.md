# Contributing to xcode-pilot-mcp

Thank you for your interest in contributing! This guide covers everything you need to set up a development environment, understand the codebase, and submit high-quality pull requests.

---

## Table of Contents

- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [How It Works](#how-it-works)
- [Adding a New Tool](#adding-a-new-tool)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Release Process](#release-process)

---

## Development Setup

### Prerequisites

- **macOS** (Xcode tools are macOS-only)
- **Node.js** >= 20 (check with `node --version`)
- **Xcode** installed with Command Line Tools (`xcode-select --install`)

### Getting Started

```bash
# Fork the repo on GitHub, then clone your fork
git clone https://github.com/<your-username>/xcode-pilot-mcp.git
cd xcode-pilot-mcp

# Install dependencies
npm install

# Build the project
npm run build

# Run tests to verify everything works
npm test

# Run the full quality check
npm run check
```

### Useful Commands

| Command                 | Description                                    |
| ----------------------- | ---------------------------------------------- |
| `npm run build`         | Compile TypeScript + copy templates + chmod +x |
| `npm run dev`           | Watch mode for development                     |
| `npm test`              | Run all tests                                  |
| `npm run test:coverage` | Run tests with V8 coverage report              |
| `npm run lint`          | Run ESLint                                     |
| `npm run lint:fix`      | Run ESLint with auto-fix                       |
| `npm run format`        | Format code with Prettier                      |
| `npm run format:check`  | Check formatting without writing               |
| `npm run typecheck`     | Run TypeScript type checker                    |
| `npm run check`         | Run typecheck + lint + format:check            |

### Pre-commit Hooks

The project uses **Husky** and **lint-staged** to automatically lint and format staged files before every commit. This runs automatically after `npm install` sets up the git hooks via the `prepare` script.

---

## Project Structure

```
src/
├── index.ts              # MCP server entry — creates McpServer, registers all tool categories
├── types.ts              # Shared TypeScript interfaces (Environment, ExecResult, ExecOptions)
├── executor.ts           # Shell command execution wrappers
│                           • executeCommand() — wraps child_process.execFile
│                           • spawnDetached() — for background processes (screen recording)
│                           • executeCommandWithStdin() — pipes data to stdin (push notifications)
├── environment.ts        # Xcode environment detection via xcode-select and which
├── utils/
│   ├── response.ts       # Response helpers: textResponse, errorResponse, withErrorHandling
│   ├── validation.ts     # Input validators: paths, bundle IDs, safe names
│   └── logger.ts         # Structured logging to stderr (stdout is reserved for MCP protocol)
├── tools/                # One subdirectory per tool category
│   ├── <category>/
│   │   ├── index.ts      # register<Category>Tools(server, environment) function
│   │   ├── <tool>.ts     # Individual tool handler
│   │   └── ...
│   └── ...
└── templates/            # Swift project and component templates
    ├── SwiftUIView.swift.template
    ├── ViewModel.swift.template
    ├── CoreDataModel.swift.template
    └── Widget.swift.template

tests/
├── executor.test.ts       # Tests for command execution
├── environment.test.ts    # Tests for Xcode environment detection
├── utils/
│   ├── response.test.ts   # Tests for response utilities
│   └── validation.test.ts # Tests for input validation
└── tools/
    ├── build.test.ts      # Tests for all 8 build tools
    ├── simulator.test.ts  # Tests for all 10 simulator tools
    └── ...                # One test file per tool category
```

---

## How It Works

### MCP Server Lifecycle

1. **`src/index.ts`** creates a `McpServer` instance
2. **`detectEnvironment()`** verifies Xcode is installed and locates tools (`xcrun`, `xcodebuild`, `simctl`, `devicectl`)
3. **11 `register*Tools()` functions** register all 67 tools with the server
4. **`StdioServerTransport`** connects the server to stdin/stdout
5. **Graceful shutdown** handlers clean up on SIGINT/SIGTERM

### Tool Registration Pattern

Every tool category follows this pattern:

```typescript
// src/tools/<category>/index.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { withErrorHandling } from "../../utils/response.js";
import { myToolHandler } from "./my-tool.js";

export function registerCategoryTools(server: McpServer, environment: Environment): void {
  server.tool(
    "tool_name", // Unique tool name
    "Description for AI assistant", // Human-readable description
    {
      // Zod schema for input validation
      requiredParam: z.string().describe("What this param does"),
      optionalParam: z.boolean().optional().describe("Optional flag"),
    },
    withErrorHandling(async (args) => myToolHandler(args, environment)),
  );
}
```

### Tool Handler Pattern

```typescript
// src/tools/<category>/my-tool.ts
import { executeCommand } from "../../executor.js";
import type { Environment } from "../../types.js";
import { textResponse, errorResponse, type ToolResponse } from "../../utils/response.js";

interface MyToolArgs {
  requiredParam: string;
  optionalParam?: boolean;
}

export async function myToolHandler(args: MyToolArgs, _env: Environment): Promise<ToolResponse> {
  // 1. Validate inputs (if needed beyond zod)
  // 2. Build command arguments
  const cmdArgs = ["simctl", "something", args.requiredParam];

  // 3. Execute command
  const result = await executeCommand("xcrun", cmdArgs);

  // 4. Return response
  if (!result.success) {
    return errorResponse(result.stderr || "Something failed");
  }
  return textResponse(result.stdout);
}
```

### Response Types

| Function                     | When to use                            |
| ---------------------------- | -------------------------------------- |
| `textResponse(text)`         | Successful operations with text output |
| `errorResponse(text)`        | Failed operations with error message   |
| `execResultResponse(result)` | Shorthand — auto-formats an ExecResult |

### Error Handling

- **`withErrorHandling()`** wraps every tool handler to catch unexpected exceptions
- **`ValidationError`** is thrown by validation utilities for bad inputs
- Tool handlers should return `errorResponse()` for expected failures (e.g., simulator not booted)
- Tool handlers should throw for truly unexpected errors (caught by `withErrorHandling`)

---

## Adding a New Tool

### Step 1: Create the handler file

```bash
# Example: adding a new simulator tool
touch src/tools/simulator/my-new-tool.ts
```

Write the handler function following the [handler pattern](#tool-handler-pattern) above.

### Step 2: Register the tool

Add the tool registration to the category's `index.ts`:

```typescript
import { myNewTool } from "./my-new-tool.js";

// Inside the register function:
server.tool(
  "my_new_tool",
  "Clear description of what this tool does",
  {
    /* zod schema */
  },
  withErrorHandling(async (args) => myNewTool(args, environment)),
);
```

### Step 3: Write tests

Add tests to the appropriate `tests/tools/<category>.test.ts`:

```typescript
describe("myNewTool", () => {
  beforeEach(() => vi.clearAllMocks());

  it("succeeds with valid input", async () => {
    mockSuccess("expected output");
    const res = await myNewTool({ param: "value" }, env);
    expect(res.content[0].text).toContain("expected");
  });

  it("handles failure gracefully", async () => {
    mockFailure("error message");
    const res = await myNewTool({ param: "value" }, env);
    expect(res.isError).toBe(true);
  });
});
```

### Step 4: Update documentation

- Add the tool to the README.md tool reference table
- Update the tool count in the README header if needed

### Step 5: Verify

```bash
npm run check   # Lint, format, typecheck
npm test         # All tests pass
npm run build    # Build succeeds
```

---

## Coding Standards

### TypeScript

- **Strict mode** is enabled — no implicit any, strict null checks, etc.
- Use **explicit return types** on exported functions
- Use **`type`** imports for type-only imports: `import type { Environment } from "..."`
- Use **`.js` extensions** in imports (required for Node16 module resolution)
- Prefer **interfaces** over type aliases for object shapes

### Formatting

- **Prettier** handles all formatting — do not manually format
- 100 character line width
- 2-space indentation
- Semicolons, double quotes, trailing commas
- LF line endings

### Linting

- **ESLint** with TypeScript and Prettier plugins
- Unused variables must be prefixed with `_` (e.g., `_env`)
- Explicit `any` types generate warnings
- Fix all errors and warnings before submitting

### Naming Conventions

| Type       | Convention       | Example                |
| ---------- | ---------------- | ---------------------- |
| Files      | kebab-case       | `build-settings.ts`    |
| Interfaces | PascalCase       | `BuildSettingsArgs`    |
| Functions  | camelCase        | `xcodeBuildSettings`   |
| Tool names | snake_case       | `xcode_build_settings` |
| Constants  | UPPER_SNAKE_CASE | `DEFAULT_TIMEOUT`      |

### Tool Descriptions

- Write descriptions from the AI assistant's perspective
- Be specific about what the tool does and what it returns
- Include examples in `.describe()` annotations where helpful:
  ```typescript
  z.string().describe('Build destination (e.g., "platform=iOS Simulator,name=iPhone 16")');
  ```

---

## Testing

### Framework

Tests use **Vitest** with the following conventions:

- Mock `child_process` using `vi.hoisted()` + `vi.mock()` at the top of each test file
- Use `beforeEach(() => vi.clearAllMocks())` for test isolation
- Tests should **never** require actual Xcode/simulators to run

### Mock Pattern

```typescript
const { execFile } = vi.hoisted(() => ({
  execFile: vi.fn(),
}));

vi.mock("node:child_process", () => ({ execFile, spawn: vi.fn() }));

function mockSuccess(stdout = "") {
  execFile.mockImplementation((_c, _a, _o, cb) => {
    cb(null, stdout, "");
  });
}

function mockFailure(stderr = "Failed") {
  const error = Object.assign(new Error("fail"), { code: 1 });
  execFile.mockImplementation((_c, _a, _o, cb) => {
    cb(error, "", stderr);
  });
}
```

### What to Test

For each tool, test:

1. **Success path** — correct output for valid inputs
2. **Failure path** — error response for command failures
3. **Command construction** — verify the correct CLI arguments are built
4. **Input validation** — invalid inputs are rejected
5. **Edge cases** — already booted simulators, empty outputs, etc.

### Running Tests

```bash
npm test                    # All tests
npm run test:coverage       # With coverage
npx vitest run tests/tools/build.test.ts  # Single file
npx vitest --reporter=verbose  # Verbose output
```

### Coverage Target

- **Statements**: >= 15% (minimum threshold in vitest.config.ts)
- **Goal**: >= 80% for new code

---

## Pull Request Guidelines

### Before Submitting

1. **Create a feature branch** from `main`:

   ```bash
   git checkout -b feature/my-new-tool
   ```

2. **Make your changes** following the coding standards above

3. **Run the full quality check**:

   ```bash
   npm run check && npm test
   ```

4. **Build successfully**:
   ```bash
   npm run build
   ```

### PR Requirements

- **Title**: Short, descriptive (e.g., "Add simulator_pair tool for Watch pairing")
- **Description**: Explain what and why, not just how
- **Tests**: All new tools must have tests
- **Docs**: Update README.md tool reference tables
- **Single focus**: One feature or fix per PR
- **Clean history**: Squash WIP commits before requesting review

### Review Process

1. CI must pass (lint, typecheck, tests, build)
2. At least one maintainer review
3. All review comments addressed
4. Squash-merged to `main`

---

## Release Process

Releases are published to npm by maintainers:

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create a git tag: `git tag v1.x.x`
4. Push tag: `git push origin v1.x.x`
5. Publish: `npm publish`

The `prepublishOnly` script automatically runs the full quality gate (typecheck, lint, format check, tests, build) before publishing.
