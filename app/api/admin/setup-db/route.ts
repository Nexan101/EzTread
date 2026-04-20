import { NextResponse } from "next/server";
import postgres from "postgres";

// Run a single statement and swallow "already exists" / duplicate-type errors
// that Postgres can raise on concurrent or repeated CREATE TABLE calls.
async function safeRun(sql: ReturnType<typeof postgres>, stmt: () => Promise<unknown>) {
  try {
    await stmt();
  } catch (err: unknown) {
    const msg = String(err);
    // Ignore "already exists" and the concurrent-create duplicate-type race
    if (
      msg.includes("already exists") ||
      msg.includes("pg_type_typename_nsp_index") ||
      msg.includes("duplicate key value")
    ) {
      return;
    }
    throw err;
  }
}

export async function POST() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1, idle_timeout: 5 });
  try {
    await safeRun(sql, () => sql`
      CREATE TABLE IF NOT EXISTS verified_shops (
        place_id   TEXT PRIMARY KEY,
        shop_name  TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await safeRun(sql, () => sql`
      CREATE TABLE IF NOT EXISTS recommended_shops (
        place_id   TEXT PRIMARY KEY,
        shop_name  TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await safeRun(sql, () => sql`
      CREATE TABLE IF NOT EXISTS shop_labor_estimates (
        place_id     TEXT PRIMARY KEY,
        shop_name    TEXT NOT NULL,
        installation TEXT,
        alignment    TEXT,
        rotation     TEXT,
        balancing    TEXT,
        updated_at   TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Legacy installs used DECIMAL; convert to TEXT for freeform price labels
    await safeRun(sql, () => sql`
      DO $migration$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'shop_labor_estimates'
            AND column_name = 'installation' AND data_type = 'numeric'
        ) THEN
          ALTER TABLE shop_labor_estimates
            ALTER COLUMN installation TYPE TEXT USING installation::text,
            ALTER COLUMN alignment TYPE TEXT USING alignment::text,
            ALTER COLUMN rotation TYPE TEXT USING rotation::text,
            ALTER COLUMN balancing TYPE TEXT USING balancing::text;
        END IF;
      END
      $migration$
    `);

    // Tell PostgREST to reload its schema cache so new tables are visible immediately
    await safeRun(sql, () => sql`NOTIFY pgrst, 'reload schema'`);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[setup-db]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  } finally {
    await sql.end();
  }
}
