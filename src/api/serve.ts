import { serve } from "@hono/node-server";
import { Store } from "../store/db.ts";
import { closeBrowser } from "../visual.ts";
import { createApp } from "./app.ts";
import { startWorker } from "./worker.ts";

try {
  process.loadEnvFile(".env");
} catch {}

const port = Number(process.env.PORT ?? 4141);
const store = new Store();
const app = createApp(store);
const worker = startWorker(store);
const server = serve({ fetch: app.fetch, port }, (info) => {
  console.log(`designbase API on http://localhost:${info.port}  (data: ${store.dir}, auth: ${process.env.DESIGNBASE_AUTH === "keys" ? "keys" : "local"})`);
});

for (const sig of ["SIGINT", "SIGTERM"] as const) {
  process.on(sig, async () => {
    server.close();
    await worker.stop();
    await closeBrowser();
    store.close();
    process.exit(0);
  });
}
