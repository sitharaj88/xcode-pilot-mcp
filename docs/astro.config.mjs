import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
  site: "https://sitharaj88.github.io",
  base: "/xcode-pilot-mcp",
  integrations: [
    starlight({
      title: "Xcode Pilot MCP",
      description:
        "67 tools for iOS/macOS development via the Model Context Protocol",
      logo: {
        src: "./src/assets/logo.svg",
        replacesTitle: false,
      },
      favicon: "/favicon.svg",
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/sitharaj88/xcode-pilot-mcp",
        },
        {
          icon: "external",
          label: "npm",
          href: "https://www.npmjs.com/package/xcode-pilot-mcp",
        },
      ],
      editLink: {
        baseUrl:
          "https://github.com/sitharaj88/xcode-pilot-mcp/edit/main/docs/",
      },
      customCss: ["./src/styles/custom.css"],
      head: [
        {
          tag: "meta",
          attrs: {
            name: "theme-color",
            content: "#007AFF",
          },
        },
      ],
      sidebar: [
        {
          label: "Getting Started",
          autogenerate: { directory: "getting-started" },
        },
        {
          label: "Tools",
          items: [
            { label: "Overview", slug: "tools/overview" },
            {
              label: "Build & Compile",
              autogenerate: { directory: "tools/build" },
            },
            {
              label: "Simulator",
              autogenerate: { directory: "tools/simulator" },
            },
            {
              label: "App Lifecycle",
              autogenerate: { directory: "tools/app" },
            },
            {
              label: "Debugging",
              autogenerate: { directory: "tools/debug" },
            },
            {
              label: "Environment",
              autogenerate: { directory: "tools/environment" },
            },
            {
              label: "Code Signing",
              autogenerate: { directory: "tools/signing" },
            },
            {
              label: "Packages",
              autogenerate: { directory: "tools/packages" },
            },
            {
              label: "Scaffolding",
              autogenerate: { directory: "tools/scaffold" },
            },
            {
              label: "Analysis",
              autogenerate: { directory: "tools/analyze" },
            },
            {
              label: "Code Quality",
              autogenerate: { directory: "tools/quality" },
            },
            {
              label: "Physical Device",
              autogenerate: { directory: "tools/device" },
            },
          ],
        },
        { label: "Guides", autogenerate: { directory: "guides" } },
        {
          label: "Prompt Cookbook",
          items: [
            {
              label: "Quick Reference",
              slug: "guides/prompts-quick-reference",
            },
            {
              label: "Build & Test",
              slug: "guides/prompts-build-and-test",
            },
            {
              label: "Device & Debug",
              slug: "guides/prompts-device-and-debug",
            },
            {
              label: "Scaffold & Deploy",
              slug: "guides/prompts-scaffold-and-deploy",
            },
          ],
        },
        { label: "Reference", autogenerate: { directory: "reference" } },
      ],
    }),
  ],
});
