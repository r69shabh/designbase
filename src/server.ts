#!/usr/bin/env -S npx tsx
// MCP entry point (stdio). Serves the playbook folder in DESIGNBASE_PLAYBOOK (default: the sample),
// or, with DESIGNBASE_PLAYBOOK_ID, the head version of a stored playbook (id, slug or name) from the
// local store in DESIGNBASE_DATA, story images included.
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { join } from "node:path";
import { materialize } from "./core/materialize.ts";
import { createMcpServer } from "./mcp.ts";
import { loadPlaybook, type Playbook } from "./playbook.ts";
import { Store } from "./store/db.ts";
import { closeBrowser } from "./visual.ts";

function fromStore(ref: string): Playbook {
  const store = new Store();
  const row = store.db.prepare("SELECT id FROM playbooks WHERE id = ? OR slug = ? OR name = ? ORDER BY created_at DESC LIMIT 1").get(ref, ref, ref);
  if (!row) throw new Error(`No stored playbook "${ref}" in ${store.dir}`);
  const v = store.version(String(row.id));
  if (!v) throw new Error(`Playbook "${ref}" has no applied version yet`);
  return materialize(v.content, join(store.dir, "materialized", String(row.id), v.id), { asset: (h) => store.asset(h)?.read() });
}

const pb = process.env.DESIGNBASE_PLAYBOOK_ID ? fromStore(process.env.DESIGNBASE_PLAYBOOK_ID) : loadPlaybook();
const server = createMcpServer(pb);

for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => closeBrowser().finally(() => process.exit(0)));
await server.connect(new StdioServerTransport());
