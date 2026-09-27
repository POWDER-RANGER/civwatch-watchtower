import pg from "pg";
import { env } from "@civwatch/config";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
});

pool.on("error", (err) => {
  console.error("[db] unexpected pool error", err);
});

export async function checkDb(): Promise<boolean> {
  try {
    await pool.query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}
