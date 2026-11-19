#!/usr/bin/env node
// Design-system MCP server. Run: npm run mcp  (stdio transport)
// Add to an MCP client, e.g. Claude Code:  claude mcp add design-system -- node mcp-server/index.mjs
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { check_contrast, get_tokens, get_usage_rules, search_components } from "../lib/mcp-tools.mjs";

const server = new McpServer({ name: "developed-by-me-design-system", version: "0.1.0" });
const json = (data) => ({ content: [{ type: "text", text: JSON.stringify(data, null, 2) }] });

server.registerTool(
  "search_components",
  { description: "Find registered design-system components that match a need. Returns [] when nothing fits: do not invent components.", inputSchema: { query: z.string().max(200) } },
  async (args) => json(search_components(args)),
);
server.registerTool(
  "get_tokens",
  { description: "List the design tokens a component uses.", inputSchema: { component: z.string().max(40) } },
  async (args) => json(get_tokens(args)),
);
server.registerTool("get_usage_rules", { description: "Machine-readable usage rules for composing screens." }, async () => json(get_usage_rules()));
server.registerTool(
  "check_contrast",
  { description: "WCAG contrast ratio between two hex colours.", inputSchema: { fg: z.string().regex(/^#[0-9a-f]{6}$/i), bg: z.string().regex(/^#[0-9a-f]{6}$/i) } },
  async (args) => json(check_contrast(args)),
);

await server.connect(new StdioServerTransport());
