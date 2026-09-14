import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/lib/db/schema";

type Database = ReturnType<typeof drizzle>;
type DbGlobal = typeof globalThis & { __next_lever_db__?: Database; __next_lever_pool__?: Pool };

/**
 * 可选数据库连接。未配置 DATABASE_URL 时保留 Demo 内存模式，
 * 但所有正式环境都应启用 PostgreSQL，避免多用户共享进程状态。
 */
export function getDatabase(): Database | null {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return null;
  const globalDb = globalThis as DbGlobal;
  if (globalDb.__next_lever_db__) return globalDb.__next_lever_db__;
  const pool = new Pool({
    connectionString: url,
    max: Number.parseInt(process.env.DATABASE_POOL_MAX ?? "10", 10),
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  });
  globalDb.__next_lever_pool__ = pool;
  globalDb.__next_lever_db__ = drizzle({ client: pool, schema });
  return globalDb.__next_lever_db__;
}

export function persistenceStatus() {
  return {
    mode: process.env.DATABASE_URL?.trim() ? "postgres" as const : "memory-demo" as const,
    configured: Boolean(process.env.DATABASE_URL?.trim()),
  };
}

