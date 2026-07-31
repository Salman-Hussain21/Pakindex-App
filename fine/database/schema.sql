-- =============================================================================
-- PakIndex – Pakistan's HORECA Intelligence & Sales Platform
-- PostgreSQL Database Schema (with PostGIS)
-- =============================================================================
-- Extensions
-- =============================================================================
-- CREATE EXTENSION IF NOT EXISTS postgis; -- (Commented out: PostGIS not available locally)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;   -- fuzzy text search / duplicate detection
CREATE EXTENSION IF NOT EXISTS unaccent;  -- accent-insensitive search

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE user_role       AS ENUM ('super_admin', 'company_admin', 'employee');
CREATE TYPE user_status     AS ENUM ('active', 'inactive', 'suspended');

CREATE TYPE company_status  AS ENUM ('active', 'suspended', 'cancelled');
CREATE TYPE plan_type       AS ENUM ('trial', 'basic', 'pro', 'enterprise', 'free', 'premium', 'ultra_premium');

CREATE TYPE business_status AS ENUM ('pending', 'approved', 'rejected', 'duplicate', 'merged', 'trashed');
CREATE TYPE business_tier   AS ENUM ('tier_1', 'tier_2', 'tier_3');   -- high / mid / low volume

CREATE TYPE scrape_status   AS ENUM ('running', 'completed', 'failed', 'partial');
CREATE TYPE scrape_source   AS ENUM ('google_maps', 'osm', 'food_delivery', 'manual', 'field_agent', 'user_submitted');

CREATE TYPE lead_stage      AS ENUM ('new', 'contacted', 'interested', 'meeting', 'proposal', 'won', 'lost');
CREATE TYPE activity_type   AS ENUM ('visit', 'call', 'email', 'whatsapp', 'note', 'status_change', 'follow_up');

CREATE TYPE notification_type AS ENUM (
  'new_scrape', 'new_approval', 'new_crm', 'company_activity',
  'system_alert', 'lead_assigned', 'follow_up_reminder',
  'new_restaurant', 'employee_update', 'lead_update'
);

CREATE TYPE audit_entity    AS ENUM ('user', 'company', 'business', 'crm_lead', 'employee', 'scrape_job', 'territory');
CREATE TYPE audit_action    AS ENUM ('create', 'update', 'delete', 'login', 'logout', 'export', 'import', 'approve', 'reject', 'restore', 'merge', 'assign');


-- =============================================================================
-- 1. GEOGRAPHY – Areas & Territories
-- =============================================================================

