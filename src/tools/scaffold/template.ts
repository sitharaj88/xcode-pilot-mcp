import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function loadTemplate(templateName: string): string {
  const templatePath = join(__dirname, "..", "..", "templates", templateName);
  return readFileSync(templatePath, "utf-8");
}

export function renderTemplate(template: string, values: Array<[string, string]>): string {
  let result = template;
  for (const [key, value] of values) {
    result = result.split(`{{${key}}}`).join(value);
  }
  return result;
}
