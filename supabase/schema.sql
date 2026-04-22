-- TireHub Admin Schema
-- Run this in Supabase SQL Editor: Dashboard → SQL Editor → New Query

-- ─── Shops ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shops (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  address             TEXT,
  city                TEXT,
  state               CHAR(2),
  zip                 VARCHAR(10),
  phone               VARCHAR(20),
  email               VARCHAR(100),
  latitude            DECIMAL(10,8),
  longitude           DECIMAL(11,8),
  google_rating       DECIMAL(2,1),
  premium_tier        TEXT NOT NULL DEFAULT 'free' CHECK (premium_tier IN ('free','premium')),
  stripe_customer_id  TEXT,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Shop Services (pricing per tire) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shop_services (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id                     UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  mounting_balancing_per_tire DECIMAL(8,2) NOT NULL DEFAULT 0,
  valve_stems_per_tire        DECIMAL(8,2) NOT NULL DEFAULT 0,
  disposal_per_tire           DECIMAL(8,2) NOT NULL DEFAULT 0,
  tpms_per_tire               DECIMAL(8,2) NOT NULL DEFAULT 0,
  alignment_cost              DECIMAL(8,2),
  free_rotation               BOOLEAN NOT NULL DEFAULT false,
  road_hazard_per_tire        DECIMAL(8,2),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Shop Tire Ranges ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shop_tire_ranges (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id         UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  tier            TEXT NOT NULL CHECK (tier IN ('budget','mid-range','premium')),
  min_price       DECIMAL(8,2) NOT NULL,
  max_price       DECIMAL(8,2) NOT NULL,
  example_brands  TEXT,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Leads ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id          UUID REFERENCES shops(id),
  customer_name    TEXT,
  customer_email   TEXT,
  customer_phone   TEXT,
  tire_size        TEXT,
  quality_tier     TEXT,
  quantity         INTEGER NOT NULL DEFAULT 4,
  status           TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','converted','lost')),
  charged          BOOLEAN NOT NULL DEFAULT false,
  amount           DECIMAL(10,2),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_shops_zip               ON shops(zip);
CREATE INDEX IF NOT EXISTS idx_shops_city              ON shops(city);
CREATE INDEX IF NOT EXISTS idx_shop_services_shop_id   ON shop_services(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_tire_ranges_shop_id ON shop_tire_ranges(shop_id);
CREATE INDEX IF NOT EXISTS idx_leads_shop_id           ON leads(shop_id);

-- ─── Row Level Security ────────────────────────────────────────────────────────
-- All tables are admin-only; neither the anon nor authenticated role has access.
-- The service role (used by server-side code) bypasses RLS automatically.

ALTER TABLE shops             ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_services     ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_tire_ranges  ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads             ENABLE ROW LEVEL SECURITY;

-- Explicitly deny both anon and authenticated roles so Supabase's security
-- scanner does not flag sensitive columns (email, phone, stripe_customer_id,
-- customer_email, customer_phone, etc.) as publicly accessible.
-- Server-side code uses the service role key and is unaffected by these policies.
CREATE POLICY "deny_anon_shops"             ON shops            FOR ALL TO anon          USING (false);
CREATE POLICY "deny_anon_shop_services"     ON shop_services    FOR ALL TO anon          USING (false);
CREATE POLICY "deny_anon_shop_tire_ranges"  ON shop_tire_ranges FOR ALL TO anon          USING (false);
CREATE POLICY "deny_anon_leads"             ON leads            FOR ALL TO anon          USING (false);

CREATE POLICY "deny_auth_shops"             ON shops            FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth_shop_services"     ON shop_services    FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth_shop_tire_ranges"  ON shop_tire_ranges FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_auth_leads"             ON leads            FOR ALL TO authenticated USING (false);
