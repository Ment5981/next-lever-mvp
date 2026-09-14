import { sql } from "drizzle-orm";
import { getDatabase, persistenceStatus } from "@/lib/db/client";
import { ok } from "@/app/api/_lib/respond";

export const dynamic = "force-dynamic";

export async function GET() {
  const persistence = persistenceStatus();
  if (!persistence.configured) return ok({ status: "ok", persistence });
  try {
    await getDatabase()?.execute(sql`select 1`);
    return ok({ status: "ok", persistence });
  } catch {
    return ok({ status: "degraded", persistence, database: "unreachable" });
  }
}

