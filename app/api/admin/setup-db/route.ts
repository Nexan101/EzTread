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
    await safeRun(sql, () => sql`ALTER TABLE verified_shops ENABLE ROW LEVEL SECURITY`);
    await safeRun(sql, () => sql`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies
          WHERE tablename = 'verified_shops' AND policyname = 'deny_anon_verified_shops'
        ) THEN
          CREATE POLICY "deny_anon_verified_shops" ON verified_shops FOR ALL TO anon USING (false);
        END IF;
      END $$
    `);
    await safeRun(sql, () => sql`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies
          WHERE tablename = 'verified_shops' AND policyname = 'deny_auth_verified_shops'
        ) THEN
          CREATE POLICY "deny_auth_verified_shops" ON verified_shops FOR ALL TO authenticated USING (false);
        END IF;
      END $$
    `);

    await safeRun(sql, () => sql`
      CREATE TABLE IF NOT EXISTS recommended_shops (
        place_id   TEXT PRIMARY KEY,
        shop_name  TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await safeRun(sql, () => sql`ALTER TABLE recommended_shops ENABLE ROW LEVEL SECURITY`);
    await safeRun(sql, () => sql`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies
          WHERE tablename = 'recommended_shops' AND policyname = 'deny_anon_recommended_shops'
        ) THEN
          CREATE POLICY "deny_anon_recommended_shops" ON recommended_shops FOR ALL TO anon USING (false);
        END IF;
      END $$
    `);
    await safeRun(sql, () => sql`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies
          WHERE tablename = 'recommended_shops' AND policyname = 'deny_auth_recommended_shops'
        ) THEN
          CREATE POLICY "deny_auth_recommended_shops" ON recommended_shops FOR ALL TO authenticated USING (false);
        END IF;
      END $$
    `);

    await safeRun(sql, () => sql`
      CREATE TABLE IF NOT EXISTS shop_labor_estimates (
        place_id     TEXT PRIMARY KEY,
        shop_name    TEXT NOT NULL,
        installation TEXT,
        alignment    TEXT,
        rotation     TEXT,
        balancing    TEXT,
        tpms         TEXT,
        patch        TEXT,
        updated_at   TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await safeRun(sql, () => sql`ALTER TABLE shop_labor_estimates ENABLE ROW LEVEL SECURITY`);
    await safeRun(sql, () => sql`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies
          WHERE tablename = 'shop_labor_estimates' AND policyname = 'deny_anon_shop_labor_estimates'
        ) THEN
          CREATE POLICY "deny_anon_shop_labor_estimates" ON shop_labor_estimates FOR ALL TO anon USING (false);
        END IF;
      END $$
    `);
    await safeRun(sql, () => sql`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies
          WHERE tablename = 'shop_labor_estimates' AND policyname = 'deny_auth_shop_labor_estimates'
        ) THEN
          CREATE POLICY "deny_auth_shop_labor_estimates" ON shop_labor_estimates FOR ALL TO authenticated USING (false);
        END IF;
      END $$
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

    // Add tpms / patch columns if they don't exist yet (added in a later deploy)
    await safeRun(sql, () => sql`
      DO $migration2$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'shop_labor_estimates'
            AND column_name = 'tpms'
        ) THEN
          ALTER TABLE shop_labor_estimates ADD COLUMN tpms TEXT;
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'shop_labor_estimates'
            AND column_name = 'patch'
        ) THEN
          ALTER TABLE shop_labor_estimates ADD COLUMN patch TEXT;
        END IF;
      END
      $migration2$
    `);

    await safeRun(sql, () => sql`
      CREATE TABLE IF NOT EXISTS shop_claims (
        id          BIGSERIAL PRIMARY KEY,
        shop_id     TEXT NOT NULL UNIQUE,
        shop_name   TEXT NOT NULL,
        owner_email TEXT NOT NULL,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await safeRun(sql, () => sql`ALTER TABLE shop_claims ENABLE ROW LEVEL SECURITY`);
    await safeRun(sql, () => sql`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies
          WHERE tablename = 'shop_claims' AND policyname = 'deny_anon_shop_claims'
        ) THEN
          CREATE POLICY "deny_anon_shop_claims" ON shop_claims FOR ALL TO anon USING (false);
        END IF;
      END $$
    `);
    await safeRun(sql, () => sql`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies
          WHERE tablename = 'shop_claims' AND policyname = 'deny_auth_shop_claims'
        ) THEN
          CREATE POLICY "deny_auth_shop_claims" ON shop_claims FOR ALL TO authenticated USING (false);
        END IF;
      END $$
    `);

    await safeRun(sql, () => sql`
      CREATE TABLE IF NOT EXISTS shop_analytics (
        id         BIGSERIAL PRIMARY KEY,
        place_id   TEXT NOT NULL,
        event_type TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await safeRun(sql, () => sql`
      CREATE INDEX IF NOT EXISTS idx_shop_analytics_lookup
        ON shop_analytics (place_id, event_type, created_at DESC)
    `);

    // ── Email logs ───────────────────────────────────────────────────────────
    await safeRun(sql, () => sql`
      CREATE TABLE IF NOT EXISTS email_logs (
        id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        email_type      VARCHAR(50) NOT NULL,
        recipient_email VARCHAR(255) NOT NULL,
        shop_id         UUID        REFERENCES shops(id) ON DELETE SET NULL,
        sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        success         BOOLEAN     NOT NULL DEFAULT false,
        error_message   TEXT,
        email_service   VARCHAR(20) DEFAULT 'resend',
        message_id      TEXT,
        metadata        JSONB
      )
    `);
    await safeRun(sql, () => sql`
      CREATE INDEX IF NOT EXISTS idx_email_logs_shop_id ON email_logs (shop_id)
    `);
    await safeRun(sql, () => sql`
      CREATE INDEX IF NOT EXISTS idx_email_logs_type ON email_logs (email_type)
    `);

    // ── Plan signups tracking ─────────────────────────────────────────────────
    await safeRun(sql, () => sql`
      CREATE TABLE IF NOT EXISTS plan_signups (
        id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        plan                TEXT        NOT NULL CHECK (plan IN ('basic', 'premium')),
        shop_id             UUID        REFERENCES shops(id) ON DELETE SET NULL,
        shop_name           TEXT,
        email               TEXT,
        phone               TEXT,
        city                TEXT,
        state               TEXT,
        stripe_session_id   TEXT,
        stripe_customer_id  TEXT,
        amount_cents        INTEGER,
        status              TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'canceled', 'failed')),
        created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await safeRun(sql, () => sql`
      CREATE INDEX IF NOT EXISTS idx_plan_signups_plan ON plan_signups (plan)
    `);
    await safeRun(sql, () => sql`
      CREATE INDEX IF NOT EXISTS idx_plan_signups_created_at ON plan_signups (created_at DESC)
    `);
    await safeRun(sql, () => sql`ALTER TABLE plan_signups ENABLE ROW LEVEL SECURITY`);
    await safeRun(sql, () => sql`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies
          WHERE tablename = 'plan_signups' AND policyname = 'deny_anon_plan_signups'
        ) THEN
          CREATE POLICY "deny_anon_plan_signups" ON plan_signups FOR ALL TO anon USING (false);
        END IF;
      END $$
    `);
    await safeRun(sql, () => sql`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies
          WHERE tablename = 'plan_signups' AND policyname = 'deny_auth_plan_signups'
        ) THEN
          CREATE POLICY "deny_auth_plan_signups" ON plan_signups FOR ALL TO authenticated USING (false);
        END IF;
      END $$
    `);

    // Tell PostgREST to reload its schema cache so new tables are visible immediately
    await safeRun(sql, () => sql`NOTIFY pgrst, 'reload schema'`);

    // ── New tables for shop self-signup ──────────────────────────────────────

    // Terms acceptance log
    await safeRun(sql, () => sql`
      CREATE TABLE IF NOT EXISTS shop_terms_acceptance (
        id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        shop_id          UUID        REFERENCES shops(id) ON DELETE CASCADE,
        terms_version    VARCHAR(20) NOT NULL DEFAULT 'v1.0',
        privacy_version  VARCHAR(20) NOT NULL DEFAULT 'v1.0',
        accepted_at      TIMESTAMPTZ DEFAULT NOW(),
        ip_address       TEXT,
        user_agent       TEXT,
        signup_data      JSONB
      )
    `);
    await safeRun(sql, () => sql`
      CREATE INDEX IF NOT EXISTS idx_terms_shop_id
        ON shop_terms_acceptance (shop_id)
    `);

    // Add soft-delete + status columns to shops if not present
    await safeRun(sql, () => sql`
      DO $migration_shops$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'shops' AND column_name = 'status'
        ) THEN
          ALTER TABLE shops ADD COLUMN status VARCHAR(20) DEFAULT 'active';
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'shops' AND column_name = 'deleted_at'
        ) THEN
          ALTER TABLE shops ADD COLUMN deleted_at TIMESTAMPTZ;
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'shops' AND column_name = 'deletion_reason'
        ) THEN
          ALTER TABLE shops ADD COLUMN deletion_reason TEXT;
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'shops' AND column_name = 'website'
        ) THEN
          ALTER TABLE shops ADD COLUMN website TEXT;
        END IF;
      END
      $migration_shops$
    `);
    await safeRun(sql, () => sql`
      CREATE INDEX IF NOT EXISTS idx_shops_status ON shops (status)
    `);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[setup-db]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  } finally {
    await sql.end();
  }
}
