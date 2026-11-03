// In-process job worker. Jobs live in SQLite, so a restart resumes them (expired leases are reclaimed).
import { runDiscovery } from "../designer/discover-job.ts";
import { runExtraction } from "../designer/extract.ts";
import type { Job, Store } from "../store/db.ts";

const handlers: Record<string, (store: Store, job: Job) => Promise<unknown>> = {
  extract: runExtraction,
  discover: (store, job) => runDiscovery(store, job),
};

export function startWorker(store: Store, opts: { pollMs?: number; handlers?: Partial<typeof handlers> } = {}) {
  const table = { ...handlers, ...opts.handlers };
  let stopped = false;
  let idle: Promise<void> = Promise.resolve();
  const loop = async () => {
    while (!stopped) {
      const job = store.claimJob();
      if (!job) {
        await new Promise((r) => setTimeout(r, opts.pollMs ?? 500));
        continue;
      }
      const handler = table[job.kind];
      try {
        if (!handler) throw new Error(`No handler for job kind "${job.kind}"`);
        const result = await handler(store, job);
        // A job cancelled while running keeps its cancelled status.
        if (store.job(job.id)?.status === "running") store.finishJob(job.id, { result });
      } catch (e) {
        store.finishJob(job.id, { error: (e as Error).message });
      }
    }
  };
  idle = loop();
  return {
    stop: async () => {
      stopped = true;
      await idle;
    },
  };
}