CREATE TABLE provinces (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  code        VARCHAR(10)  NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE cities (
  id          SERIAL PRIMARY KEY,
  province_id INTEGER      NOT NULL REFERENCES provinces(id) ON DELETE RESTRICT,
  name        VARCHAR(100) NOT NULL,
  code        VARCHAR(20),
  -- boundary    GEOMETRY(MULTIPOLYGON, 4326), -- (Commented out: PostGIS not available locally)
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  UNIQUE (province_id, name)
);

CREATE TABLE areas (
  id          SERIAL PRIMARY KEY,
  city_id     INTEGER      NOT NULL REFERENCES cities(id) ON DELETE RESTRICT,
  name        VARCHAR(150) NOT NULL,
  slug        VARCHAR(170) NOT NULL UNIQUE,
  -- boundary    GEOMETRY(MULTIPOLYGON, 4326), -- (Commented out: PostGIS not available locally)
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Territories are named groupings of areas assigned to a company
CREATE TABLE territories (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(150) NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE territory_areas (
  territory_id UUID    NOT NULL REFERENCES territories(id) ON DELETE CASCADE,
  area_id      INTEGER NOT NULL REFERENCES areas(id)       ON DELETE CASCADE,
  PRIMARY KEY (territory_id, area_id)
);


-- =============================================================================
-- 2. CATEGORIES & BUSINESS TYPES
-- =============================================================================

CREATE TABLE categories (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,  -- Restaurant, Café, Bakery, Dhaba, Hotel, Cloud Kitchen …
  slug        VARCHAR(120) NOT NULL UNIQUE,
  icon        VARCHAR(255),
  is_active   BOOLEAN      NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE cuisine_types (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,  -- Pakistani, Chinese, Fast Food, Seafood …
  slug        VARCHAR(120) NOT NULL UNIQUE,
  is_active   BOOLEAN      NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);


-- =============================================================================
-- 3. HORECA BUSINESSES (Core Intelligence Table)
-- =============================================================================

CREATE TABLE businesses (
  id                  UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Identity
  name                VARCHAR(255) NOT NULL,
  slug                VARCHAR(280),
  place_id            VARCHAR(100) UNIQUE,          -- Google Maps placeId
  osm_id              VARCHAR(100),                 -- OpenStreetMap ID

  -- Classification
  category_id         INTEGER      REFERENCES categories(id)    ON DELETE SET NULL,
  cuisine_type_id     INTEGER      REFERENCES cuisine_types(id) ON DELETE SET NULL,
  business_type       VARCHAR(100),                 -- raw string from scrape ("Seafood restaurant")
  tier                business_tier,

  -- Location
  address             TEXT,
  area_id             INTEGER      REFERENCES areas(id) ON DELETE SET NULL,
  city_id             INTEGER      REFERENCES cities(id),
  province_id         INTEGER      REFERENCES provinces(id),
  postal_code         VARCHAR(20),
  -- location            GEOMETRY(POINT, 4326),        -- PostGIS point (lng, lat)
  latitude            NUMERIC(11, 8),
  longitude           NUMERIC(11, 8),

  -- Contact
  phone               VARCHAR(30),
  phone_secondary     VARCHAR(30),
  website             VARCHAR(500),
  email               VARCHAR(255),

  -- Operational
  rating              NUMERIC(2, 1) CHECK (rating BETWEEN 0 AND 5),
  review_count        INTEGER       DEFAULT 0,
  price_range         VARCHAR(100),                 -- "Rs 1,000 to Rs 2,000"
  price_min           NUMERIC(10, 2),
  price_max           NUMERIC(10, 2),
  open_state          VARCHAR(100),                 -- "Open · Closes 3 AM"
  seating_capacity    INTEGER,
  established_year    SMALLINT,

  -- Online Presence
  google_maps_url     VARCHAR(500),
  facebook_url        VARCHAR(500),
  instagram_url       VARCHAR(500),
  foodpanda_url       VARCHAR(500),
  cheetay_url         VARCHAR(500),
  careem_food_url     VARCHAR(500),

  -- Thumbnail / Images (array of URLs stored as JSONB)
  thumbnail           VARCHAR(500),
  images              JSONB         DEFAULT '[]',
  extensions          JSONB         DEFAULT '{}',  -- raw "Popular For" / "Offerings" / "Highlights" style metadata

  -- Service Options  (stored as string array)
  service_options     TEXT[]        DEFAULT '{}',

  -- Status & Workflow
  status              business_status NOT NULL DEFAULT 'pending',
  rejection_reason    TEXT,
  is_active           BOOLEAN       NOT NULL DEFAULT true,
  is_chain            BOOLEAN       NOT NULL DEFAULT false,
  parent_id           UUID          REFERENCES businesses(id) ON DELETE SET NULL,  -- for chain branches
  merged_into_id      UUID          REFERENCES businesses(id) ON DELETE SET NULL,

  -- Data Quality
  data_completeness   SMALLINT      DEFAULT 0 CHECK (data_completeness BETWEEN 0 AND 100),
  ai_potential_score  INTEGER       DEFAULT 0,  -- 0-100 heuristic B2B potential score
  last_verified_at    TIMESTAMPTZ,
  verified_by         UUID,         -- FK to users added after users table

  -- Source Tracking
  source              scrape_source NOT NULL DEFAULT 'google_maps',
  scrape_job_id       UUID,         -- FK added after scrape_jobs table

  -- Timestamps
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
  deleted_at          TIMESTAMPTZ              -- soft delete / trash
);

-- Spatial index (critical for map queries)
-- CREATE INDEX idx_businesses_location   ON businesses USING GIST(location); -- (Commented out: PostGIS not available locally)
CREATE INDEX idx_businesses_status     ON businesses(status);
CREATE INDEX idx_businesses_city       ON businesses(city_id);
CREATE INDEX idx_businesses_area       ON businesses(area_id);
CREATE INDEX idx_businesses_category   ON businesses(category_id);
CREATE INDEX idx_businesses_name_trgm  ON businesses USING GIN(name gin_trgm_ops);
CREATE INDEX idx_businesses_place_id   ON businesses(place_id);
CREATE INDEX idx_businesses_active     ON businesses(is_active) WHERE is_active = true;

-- Working hours (one row per day per business)
CREATE TABLE business_hours (
  id           SERIAL      PRIMARY KEY,
  business_id  UUID        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  day_of_week  SMALLINT    NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun
  open_time    TIME,
  close_time   TIME,
  is_closed    BOOLEAN     NOT NULL DEFAULT false,
  timezone     VARCHAR(50) NOT NULL DEFAULT 'Asia/Karachi',
  UNIQUE (business_id, day_of_week)
);

-- Tags / labels (flexible)
CREATE TABLE business_tags (
  id           SERIAL      PRIMARY KEY,
  business_id  UUID        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  tag          VARCHAR(80) NOT NULL,
  UNIQUE (business_id, tag)
);


-- =============================================================================
-- 4. USERS (super_admin, company_admin, employee)
-- =============================================================================

CREATE TABLE users (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_code     VARCHAR(30) UNIQUE,      -- auto-generated employee ID
  full_name         VARCHAR(150) NOT NULL,
  email             VARCHAR(255) NOT NULL UNIQUE,
  phone             VARCHAR(30),
  username          VARCHAR(80)  UNIQUE,
  password_hash     TEXT         NOT NULL,
  role              user_role    NOT NULL DEFAULT 'employee',
  status            user_status  NOT NULL DEFAULT 'active',
  designation       VARCHAR(100),
  department        VARCHAR(100),
  avatar_url        VARCHAR(500),

  -- Company link (null for super_admin)
  company_id        UUID,        -- FK added after companies table

  -- Area assignment (for employees)
  assigned_area_id  INTEGER      REFERENCES areas(id) ON DELETE SET NULL,

  -- Auth
  email_verified_at TIMESTAMPTZ,
  last_login_at     TIMESTAMPTZ,
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMPTZ,
  refresh_token_hash TEXT,

  -- Preferences
  dark_mode         BOOLEAN      NOT NULL DEFAULT false,

  created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ
);

-- Back-fill FK on businesses
ALTER TABLE businesses ADD CONSTRAINT fk_businesses_verified_by
  FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX idx_users_company   ON users(company_id);
CREATE INDEX idx_users_role      ON users(role);
CREATE INDEX idx_users_status    ON users(status);


-- =============================================================================
-- 5. COMPANIES
-- =============================================================================

CREATE TABLE companies (
  id               UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             VARCHAR(200) NOT NULL,
  legal_name       VARCHAR(255),                  -- registered/legal entity name, may differ from trading name
  slug             VARCHAR(220) NOT NULL UNIQUE,
  industry         VARCHAR(100),                  -- Food wholesale, FMCG, Beverage …
  logo_url         VARCHAR(500),
  website          VARCHAR(500),
  email            VARCHAR(255),
  phone            VARCHAR(30),
  address          TEXT,
  city_id          INTEGER      REFERENCES cities(id) ON DELETE SET NULL,
  status           company_status NOT NULL DEFAULT 'active',

  -- Subscription
  plan             plan_type    NOT NULL DEFAULT 'trial',
  plan_started_at  TIMESTAMPTZ,
  plan_expires_at  TIMESTAMPTZ,
  max_employees    INTEGER      NOT NULL DEFAULT 5,
  max_territories  INTEGER      NOT NULL DEFAULT 1,

  -- Admin user
  admin_user_id    UUID         REFERENCES users(id) ON DELETE SET NULL,

  created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  deleted_at       TIMESTAMPTZ
);

-- Back-fill FK on users
ALTER TABLE users ADD CONSTRAINT fk_users_company
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;

-- Companies get access to specific territories
CREATE TABLE company_territories (
  company_id   UUID    NOT NULL REFERENCES companies(id)   ON DELETE CASCADE,
  territory_id UUID    NOT NULL REFERENCES territories(id) ON DELETE CASCADE,
  assigned_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (company_id, territory_id)
);

-- Subscription history
CREATE TABLE subscription_logs (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id   UUID        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  plan_from    plan_type,
  plan_to      plan_type   NOT NULL,
  changed_by   UUID        REFERENCES users(id) ON DELETE SET NULL,
  reason       TEXT,
  changed_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- =============================================================================
-- 6. SCRAPING SYSTEM
-- =============================================================================

CREATE TABLE scrape_jobs (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  initiated_by    UUID          REFERENCES users(id) ON DELETE SET NULL,

  -- What was scraped
  source          scrape_source NOT NULL,
  query           VARCHAR(500),                  -- search keyword / URL
  area_id         INTEGER       REFERENCES areas(id) ON DELETE SET NULL,
  city_id         INTEGER       REFERENCES cities(id),
  category_id     INTEGER       REFERENCES categories(id) ON DELETE SET NULL,

  -- Results
  status          scrape_status NOT NULL DEFAULT 'running',
  total_found     INTEGER       DEFAULT 0,
  new_records     INTEGER       DEFAULT 0,
  duplicates      INTEGER       DEFAULT 0,
  failed_records  INTEGER       DEFAULT 0,

  -- Timing
  started_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ,
  error_message   TEXT,

  raw_payload     JSONB         DEFAULT '{}',   -- full raw response stored for re-processing
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Back-fill FK on businesses
ALTER TABLE businesses ADD CONSTRAINT fk_businesses_scrape_job
  FOREIGN KEY (scrape_job_id) REFERENCES scrape_jobs(id) ON DELETE SET NULL;

CREATE INDEX idx_scrape_jobs_status     ON scrape_jobs(status);
CREATE INDEX idx_scrape_jobs_source     ON scrape_jobs(source);
CREATE INDEX idx_scrape_jobs_initiated  ON scrape_jobs(initiated_by);

-- Duplicate detection pairs
CREATE TABLE duplicate_pairs (
  id             UUID  PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_a_id  UUID  NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  business_b_id  UUID  NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  similarity     NUMERIC(5,4),       -- 0.0000 – 1.0000
  detection_method VARCHAR(50),      -- 'name_geo', 'place_id', 'phone', 'manual'
  resolved       BOOLEAN NOT NULL DEFAULT false,
  resolution     VARCHAR(20),        -- 'merged', 'kept_both', 'rejected'
  resolved_by    UUID    REFERENCES users(id) ON DELETE SET NULL,
  resolved_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_a_id, business_b_id)
);

-- Per-record scrape log
CREATE TABLE scrape_logs (
  id             BIGSERIAL    PRIMARY KEY,
  scrape_job_id  UUID         NOT NULL REFERENCES scrape_jobs(id) ON DELETE CASCADE,
  business_id    UUID         REFERENCES businesses(id) ON DELETE SET NULL,
  place_id       VARCHAR(100),
  log_level      VARCHAR(10)  NOT NULL DEFAULT 'info',  -- info, warn, error
  message        TEXT,
  raw_data       JSONB,
  logged_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_scrape_logs_job ON scrape_logs(scrape_job_id);


-- =============================================================================
-- 7. CRM – LEADS & PIPELINE
-- =============================================================================

-- Each company has a CRM; leads link a company to a business
CREATE TABLE crm_leads (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  business_id     UUID        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  assigned_to     UUID        REFERENCES users(id) ON DELETE SET NULL,
  assigned_by     UUID        REFERENCES users(id) ON DELETE SET NULL,

  stage           lead_stage  NOT NULL DEFAULT 'new',
  priority        SMALLINT    NOT NULL DEFAULT 2 CHECK (priority BETWEEN 1 AND 5), -- 1=low 5=critical
  expected_value  NUMERIC(12,2),
  actual_value    NUMERIC(12,2),

  -- Follow-up
  next_follow_up  TIMESTAMPTZ,
  last_contact_at TIMESTAMPTZ,

  -- Notes
  notes           TEXT,

  won_at          TIMESTAMPTZ,
  lost_at         TIMESTAMPTZ,
  lost_reason     TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, business_id)  -- one lead per business per company
);

CREATE INDEX idx_crm_leads_company    ON crm_leads(company_id);
CREATE INDEX idx_crm_leads_assigned   ON crm_leads(assigned_to);
CREATE INDEX idx_crm_leads_stage      ON crm_leads(stage);
CREATE INDEX idx_crm_leads_followup   ON crm_leads(next_follow_up);

-- Activity / interaction log on a lead
CREATE TABLE crm_activities (
  id            UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id       UUID          NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
  performed_by  UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type activity_type NOT NULL,
  title         VARCHAR(255),
  body          TEXT,

  -- For visits
  -- visit_location GEOMETRY(POINT, 4326), -- (Commented out: PostGIS not available locally)
  visit_completed BOOLEAN     DEFAULT false,

  -- Stage transition
  stage_from    lead_stage,
  stage_to      lead_stage,

  scheduled_at  TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_activities_lead     ON crm_activities(lead_id);
CREATE INDEX idx_crm_activities_user     ON crm_activities(performed_by);
CREATE INDEX idx_crm_activities_type     ON crm_activities(activity_type);
CREATE INDEX idx_crm_activities_date     ON crm_activities(created_at);

-- Follow-up reminders
CREATE TABLE follow_ups (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id       UUID        NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
  assigned_to   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  due_at        TIMESTAMPTZ NOT NULL,
  note          TEXT,
  is_completed  BOOLEAN     NOT NULL DEFAULT false,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_follow_ups_lead   ON follow_ups(lead_id);
CREATE INDEX idx_follow_ups_user   ON follow_ups(assigned_to);
CREATE INDEX idx_follow_ups_due    ON follow_ups(due_at) WHERE is_completed = false;


-- =============================================================================
-- 8. COMPANY ↔ BUSINESS ACCESS (which businesses a company can see)
-- =============================================================================
-- Companies see all businesses within their assigned territories automatically
-- via a view, but we also allow explicit pinning:
CREATE TABLE company_pinned_businesses (
  company_id   UUID NOT NULL REFERENCES companies(id)   ON DELETE CASCADE,
  business_id  UUID NOT NULL REFERENCES businesses(id)  ON DELETE CASCADE,
  pinned_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  pinned_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (company_id, business_id)
);

-- Which areas a company is allowed to see. A direct company<->area
-- junction — simpler and less error-prone than routing through territories.
CREATE TABLE company_areas (
  company_id  UUID    NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  area_id     INTEGER NOT NULL REFERENCES areas(id)     ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (company_id, area_id)
);
CREATE INDEX idx_company_areas_company ON company_areas(company_id);

-- Which business categories a company is allowed to see (e.g. a beverages
-- distributor only needs cafes/restaurants). No rows = no restriction.
CREATE TABLE company_categories (
  company_id  UUID    NOT NULL REFERENCES companies(id)  ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (company_id, category_id)
);
CREATE INDEX idx_company_categories_company ON company_categories(company_id);


-- =============================================================================
-- 9. EMPLOYEE ↔ TERRITORY ASSIGNMENTS
-- =============================================================================
CREATE TABLE employee_territory_assignments (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID        NOT NULL REFERENCES users(id)        ON DELETE CASCADE,
  territory_id  UUID        NOT NULL REFERENCES territories(id)  ON DELETE CASCADE,
  assigned_by   UUID        REFERENCES users(id) ON DELETE SET NULL,
  assigned_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at    TIMESTAMPTZ,
  is_active     BOOLEAN     NOT NULL DEFAULT true
);
CREATE INDEX idx_emp_territory_user ON employee_territory_assignments(user_id);


-- =============================================================================
-- 10. NOTIFICATIONS
-- =============================================================================
CREATE TABLE notifications (
  id              UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id    UUID              NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id      UUID              REFERENCES companies(id) ON DELETE CASCADE,  -- null = global/admin
  type            notification_type NOT NULL,
  title           VARCHAR(255)      NOT NULL,
  body            TEXT,
  link            VARCHAR(500),     -- deep-link inside the app

  -- Polymorphic reference
  entity_type     audit_entity,
  entity_id       UUID,

  is_read         BOOLEAN           NOT NULL DEFAULT false,
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ       NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, is_read);
CREATE INDEX idx_notifications_company   ON notifications(company_id);
CREATE INDEX idx_notifications_created   ON notifications(created_at DESC);


-- =============================================================================
-- 11. AUDIT LOGS
-- =============================================================================
CREATE TABLE audit_logs (
  id           BIGSERIAL    PRIMARY KEY,
  performed_by UUID         REFERENCES users(id) ON DELETE SET NULL,
  company_id   UUID         REFERENCES companies(id) ON DELETE SET NULL,
  entity_type  audit_entity NOT NULL,
  entity_id    UUID,
  action       audit_action NOT NULL,
  old_values   JSONB,        -- snapshot before change
  new_values   JSONB,        -- snapshot after change
  ip_address   INET,
  user_agent   TEXT,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_entity   ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_user     ON audit_logs(performed_by);
CREATE INDEX idx_audit_company  ON audit_logs(company_id);
CREATE INDEX idx_audit_date     ON audit_logs(created_at DESC);


-- =============================================================================
-- 12. DATA EXPORT JOBS
-- =============================================================================
CREATE TYPE export_status AS ENUM ('queued', 'processing', 'ready', 'failed', 'expired');
CREATE TYPE export_type   AS ENUM ('businesses', 'crm_leads', 'employees', 'activities');

CREATE TABLE export_jobs (
  id            UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  requested_by  UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id    UUID          REFERENCES companies(id) ON DELETE CASCADE,
  export_type   export_type   NOT NULL,
  filters       JSONB         DEFAULT '{}',
  status        export_status NOT NULL DEFAULT 'queued',
  file_url      VARCHAR(500),
  row_count     INTEGER,
  error_message TEXT,
  expires_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
  completed_at  TIMESTAMPTZ
);
CREATE INDEX idx_export_jobs_user ON export_jobs(requested_by);


-- =============================================================================
-- 13. SYSTEM SETTINGS
-- =============================================================================
CREATE TABLE system_settings (
  key         VARCHAR(100) PRIMARY KEY,
  value       JSONB        NOT NULL,
  description TEXT,
  updated_by  UUID         REFERENCES users(id) ON DELETE SET NULL,
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Per-company settings
CREATE TABLE company_settings (
  company_id  UUID         PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
  settings    JSONB        NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Per-user preferences
CREATE TABLE user_preferences (
  user_id     UUID         PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  dark_mode   BOOLEAN      NOT NULL DEFAULT false,
  language    VARCHAR(10)  NOT NULL DEFAULT 'en',
  preferences JSONB        NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);


-- =============================================================================
-- 14. HELPFUL VIEWS
-- =============================================================================

-- Admin dashboard counters
CREATE OR REPLACE VIEW vw_admin_dashboard AS
SELECT
  (SELECT COUNT(*) FROM businesses)                                                      AS total_businesses,
  (SELECT COUNT(*) FROM businesses WHERE status = 'pending')                             AS pending_approvals,
  (SELECT COUNT(*) FROM businesses WHERE status = 'approved')                            AS approved_records,
  (SELECT COUNT(*) FROM businesses WHERE status = 'rejected')                            AS rejected_records,
  (SELECT COUNT(*) FROM companies WHERE deleted_at IS NULL)                              AS total_companies,
  (SELECT COUNT(*) FROM users WHERE role = 'employee' AND deleted_at IS NULL)            AS total_employees,
  (SELECT COUNT(*) FROM scrape_jobs WHERE started_at > now() - INTERVAL '24 hours')     AS scrapes_last_24h,
  (SELECT COUNT(*) FROM crm_activities WHERE created_at > now() - INTERVAL '24 hours')  AS crm_activities_last_24h;

-- Company dashboard counters (parameterized by company_id at query time)
CREATE OR REPLACE VIEW vw_company_lead_stats AS
SELECT
  cl.company_id,
  COUNT(*)                                            AS total_leads,
  COUNT(*) FILTER (WHERE cl.stage = 'won')           AS won_leads,
  COUNT(*) FILTER (WHERE cl.stage = 'lost')          AS lost_leads,
  COUNT(*) FILTER (WHERE cl.stage = 'new')           AS new_leads,
  COUNT(DISTINCT cl.assigned_to)                     AS active_employees
FROM crm_leads cl
GROUP BY cl.company_id;

-- Employee performance summary
CREATE OR REPLACE VIEW vw_employee_performance AS
SELECT
  u.id           AS employee_id,
  u.full_name,
  u.company_id,
  COUNT(DISTINCT cl.id)                                              AS leads_assigned,
  COUNT(DISTINCT ca.id) FILTER (WHERE ca.activity_type = 'visit')   AS visits_completed,
  COUNT(DISTINCT cl.id) FILTER (WHERE cl.stage = 'won')             AS leads_won,
  COUNT(DISTINCT cl.id) FILTER (WHERE cl.stage = 'contacted'
    OR cl.stage = 'interested' OR cl.stage = 'meeting'
    OR cl.stage = 'proposal')                                        AS leads_in_progress,
  ROUND(
    COUNT(DISTINCT cl.id) FILTER (WHERE cl.stage = 'won')::NUMERIC /
    NULLIF(COUNT(DISTINCT cl.id), 0) * 100, 2
  )                                                                  AS conversion_rate_pct
FROM users u
LEFT JOIN crm_leads   cl ON cl.assigned_to = u.id
LEFT JOIN crm_activities ca ON ca.performed_by = u.id
WHERE u.role = 'employee' AND u.deleted_at IS NULL
GROUP BY u.id, u.full_name, u.company_id;


-- =============================================================================
-- 15. TRIGGERS – updated_at auto-maintenance
-- =============================================================================
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'businesses','users','companies','categories','cuisine_types',
    'territories','crm_leads','areas','cities','provinces'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at
       BEFORE UPDATE ON %s
       FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();', tbl, tbl);
  END LOOP;
END;
$$;


-- =============================================================================
-- 16. SEED – Core reference data
-- =============================================================================

INSERT INTO provinces (name, code) VALUES
  ('Sindh', 'SD'), ('Punjab', 'PB'), ('Khyber Pakhtunkhwa', 'KP'),
  ('Balochistan', 'BL'), ('Islamabad Capital Territory', 'ICT'),
  ('Azad Jammu & Kashmir', 'AJK'), ('Gilgit-Baltistan', 'GB');

INSERT INTO categories (name, slug) VALUES
  ('Restaurant',     'restaurant'),
  ('Café',           'cafe'),
  ('Bakery',         'bakery'),
  ('Dhaba',          'dhaba'),
  ('Hotel',          'hotel'),
  ('Cloud Kitchen',  'cloud-kitchen'),
  ('Food Court',     'food-court'),
  ('Catering',       'catering'),
  ('Sweet Shop',     'sweet-shop'),
  ('Ice Cream Parlour', 'ice-cream-parlour');

INSERT INTO cuisine_types (name, slug) VALUES
  ('Pakistani',   'pakistani'),
  ('Chinese',     'chinese'),
  ('Fast Food',   'fast-food'),
  ('Seafood',     'seafood'),
  ('BBQ',         'bbq'),
  ('Italian',     'italian'),
  ('Continental', 'continental'),
  ('Indian',      'indian'),
  ('Turkish',     'turkish'),
  ('Desi',        'desi'),
  ('Breakfast',   'breakfast'),
  ('Desserts',    'desserts');

INSERT INTO system_settings (key, value, description) VALUES
  ('app_name',            '"PakIndex"',                      'Platform display name'),
  ('scrape_rate_limit',   '{"requests_per_min": 30}',        'Scraper rate limit'),
  ('duplicate_threshold', '0.85',                            'Cosine similarity threshold for duplicate detection'),
  ('default_plan',        '"trial"',                         'Default plan for new companies'),
  ('trial_days',          '14',                              'Length of trial period in days'),
  ('max_export_rows',     '50000',                           'Max rows per CSV export');

-- =============================================================================
-- END OF SCHEMA
-- =============================================================================
