-- Investor Kits — shareable data rooms with access codes
CREATE TABLE IF NOT EXISTS investor_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  access_code TEXT NOT NULL,
  kit_data JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for public access by code
CREATE UNIQUE INDEX IF NOT EXISTS idx_investor_kits_access_code ON investor_kits(access_code) WHERE is_active = true;

-- Index for venture lookup
CREATE INDEX IF NOT EXISTS idx_investor_kits_venture ON investor_kits(venture_id);

-- RLS policies
ALTER TABLE investor_kits ENABLE ROW LEVEL SECURITY;

-- Owners can manage their kits
CREATE POLICY "Users can manage own investor kits" ON investor_kits
  FOR ALL USING (auth.uid() = user_id);

-- Public read access via access_code (for shareable links)
CREATE POLICY "Public can read active kits by code" ON investor_kits
  FOR SELECT USING (is_active = true);
