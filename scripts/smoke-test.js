#!/usr/bin/env node
import { spawn } from "child_process";
import { createInterface } from "readline";

const TIMEOUT_MS = 15000;
const EXPECTED_TOOL_COUNT = 65;

async function smokeTest() {
  return new Promise((resolve) => {
    let timedOut = false;
    let receivedInitializeResponse = false;
    let receivedToolsListResponse = false;
    let toolCount = 0;

    const timeoutHandle = setTimeout(() => {
      timedOut = true;
      console.error(`FAIL: Timeout after ${TIMEOUT_MS}ms - server did not respond in time`);
      process.exit(1);
    }, TIMEOUT_MS);

    const server = spawn("node", ["build/index.js"], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    const rl = createInterface({
      input: server.stdout,
      crlfDelay: Infinity,
    });

    let messageId = 1;

    rl.on("line", (line) => {
      if (timedOut) return;

      try {
        const response = JSON.parse(line);

        if (response.result && response.result.protocolVersion) {
          receivedInitializeResponse = true;
          console.log("✓ Initialize response received");

          // Send initialized notification after successful initialize
          const initializedMsg = {
            jsonrpc: "2.0",
            method: "notifications/initialized",
          };
          server.stdin.write(JSON.stringify(initializedMsg) + "\n");

          // Send tools/list request
          messageId = 2;
          const toolsListMsg = {
            jsonrpc: "2.0",
            id: messageId,
            method: "tools/list",
          };
          server.stdin.write(JSON.stringify(toolsListMsg) + "\n");
        }

        if (response.id === 2 && response.result && response.result.tools) {
          receivedToolsListResponse = true;
          toolCount = response.result.tools.length;
          console.log(`✓ Tools list response received: ${toolCount} tools`);

          if (toolCount === EXPECTED_TOOL_COUNT) {
            console.log(`✓ Tool count matches expected: ${EXPECTED_TOOL_COUNT}`);
            clearTimeout(timeoutHandle);
            rl.close();
            server.kill();
            process.exit(0);
          } else {
            console.error(`FAIL: Expected ${EXPECTED_TOOL_COUNT} tools but got ${toolCount}`);
            clearTimeout(timeoutHandle);
            rl.close();
            server.kill();
            process.exit(1);
          }
        }

        if (response.error) {
          console.error(`FAIL: Server returned error: ${response.error.message}`);
          clearTimeout(timeoutHandle);
          rl.close();
          server.kill();
          process.exit(1);
        }
      } catch (err) {
        console.error(`FAIL: Error parsing response: ${line}`);
        clearTimeout(timeoutHandle);
        rl.close();
        server.kill();
        process.exit(1);
      }
    });

    server.stderr.on("data", (data) => {
      console.error(`Server stderr: ${data}`);
    });

    server.on("error", (err) => {
      console.error(`FAIL: Failed to spawn server: ${err.message}`);
      clearTimeout(timeoutHandle);
      process.exit(1);
    });

    server.on("exit", (code) => {
      if (!timedOut && (!receivedInitializeResponse || !receivedToolsListResponse)) {
        console.error(`FAIL: Server exited with code ${code} before all expected responses`);
        clearTimeout(timeoutHandle);
        process.exit(1);
      }
    });

    // Send initialize request
    const initMsg = {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: {
          name: "smoke-test",
          version: "1.0.0",
        },
      },
    };
    server.stdin.write(JSON.stringify(initMsg) + "\n");
  });
}

smokeTest().catch((err) => {
  console.error(`FAIL: ${err.message}`);
  process.exit(1);
});
