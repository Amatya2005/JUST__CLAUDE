-- JustInfluence database schema
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Agencies (brands/marketing teams)
CREATE TABLE IF NOT EXISTS agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Influencers (invited by agencies, connect Instagram via Phyllo)
CREATE TABLE IF NOT EXISTS influencers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  password_hash VARCHAR(255),
  phyllo_user_id VARCHAR(255) UNIQUE,
  phyllo_account_id VARCHAR(255),
  instagram_handle VARCHAR(255),
  platform_connected BOOLEAN DEFAULT FALSE,
  invite_token VARCHAR(255) UNIQUE,
  invited_by_agency_id UUID REFERENCES agencies(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Many-to-many: campaigns <-> influencers
CREATE TABLE IF NOT EXISTS campaign_influencers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  influencer_id UUID REFERENCES influencers(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, influencer_id)
);

-- Stored analytics (fetched from Phyllo, cached in our DB)
CREATE TABLE IF NOT EXISTS influencer_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id UUID REFERENCES influencers(id) ON DELETE CASCADE,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),

  follower_count INTEGER,
  following_count INTEGER,
  post_count INTEGER,
  profile_url TEXT,
  bio TEXT,
  is_verified BOOLEAN,

  avg_likes NUMERIC(10,2),
  avg_comments NUMERIC(10,2),
  avg_views NUMERIC(10,2),
  engagement_rate NUMERIC(6,4),

  audience_quality_score NUMERIC(5,2),
  fake_follower_pct NUMERIC(5,2),
  top_country VARCHAR(100),
  gender_female_pct NUMERIC(5,2),
  gender_male_pct NUMERIC(5,2),
  age_13_17_pct NUMERIC(5,2),
  age_18_24_pct NUMERIC(5,2),
  age_25_34_pct NUMERIC(5,2),
  age_35_44_pct NUMERIC(5,2),
  age_45_plus_pct NUMERIC(5,2),

  raw_profile JSONB,
  raw_audience JSONB,
  raw_content JSONB
);

-- Webhook event log (for debugging and idempotency)
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phyllo_event_id VARCHAR(255) UNIQUE,
  event_type VARCHAR(100),
  payload JSONB,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_influencer ON influencer_analytics(influencer_id);
CREATE INDEX IF NOT EXISTS idx_campaign_influencers_campaign ON campaign_influencers(campaign_id);
CREATE INDEX IF NOT EXISTS idx_influencers_invite_token ON influencers(invite_token);
