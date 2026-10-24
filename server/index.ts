import { createServer } from "http";
import { env } from "@civwatch/config";
import { createApp } from "./app.js";
import { checkDb, pool } from "./db/pool.js";
import { createPgStore } from "./store.js";

async function startServer() {
  const app = createApp({ store: createPgStore(pool), checkDb });
  const server = createServer(app);
  server.listen(env.PORT, () => {
    console.log(`WATCHTOWER listening on http://localhost:${env.PORT}/`);
  });
}

startServer().catch(console.error);
