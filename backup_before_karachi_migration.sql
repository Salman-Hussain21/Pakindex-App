--
-- PostgreSQL database dump
--

\restrict Eczfyg1mwWDNaePv9iRRMPNNXTp1MP5Y48i8amZ8hplqb3VlztUIII7Ok1aO4aD

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


--
-- Name: unaccent; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;


--
-- Name: EXTENSION unaccent; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION unaccent IS 'text search dictionary that removes accents';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: activity_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.activity_type AS ENUM (
    'visit',
    'call',
    'email',
    'whatsapp',
    'note',
    'status_change',
    'follow_up'
);


ALTER TYPE public.activity_type OWNER TO postgres;

--
-- Name: audit_action; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.audit_action AS ENUM (
    'create',
    'update',
    'delete',
    'login',
    'logout',
    'export',
    'import',
    'approve',
    'reject',
    'restore',
    'merge',
    'assign'
);


ALTER TYPE public.audit_action OWNER TO postgres;

--
-- Name: audit_entity; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.audit_entity AS ENUM (
    'user',
    'company',
    'business',
    'crm_lead',
    'employee',
    'scrape_job',
    'territory'
);


ALTER TYPE public.audit_entity OWNER TO postgres;

--
-- Name: business_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.business_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'duplicate',
    'merged',
    'trashed'
);


ALTER TYPE public.business_status OWNER TO postgres;

--
-- Name: business_tier; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.business_tier AS ENUM (
    'tier_1',
    'tier_2',
    'tier_3'
);


ALTER TYPE public.business_tier OWNER TO postgres;

--
-- Name: company_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.company_status AS ENUM (
    'active',
    'suspended',
    'cancelled'
);


ALTER TYPE public.company_status OWNER TO postgres;

--
-- Name: export_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.export_status AS ENUM (
    'queued',
    'processing',
    'ready',
    'failed',
    'expired'
);


ALTER TYPE public.export_status OWNER TO postgres;

--
-- Name: export_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.export_type AS ENUM (
    'businesses',
    'crm_leads',
    'employees',
    'activities'
);


ALTER TYPE public.export_type OWNER TO postgres;

--
-- Name: lead_stage; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.lead_stage AS ENUM (
    'new',
    'contacted',
    'interested',
    'meeting',
    'proposal',
    'won',
    'lost'
);


ALTER TYPE public.lead_stage OWNER TO postgres;

--
-- Name: notification_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.notification_type AS ENUM (
    'new_scrape',
    'new_approval',
    'new_crm',
    'company_activity',
    'system_alert',
    'lead_assigned',
    'follow_up_reminder',
    'new_restaurant',
    'employee_update',
    'lead_update'
);


ALTER TYPE public.notification_type OWNER TO postgres;

--
-- Name: plan_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.plan_type AS ENUM (
    'trial',
    'basic',
    'pro',
    'enterprise',
    'free',
    'premium',
    'ultra_premium'
);


ALTER TYPE public.plan_type OWNER TO postgres;

--
-- Name: scrape_source; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.scrape_source AS ENUM (
    'google_maps',
    'osm',
    'food_delivery',
    'manual',
    'field_agent',
    'user_submitted'
);


ALTER TYPE public.scrape_source OWNER TO postgres;

--
-- Name: scrape_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.scrape_status AS ENUM (
    'running',
    'completed',
    'failed',
    'partial'
);


ALTER TYPE public.scrape_status OWNER TO postgres;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role AS ENUM (
    'super_admin',
    'company_admin',
    'employee'
);


ALTER TYPE public.user_role OWNER TO postgres;

--
-- Name: user_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_status AS ENUM (
    'active',
    'inactive',
    'suspended'
);


ALTER TYPE public.user_status OWNER TO postgres;

--
-- Name: fn_set_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;


ALTER FUNCTION public.fn_set_updated_at() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: areas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.areas (
    id integer NOT NULL,
    city_id integer NOT NULL,
    name character varying(150) NOT NULL,
    slug character varying(170) NOT NULL,
    boundary public.geometry(MultiPolygon,4326),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.areas OWNER TO postgres;

--
-- Name: areas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.areas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.areas_id_seq OWNER TO postgres;

--
-- Name: areas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.areas_id_seq OWNED BY public.areas.id;


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id bigint NOT NULL,
    performed_by uuid,
    company_id uuid,
    entity_type public.audit_entity NOT NULL,
    entity_id uuid,
    action public.audit_action NOT NULL,
    old_values jsonb,
    new_values jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_id_seq OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: business_hours; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.business_hours (
    id integer NOT NULL,
    business_id uuid NOT NULL,
    day_of_week smallint NOT NULL,
    open_time time without time zone,
    close_time time without time zone,
    is_closed boolean DEFAULT false NOT NULL,
    timezone character varying(50) DEFAULT 'Asia/Karachi'::character varying NOT NULL,
    CONSTRAINT business_hours_day_of_week_check CHECK (((day_of_week >= 0) AND (day_of_week <= 6)))
);


ALTER TABLE public.business_hours OWNER TO postgres;

--
-- Name: business_hours_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.business_hours_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.business_hours_id_seq OWNER TO postgres;

--
-- Name: business_hours_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.business_hours_id_seq OWNED BY public.business_hours.id;


--
-- Name: business_tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.business_tags (
    id integer NOT NULL,
    business_id uuid NOT NULL,
    tag character varying(80) NOT NULL
);


ALTER TABLE public.business_tags OWNER TO postgres;

--
-- Name: business_tags_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.business_tags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.business_tags_id_seq OWNER TO postgres;

--
-- Name: business_tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.business_tags_id_seq OWNED BY public.business_tags.id;


--
-- Name: businesses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.businesses (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(280),
    place_id character varying(100),
    osm_id character varying(100),
    category_id integer,
    cuisine_type_id integer,
    business_type character varying(100),
    tier public.business_tier,
    address text,
    area_id integer,
    city_id integer,
    province_id integer,
    postal_code character varying(20),
    location public.geometry(Point,4326),
    latitude numeric(11,8),
    longitude numeric(11,8),
    phone character varying(30),
    phone_secondary character varying(30),
    website character varying(500),
    email character varying(255),
    rating numeric(2,1),
    review_count integer DEFAULT 0,
    price_range character varying(100),
    price_min numeric(10,2),
    price_max numeric(10,2),
    open_state character varying(100),
    seating_capacity integer,
    established_year smallint,
    google_maps_url character varying(500),
    facebook_url character varying(500),
    instagram_url character varying(500),
    foodpanda_url character varying(500),
    cheetay_url character varying(500),
    careem_food_url character varying(500),
    thumbnail character varying(500),
    images jsonb DEFAULT '[]'::jsonb,
    service_options text[] DEFAULT '{}'::text[],
    status public.business_status DEFAULT 'pending'::public.business_status NOT NULL,
    rejection_reason text,
    is_active boolean DEFAULT true NOT NULL,
    is_chain boolean DEFAULT false NOT NULL,
    parent_id uuid,
    merged_into_id uuid,
    data_completeness smallint DEFAULT 0,
    last_verified_at timestamp with time zone,
    verified_by uuid,
    source public.scrape_source DEFAULT 'google_maps'::public.scrape_source NOT NULL,
    scrape_job_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    extensions jsonb DEFAULT '{}'::jsonb,
    CONSTRAINT businesses_data_completeness_check CHECK (((data_completeness >= 0) AND (data_completeness <= 100))),
    CONSTRAINT businesses_rating_check CHECK (((rating >= (0)::numeric) AND (rating <= (5)::numeric)))
);


ALTER TABLE public.businesses OWNER TO postgres;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(120) NOT NULL,
    icon character varying(255),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_id_seq OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: cities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cities (
    id integer NOT NULL,
    province_id integer NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(20),
    boundary public.geometry(MultiPolygon,4326),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.cities OWNER TO postgres;

--
-- Name: cities_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cities_id_seq OWNER TO postgres;

--
-- Name: cities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cities_id_seq OWNED BY public.cities.id;


--
-- Name: companies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.companies (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(200) NOT NULL,
    slug character varying(220) NOT NULL,
    industry character varying(100),
    logo_url character varying(500),
    website character varying(500),
    email character varying(255),
    phone character varying(30),
    address text,
    city_id integer,
    status public.company_status DEFAULT 'active'::public.company_status NOT NULL,
    plan public.plan_type DEFAULT 'trial'::public.plan_type NOT NULL,
    plan_started_at timestamp with time zone,
    plan_expires_at timestamp with time zone,
    max_employees integer DEFAULT 5 NOT NULL,
    max_territories integer DEFAULT 1 NOT NULL,
    admin_user_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    legal_name character varying(255)
);


ALTER TABLE public.companies OWNER TO postgres;

--
-- Name: company_areas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.company_areas (
    company_id uuid NOT NULL,
    area_id integer NOT NULL,
    assigned_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.company_areas OWNER TO postgres;

--
-- Name: company_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.company_categories (
    company_id uuid NOT NULL,
    category_id integer NOT NULL,
    assigned_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.company_categories OWNER TO postgres;

--
-- Name: company_pinned_businesses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.company_pinned_businesses (
    company_id uuid NOT NULL,
    business_id uuid NOT NULL,
    pinned_by uuid,
    pinned_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.company_pinned_businesses OWNER TO postgres;

--
-- Name: company_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.company_settings (
    company_id uuid NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.company_settings OWNER TO postgres;

--
-- Name: company_territories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.company_territories (
    company_id uuid NOT NULL,
    territory_id uuid NOT NULL,
    assigned_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.company_territories OWNER TO postgres;

--
-- Name: crm_activities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.crm_activities (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    lead_id uuid NOT NULL,
    performed_by uuid NOT NULL,
    activity_type public.activity_type NOT NULL,
    title character varying(255),
    body text,
    visit_location public.geometry(Point,4326),
    visit_completed boolean DEFAULT false,
    stage_from public.lead_stage,
    stage_to public.lead_stage,
    scheduled_at timestamp with time zone,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.crm_activities OWNER TO postgres;

--
-- Name: crm_leads; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.crm_leads (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    company_id uuid NOT NULL,
    business_id uuid NOT NULL,
    assigned_to uuid,
    assigned_by uuid,
    stage public.lead_stage DEFAULT 'new'::public.lead_stage NOT NULL,
    priority smallint DEFAULT 2 NOT NULL,
    expected_value numeric(12,2),
    actual_value numeric(12,2),
    next_follow_up timestamp with time zone,
    last_contact_at timestamp with time zone,
    notes text,
    won_at timestamp with time zone,
    lost_at timestamp with time zone,
    lost_reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT crm_leads_priority_check CHECK (((priority >= 1) AND (priority <= 5)))
);


ALTER TABLE public.crm_leads OWNER TO postgres;

--
-- Name: cuisine_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cuisine_types (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(120) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.cuisine_types OWNER TO postgres;

--
-- Name: cuisine_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cuisine_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cuisine_types_id_seq OWNER TO postgres;

--
-- Name: cuisine_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cuisine_types_id_seq OWNED BY public.cuisine_types.id;


--
-- Name: duplicate_pairs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.duplicate_pairs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    business_a_id uuid NOT NULL,
    business_b_id uuid NOT NULL,
    similarity numeric(5,4),
    detection_method character varying(50),
    resolved boolean DEFAULT false NOT NULL,
    resolution character varying(20),
    resolved_by uuid,
    resolved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.duplicate_pairs OWNER TO postgres;

--
-- Name: employee_territory_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_territory_assignments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    territory_id uuid NOT NULL,
    assigned_by uuid,
    assigned_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone,
    is_active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.employee_territory_assignments OWNER TO postgres;

--
-- Name: export_jobs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.export_jobs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    requested_by uuid NOT NULL,
    company_id uuid,
    export_type public.export_type NOT NULL,
    filters jsonb DEFAULT '{}'::jsonb,
    status public.export_status DEFAULT 'queued'::public.export_status NOT NULL,
    file_url character varying(500),
    row_count integer,
    error_message text,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone
);


ALTER TABLE public.export_jobs OWNER TO postgres;

--
-- Name: follow_ups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.follow_ups (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    lead_id uuid NOT NULL,
    assigned_to uuid NOT NULL,
    due_at timestamp with time zone NOT NULL,
    note text,
    is_completed boolean DEFAULT false NOT NULL,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.follow_ups OWNER TO postgres;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    recipient_id uuid NOT NULL,
    company_id uuid,
    type public.notification_type NOT NULL,
    title character varying(255) NOT NULL,
    body text,
    link character varying(500),
    entity_type public.audit_entity,
    entity_id uuid,
    is_read boolean DEFAULT false NOT NULL,
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: provinces; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.provinces (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(10) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.provinces OWNER TO postgres;

--
-- Name: provinces_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.provinces_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.provinces_id_seq OWNER TO postgres;

--
-- Name: provinces_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.provinces_id_seq OWNED BY public.provinces.id;


--
-- Name: scrape_jobs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.scrape_jobs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    initiated_by uuid,
    source public.scrape_source NOT NULL,
    query character varying(500),
    area_id integer,
    city_id integer,
    category_id integer,
    status public.scrape_status DEFAULT 'running'::public.scrape_status NOT NULL,
    total_found integer DEFAULT 0,
    new_records integer DEFAULT 0,
    duplicates integer DEFAULT 0,
    failed_records integer DEFAULT 0,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    error_message text,
    raw_payload jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.scrape_jobs OWNER TO postgres;

--
-- Name: scrape_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.scrape_logs (
    id bigint NOT NULL,
    scrape_job_id uuid NOT NULL,
    business_id uuid,
    place_id character varying(100),
    log_level character varying(10) DEFAULT 'info'::character varying NOT NULL,
    message text,
    raw_data jsonb,
    logged_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.scrape_logs OWNER TO postgres;

--
-- Name: scrape_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.scrape_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.scrape_logs_id_seq OWNER TO postgres;

--
-- Name: scrape_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.scrape_logs_id_seq OWNED BY public.scrape_logs.id;


--
-- Name: subscription_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subscription_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    company_id uuid NOT NULL,
    plan_from public.plan_type,
    plan_to public.plan_type NOT NULL,
    changed_by uuid,
    reason text,
    changed_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.subscription_logs OWNER TO postgres;

--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_settings (
    key character varying(100) NOT NULL,
    value jsonb NOT NULL,
    description text,
    updated_by uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.system_settings OWNER TO postgres;

--
-- Name: territories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.territories (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(150) NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.territories OWNER TO postgres;

--
-- Name: territory_areas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.territory_areas (
    territory_id uuid NOT NULL,
    area_id integer NOT NULL
);


ALTER TABLE public.territory_areas OWNER TO postgres;

--
-- Name: user_preferences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_preferences (
    user_id uuid NOT NULL,
    dark_mode boolean DEFAULT false NOT NULL,
    language character varying(10) DEFAULT 'en'::character varying NOT NULL,
    preferences jsonb DEFAULT '{}'::jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_preferences OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    employee_code character varying(30),
    full_name character varying(150) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(30),
    username character varying(80),
    password_hash text NOT NULL,
    role public.user_role DEFAULT 'employee'::public.user_role NOT NULL,
    status public.user_status DEFAULT 'active'::public.user_status NOT NULL,
    designation character varying(100),
    department character varying(100),
    avatar_url character varying(500),
    company_id uuid,
    assigned_area_id integer,
    email_verified_at timestamp with time zone,
    last_login_at timestamp with time zone,
    password_reset_token character varying(255),
    password_reset_expires timestamp with time zone,
    refresh_token_hash text,
    dark_mode boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: vw_admin_dashboard; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vw_admin_dashboard AS
 SELECT ( SELECT count(*) AS count
           FROM public.businesses) AS total_businesses,
    ( SELECT count(*) AS count
           FROM public.businesses
          WHERE (businesses.status = 'pending'::public.business_status)) AS pending_approvals,
    ( SELECT count(*) AS count
           FROM public.businesses
          WHERE (businesses.status = 'approved'::public.business_status)) AS approved_records,
    ( SELECT count(*) AS count
           FROM public.businesses
          WHERE (businesses.status = 'rejected'::public.business_status)) AS rejected_records,
    ( SELECT count(*) AS count
           FROM public.companies
          WHERE (companies.deleted_at IS NULL)) AS total_companies,
    ( SELECT count(*) AS count
           FROM public.users
          WHERE ((users.role = 'employee'::public.user_role) AND (users.deleted_at IS NULL))) AS total_employees,
    ( SELECT count(*) AS count
           FROM public.scrape_jobs
          WHERE (scrape_jobs.started_at > (now() - '24:00:00'::interval))) AS scrapes_last_24h,
    ( SELECT count(*) AS count
           FROM public.crm_activities
          WHERE (crm_activities.created_at > (now() - '24:00:00'::interval))) AS crm_activities_last_24h;


ALTER VIEW public.vw_admin_dashboard OWNER TO postgres;

--
-- Name: vw_company_lead_stats; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vw_company_lead_stats AS
 SELECT company_id,
    count(*) AS total_leads,
    count(*) FILTER (WHERE (stage = 'won'::public.lead_stage)) AS won_leads,
    count(*) FILTER (WHERE (stage = 'lost'::public.lead_stage)) AS lost_leads,
    count(*) FILTER (WHERE (stage = 'new'::public.lead_stage)) AS new_leads,
    count(DISTINCT assigned_to) AS active_employees
   FROM public.crm_leads cl
  GROUP BY company_id;


ALTER VIEW public.vw_company_lead_stats OWNER TO postgres;

--
-- Name: vw_employee_performance; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vw_employee_performance AS
 SELECT u.id AS employee_id,
    u.full_name,
    u.company_id,
    count(DISTINCT cl.id) AS leads_assigned,
    count(DISTINCT ca.id) FILTER (WHERE (ca.activity_type = 'visit'::public.activity_type)) AS visits_completed,
    count(DISTINCT cl.id) FILTER (WHERE (cl.stage = 'won'::public.lead_stage)) AS leads_won,
    count(DISTINCT cl.id) FILTER (WHERE ((cl.stage = 'contacted'::public.lead_stage) OR (cl.stage = 'interested'::public.lead_stage) OR (cl.stage = 'meeting'::public.lead_stage) OR (cl.stage = 'proposal'::public.lead_stage))) AS leads_in_progress,
    round((((count(DISTINCT cl.id) FILTER (WHERE (cl.stage = 'won'::public.lead_stage)))::numeric / (NULLIF(count(DISTINCT cl.id), 0))::numeric) * (100)::numeric), 2) AS conversion_rate_pct
   FROM ((public.users u
     LEFT JOIN public.crm_leads cl ON ((cl.assigned_to = u.id)))
     LEFT JOIN public.crm_activities ca ON ((ca.performed_by = u.id)))
  WHERE ((u.role = 'employee'::public.user_role) AND (u.deleted_at IS NULL))
  GROUP BY u.id, u.full_name, u.company_id;


ALTER VIEW public.vw_employee_performance OWNER TO postgres;

--
-- Name: areas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.areas ALTER COLUMN id SET DEFAULT nextval('public.areas_id_seq'::regclass);


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: business_hours id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business_hours ALTER COLUMN id SET DEFAULT nextval('public.business_hours_id_seq'::regclass);


--
-- Name: business_tags id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business_tags ALTER COLUMN id SET DEFAULT nextval('public.business_tags_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: cities id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cities ALTER COLUMN id SET DEFAULT nextval('public.cities_id_seq'::regclass);


--
-- Name: cuisine_types id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cuisine_types ALTER COLUMN id SET DEFAULT nextval('public.cuisine_types_id_seq'::regclass);


--
-- Name: provinces id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provinces ALTER COLUMN id SET DEFAULT nextval('public.provinces_id_seq'::regclass);


--
-- Name: scrape_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scrape_logs ALTER COLUMN id SET DEFAULT nextval('public.scrape_logs_id_seq'::regclass);


--
-- Data for Name: areas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.areas (id, city_id, name, slug, boundary, created_at, updated_at) FROM stdin;
1	1	PECHS	karachi-pechs	\N	2026-06-25 15:33:45.029019+05	2026-06-27 13:45:43.785471+05
2	1	DHA	karachi-dha	\N	2026-06-25 15:33:45.038189+05	2026-06-27 13:45:43.785471+05
3	1	DHA Phase 6	karachi-dha-phase-6	\N	2026-06-25 15:33:45.039554+05	2026-06-27 13:45:43.785471+05
4	1	Clifton	karachi-clifton	\N	2026-06-25 15:33:45.049027+05	2026-06-27 13:45:43.785471+05
5	1	Gulshan-e-Iqbal	karachi-gulshan-e-iqbal	\N	2026-06-25 15:33:45.051602+05	2026-06-27 13:45:43.785471+05
6	1	Saddar	karachi-saddar	\N	2026-06-25 15:33:45.052815+05	2026-06-27 13:45:43.785471+05
7	1	Tariq Road	karachi-tariq-road	\N	2026-06-25 15:33:45.063939+05	2026-06-27 13:45:43.785471+05
8	1	SMCHS	karachi-smchs	\N	2026-06-25 15:33:45.072296+05	2026-06-27 13:45:43.785471+05
9	2	Gulberg	lahore-gulberg	\N	2026-06-25 15:33:45.076804+05	2026-06-27 13:45:43.785471+05
10	2	Johar Town	lahore-johar-town	\N	2026-06-25 15:33:45.084177+05	2026-06-27 13:45:43.785471+05
11	3	F-7	islamabad-f-7	\N	2026-06-25 15:33:45.090246+05	2026-06-27 13:45:43.785471+05
12	3	F-6	islamabad-f-6	\N	2026-06-25 15:33:45.1004+05	2026-06-27 13:45:43.785471+05
13	3	G-11	islamabad-g-11	\N	2026-06-25 15:33:45.104742+05	2026-06-27 13:45:43.785471+05
14	3	Bahria Town	islamabad-bahria-town	\N	2026-06-25 15:33:45.107278+05	2026-06-27 13:45:43.785471+05
23	1	Bahadurabad	karachi-bahadurabad	\N	2026-06-27 13:46:11.653528+05	2026-06-27 13:46:11.653528+05
24	1	North Nazimabad	karachi-north-nazimabad	\N	2026-06-27 13:46:11.658414+05	2026-06-27 13:46:11.658414+05
25	1	Nazimabad	karachi-nazimabad	\N	2026-06-27 13:46:11.66013+05	2026-06-27 13:46:11.66013+05
26	1	Gulistan-e-Johar	karachi-gulistan-e-johar	\N	2026-06-27 13:46:11.661283+05	2026-06-27 13:46:11.661283+05
27	1	Korangi	karachi-korangi	\N	2026-06-27 13:46:11.662191+05	2026-06-27 13:46:11.662191+05
28	1	Malir	karachi-malir	\N	2026-06-27 13:46:11.663193+05	2026-06-27 13:46:11.663193+05
29	1	Landhi	karachi-landhi	\N	2026-06-27 13:46:11.665371+05	2026-06-27 13:46:11.665371+05
30	1	Federal B Area	karachi-federal-b-area	\N	2026-06-27 13:46:11.666247+05	2026-06-27 13:46:11.666247+05
31	1	Liaquatabad	karachi-liaquatabad	\N	2026-06-27 13:46:11.666994+05	2026-06-27 13:46:11.666994+05
32	1	SITE Area	karachi-site-area	\N	2026-06-27 13:46:11.668044+05	2026-06-27 13:46:11.668044+05
33	1	Shahrah-e-Faisal	karachi-shahrah-e-faisal	\N	2026-06-27 13:46:11.669602+05	2026-06-27 13:46:11.669602+05
34	1	Boat Basin	karachi-boat-basin	\N	2026-06-27 13:46:11.67203+05	2026-06-27 13:46:11.67203+05
35	1	Zamzama	karachi-zamzama	\N	2026-06-27 13:46:11.673008+05	2026-06-27 13:46:11.673008+05
36	1	Gizri	karachi-gizri	\N	2026-06-27 13:46:11.676048+05	2026-06-27 13:46:11.676048+05
37	1	Garden	karachi-garden	\N	2026-06-27 13:46:11.677147+05	2026-06-27 13:46:11.677147+05
44	1	Main Tipu Sultan Rd	1-main-tipu-sultan-rd-1782549985624-692	\N	2026-06-27 13:46:25.625118+05	2026-06-27 13:46:25.625118+05
45	1	BMCHS Sharafabad	1-bmchs-sharafabad-1782549985644-308	\N	2026-06-27 13:46:25.644922+05	2026-06-27 13:46:25.644922+05
46	3	Block H G 7/2 Blue Area	3-block-h-g-7-2-blue-area-1782549985646-397	\N	2026-06-27 13:46:25.646754+05	2026-06-27 13:46:25.646754+05
47	3	F-10/1 F 10/1 F-10	3-f-10-1-f-10-1-f-10-1782549985648-460	\N	2026-06-27 13:46:25.648755+05	2026-06-27 13:46:25.648755+05
48	3	F 6/1 Blue Area	3-f-6-1-blue-area-1782549985651-832	\N	2026-06-27 13:46:25.652491+05	2026-06-27 13:46:25.652491+05
49	3	F 11 Markaz F-11	3-f-11-markaz-f-11-1782549985654-492	\N	2026-06-27 13:46:25.654882+05	2026-06-27 13:46:25.654882+05
50	3	H-13	3-h-13-1782549985656-610	\N	2026-06-27 13:46:25.657482+05	2026-06-27 13:46:25.657482+05
51	3	E-7	3-e-7-1782549985659-163	\N	2026-06-27 13:46:25.659961+05	2026-06-27 13:46:25.659961+05
52	3	Shakar Parian	3-shakar-parian-1782549985669-16	\N	2026-06-27 13:46:25.670568+05	2026-06-27 13:46:25.670568+05
53	3	Block D G 6/2 Blue Area	3-block-d-g-6-2-blue-area-1782549985676-702	\N	2026-06-27 13:46:25.677206+05	2026-06-27 13:46:25.677206+05
54	3	Margalla Town Phase 1 Orchard Scheme	3-margalla-town-phase-1-orchard-scheme-1782549985678-824	\N	2026-06-27 13:46:25.679047+05	2026-06-27 13:46:25.679047+05
55	3	G-8 Markaz G 8 Markaz G-8	3-g-8-markaz-g-8-markaz-g-8-1782549985680-233	\N	2026-06-27 13:46:25.68087+05	2026-06-27 13:46:25.68087+05
56	1	Mohammad Ali Society Muhammad Ali Chs (Machs)	1-mohammad-ali-society-muhammad-ali-chs-machs-1782550413830	\N	2026-06-27 13:53:33.834117+05	2026-06-27 13:53:33.834117+05
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, performed_by, company_id, entity_type, entity_id, action, old_values, new_values, ip_address, user_agent, created_at) FROM stdin;
1	e96cc951-24d3-4f77-94c0-318696ad390d	\N	user	e96cc951-24d3-4f77-94c0-318696ad390d	login	\N	\N	\N	\N	2026-06-27 13:42:14.785346+05
2	e96cc951-24d3-4f77-94c0-318696ad390d	\N	user	e96cc951-24d3-4f77-94c0-318696ad390d	login	\N	\N	\N	\N	2026-06-27 13:47:38.807321+05
3	e96cc951-24d3-4f77-94c0-318696ad390d	\N	scrape_job	f43cddfa-65d3-4896-bd4c-a6b6c6f33055	import	\N	{"duplicates": 5, "newRecords": 15, "searchQuery": "Karachi Popular Resturants", "failedRecords": 0}	\N	\N	2026-06-27 13:53:34.019868+05
4	e96cc951-24d3-4f77-94c0-318696ad390d	\N	user	e96cc951-24d3-4f77-94c0-318696ad390d	logout	\N	\N	\N	\N	2026-06-27 13:54:21.277143+05
5	e96cc951-24d3-4f77-94c0-318696ad390d	\N	user	e96cc951-24d3-4f77-94c0-318696ad390d	login	\N	\N	\N	\N	2026-07-01 14:28:24.804871+05
6	e96cc951-24d3-4f77-94c0-318696ad390d	09148055-e830-421c-8e9e-1c642344d1a8	company	09148055-e830-421c-8e9e-1c642344d1a8	create	\N	{"plan": "premium", "email": "pepsi@gmail.com", "areaCount": 1, "companyName": "Pepsi", "categoryCount": 1}	\N	\N	2026-07-01 14:34:59.241943+05
7	e96cc951-24d3-4f77-94c0-318696ad390d	\N	company	\N	update	\N	{"count": 1, "bulkAction": "suspend"}	\N	\N	2026-07-01 14:35:10.773449+05
8	e96cc951-24d3-4f77-94c0-318696ad390d	\N	company	\N	update	\N	{"count": 1, "bulkAction": "activate"}	\N	\N	2026-07-01 14:35:31.291353+05
9	e96cc951-24d3-4f77-94c0-318696ad390d	\N	user	e96cc951-24d3-4f77-94c0-318696ad390d	logout	\N	\N	\N	\N	2026-07-01 14:42:52.965099+05
10	e96cc951-24d3-4f77-94c0-318696ad390d	\N	user	e96cc951-24d3-4f77-94c0-318696ad390d	login	\N	\N	\N	\N	2026-07-01 16:28:00.759415+05
11	e96cc951-24d3-4f77-94c0-318696ad390d	\N	user	e96cc951-24d3-4f77-94c0-318696ad390d	logout	\N	\N	\N	\N	2026-07-01 16:44:11.732634+05
12	e96cc951-24d3-4f77-94c0-318696ad390d	\N	user	e96cc951-24d3-4f77-94c0-318696ad390d	login	\N	\N	\N	\N	2026-07-01 19:27:20.50547+05
13	e96cc951-24d3-4f77-94c0-318696ad390d	\N	user	e96cc951-24d3-4f77-94c0-318696ad390d	login	\N	\N	\N	\N	2026-07-01 21:30:14.540963+05
14	e96cc951-24d3-4f77-94c0-318696ad390d	\N	user	e96cc951-24d3-4f77-94c0-318696ad390d	login	\N	\N	\N	\N	2026-07-02 13:01:25.287127+05
15	e96cc951-24d3-4f77-94c0-318696ad390d	\N	business	a506ddc1-fd08-4a6d-9af8-d8b75bb57052	approve	{"status": "pending"}	{"name": "Chai Chatt", "action": "approve"}	\N	\N	2026-07-02 13:02:35.583817+05
16	e96cc951-24d3-4f77-94c0-318696ad390d	\N	company	\N	update	\N	{"count": 1, "bulkAction": "suspend"}	\N	\N	2026-07-02 13:03:56.948734+05
17	e96cc951-24d3-4f77-94c0-318696ad390d	\N	user	e96cc951-24d3-4f77-94c0-318696ad390d	logout	\N	\N	\N	\N	2026-07-02 13:04:04.451524+05
18	e96cc951-24d3-4f77-94c0-318696ad390d	\N	user	e96cc951-24d3-4f77-94c0-318696ad390d	login	\N	\N	\N	\N	2026-07-02 13:04:54.451533+05
19	e96cc951-24d3-4f77-94c0-318696ad390d	\N	company	\N	update	\N	{"count": 1, "bulkAction": "activate"}	\N	\N	2026-07-02 13:05:17.530939+05
20	e96cc951-24d3-4f77-94c0-318696ad390d	\N	user	e96cc951-24d3-4f77-94c0-318696ad390d	logout	\N	\N	\N	\N	2026-07-02 13:05:52.653754+05
21	15662fc5-a595-42af-827e-2925c30b11d7	09148055-e830-421c-8e9e-1c642344d1a8	employee	8cba116b-7cd9-4093-a18c-949e6cf6705a	update	\N	{"bulkAction": "suspend", "statusChanged": "inactive"}	\N	\N	2026-07-02 14:37:04.272537+05
22	15662fc5-a595-42af-827e-2925c30b11d7	09148055-e830-421c-8e9e-1c642344d1a8	employee	8cba116b-7cd9-4093-a18c-949e6cf6705a	update	\N	{"bulkAction": "activate", "statusChanged": "active"}	\N	\N	2026-07-02 14:37:17.916059+05
23	15662fc5-a595-42af-827e-2925c30b11d7	09148055-e830-421c-8e9e-1c642344d1a8	employee	f9f8f90c-2e88-4e47-9d59-ed3ddf3e37f3	create	\N	{"email": "hassanali@pepsi.com", "fullName": "Hassan Ali", "department": "Wala", "designation": "Physics", "employeeCode": "EMP-400813"}	\N	\N	2026-07-02 14:38:42.124979+05
24	15662fc5-a595-42af-827e-2925c30b11d7	09148055-e830-421c-8e9e-1c642344d1a8	employee	f9f8f90c-2e88-4e47-9d59-ed3ddf3e37f3	update	\N	{"bulkAction": "suspend", "statusChanged": "inactive"}	\N	\N	2026-07-03 14:16:27.891341+05
25	15662fc5-a595-42af-827e-2925c30b11d7	09148055-e830-421c-8e9e-1c642344d1a8	employee	f9f8f90c-2e88-4e47-9d59-ed3ddf3e37f3	update	{"email": "hassanali@pepsi.com", "phone": "0300022200", "username": "hassan.ali", "full_name": "Hassan Ali", "department": "Wala", "designation": "Physics"}	{"email": "hassanali@pepsi.com", "phone": "0300022200", "fullName": "Hassan Ali Afandi", "username": "hassan.ali", "department": "Wala", "designation": "Physics"}	\N	\N	2026-07-03 14:16:36.045689+05
26	e96cc951-24d3-4f77-94c0-318696ad390d	\N	user	e96cc951-24d3-4f77-94c0-318696ad390d	login	\N	\N	\N	\N	2026-07-03 14:17:14.383108+05
27	e96cc951-24d3-4f77-94c0-318696ad390d	\N	business	4b0ed062-5745-43af-bd8f-0b9d41b9170d	approve	{"status": "pending"}	{"name": "Boat Basin", "action": "approve"}	\N	\N	2026-07-03 14:19:00.473961+05
28	e96cc951-24d3-4f77-94c0-318696ad390d	\N	user	e96cc951-24d3-4f77-94c0-318696ad390d	logout	\N	\N	\N	\N	2026-07-03 14:22:23.194633+05
29	e96cc951-24d3-4f77-94c0-318696ad390d	\N	user	e96cc951-24d3-4f77-94c0-318696ad390d	login	\N	\N	\N	\N	2026-07-03 14:24:16.910303+05
30	e96cc951-24d3-4f77-94c0-318696ad390d	b4162808-f43f-4330-9aba-0a53295f6fee	company	b4162808-f43f-4330-9aba-0a53295f6fee	create	\N	{"plan": "free", "email": "cola@gmail.com", "areaCount": 6, "companyName": "Cola", "categoryCount": 1}	\N	\N	2026-07-03 14:25:45.442258+05
31	e96cc951-24d3-4f77-94c0-318696ad390d	\N	user	e96cc951-24d3-4f77-94c0-318696ad390d	login	\N	\N	\N	\N	2026-07-03 18:59:43.98055+05
32	e96cc951-24d3-4f77-94c0-318696ad390d	\N	user	e96cc951-24d3-4f77-94c0-318696ad390d	login	\N	\N	\N	\N	2026-07-03 22:11:29.839261+05
33	e96cc951-24d3-4f77-94c0-318696ad390d	\N	user	e96cc951-24d3-4f77-94c0-318696ad390d	logout	\N	\N	\N	\N	2026-07-03 22:18:19.969007+05
34	e96cc951-24d3-4f77-94c0-318696ad390d	\N	user	e96cc951-24d3-4f77-94c0-318696ad390d	login	\N	\N	\N	\N	2026-07-03 22:40:31.107415+05
\.


--
-- Data for Name: business_hours; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.business_hours (id, business_id, day_of_week, open_time, close_time, is_closed, timezone) FROM stdin;
\.


--
-- Data for Name: business_tags; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.business_tags (id, business_id, tag) FROM stdin;
\.


--
-- Data for Name: businesses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.businesses (id, name, slug, place_id, osm_id, category_id, cuisine_type_id, business_type, tier, address, area_id, city_id, province_id, postal_code, location, latitude, longitude, phone, phone_secondary, website, email, rating, review_count, price_range, price_min, price_max, open_state, seating_capacity, established_year, google_maps_url, facebook_url, instagram_url, foodpanda_url, cheetay_url, careem_food_url, thumbnail, images, service_options, status, rejection_reason, is_active, is_chain, parent_id, merged_into_id, data_completeness, last_verified_at, verified_by, source, scrape_job_id, created_at, updated_at, deleted_at, extensions) FROM stdin;
0a0da539-92c3-4f59-9fa9-567ae2444ec1	Ginsoy - SMCHS Branch	\N	ChIJ8Tu9m4U-sz4RUH9CH_9GXWk	\N	1	\N	Chinese restaurant	\N	Captain Fareed Bukhari Shaheed Rd, Sindhi Muslim Cooperative Housing Society Block A Sindhi Muslim CHS (SMCHS), Karachi, Pakistan	8	1	\N	\N	\N	24.86403250	67.05492760	+92 21 34398831	\N	http://www.ginsoy.com/	\N	4.4	8288	Rs 1,000 to Rs 7,000	\N	\N	Open · Closes 12 AM	\N	\N	\N	\N	\N	\N	\N	\N	https://lh3.googleusercontent.com/gps-cs-s/APNQkAEOVWxPVOAAtDgS3MWvLh7yHKA5SiAB-BMWU1fyOPhDrAdTgztNkTUy8pMrrNmEcUvzZO0l5EYfe1_JiHCHq0Sx53S-EsIreJRkDmGzS4gFnJ6RL39Asb8QBrsWAPfQP5Z48E4LqQ=s1024-v1	[]	{Delivery,Takeout,Dine-in}	pending	\N	t	f	\N	\N	0	\N	\N	google_maps	\N	2026-06-25 15:33:58.324526+05	2026-06-25 15:33:58.324526+05	\N	{}
16f027e2-379f-4c45-ad79-ba719b4b33d6	Foods Inn	\N	ChIJ7xoI5YU-sz4R9djkyoxCJx0	\N	1	\N	Family restaurant	\N	Plot # 21-22, Allama I. I. Qazi Chowk, Block A Sindhi Muslim CHS (SMCHS), Karachi, 75500, Pakistan	8	1	\N	\N	\N	24.86310040	67.05491760	+92 21 38899998	\N	http://www.foodsinn.co/	\N	4.3	12163	Rs 1,000 to Rs 3,000	\N	\N	Open · Closes 1:30 AM	\N	\N	\N	\N	\N	\N	\N	\N	https://lh3.googleusercontent.com/gps-cs-s/APNQkAGmhyIZ6MQuDSz5j4LuzemTRIbNpkhA1PAKfEVVLUYbTecBuQWLHmoOiRmMm1EE-MmVSWeYOGydGkS_2i803SFfNqe8kdtTBLo5jkOirvrpavkbyufTH_k8gsXHoO_o9LmPA9tOZZXfxsNu=s1024-v1	[]	{"Onsite services",Takeout,Dine-in}	approved	\N	t	f	\N	\N	0	\N	\N	google_maps	\N	2026-06-25 15:33:58.352616+05	2026-06-25 15:33:58.352616+05	\N	{}
a312c14a-893b-409c-858c-ee8015f5ff27	Real Spice - Tariq Road ریئل اسپائس - طارق روڈ	\N	ChIJg9L_zY8-sz4RAFEVZF-Zb2s	\N	1	\N	Restaurant	\N	124-M, Block 2 P.E.C.H.S., Karachi, 75400, Pakistan	1	1	\N	\N	\N	24.86820580	67.05748390	+92 21 111 734 628	\N	http://realspice.com.pk/	\N	4.8	3831	Rs 1,000 to Rs 6,000	\N	\N	Open · Closes 1 AM	\N	\N	\N	\N	\N	\N	\N	\N	https://lh3.googleusercontent.com/gps-cs-s/APNQkAEQLuEa2eSMmfHUKWgstdao_tI_VIEAxYbZs_OsCbYO4CEx9owLq1VvbmpzPe6kCxHFqH-fPDdrB768DU0TSj2RAY6yFnP6MBBY059ogwLgJoAy-EmoWOdPmBlLXmn5fM0hQesKuA=s1024-v1	[]	{"No-contact delivery",Delivery,"Onsite services",Takeout,Dine-in}	pending	\N	t	f	\N	\N	0	\N	\N	google_maps	\N	2026-06-25 15:33:58.306166+05	2026-06-27 13:46:25.604552+05	\N	{}
6e65cbde-e06f-4ee5-bf84-ae020595ac52	Xander's	\N	ChIJX8sX2iU_sz4RkQSMFLN8lng	\N	1	\N	Restaurant	\N	Tipu Sultan Rd, Karachi Memon Co-operative Housing Society Jinnah Housing Society P.E.C.H.S., Karachi, 74200, Pakistan	1	1	\N	\N	\N	24.86639030	67.07778740	+92 21 111 926 337	\N	http://www.xanders.pk/	\N	4.2	8662	Rs 2,000 to Rs 3,000	\N	\N	Open · Closes 12 AM	\N	\N	\N	\N	\N	\N	\N	\N	https://lh3.googleusercontent.com/gps-cs-s/APNQkAHpj09Ak8P2whQOozGZSmKtqE4NGtviUcGcDy4jAxkX0ZuAahsDoeMbbHoEk1cTj4505z3kPxCVRUHoWEOR1q8UeiuZrgHdPaMyRjhiLF4YvtKruvlsABVbeQ_9aK3_Q660m-AWJw=s1024-v1	[]	{"Outdoor seating","Onsite services",Takeout,Dine-in}	pending	\N	t	f	\N	\N	0	\N	\N	google_maps	\N	2026-06-25 15:33:58.312774+05	2026-06-27 13:46:25.606057+05	\N	{}
82e7db2d-e4c4-49c8-8caa-6cbc5973f054	Mandi House	\N	ChIJ6Zn3R-s-sz4R7B4PYNbBVGM	\N	1	\N	Arab restaurant	\N	Shaheed-e-Millat Rd, Delhi Mercantile Society P.E.C.H.S., Karachi, 75400, Pakistan	1	1	\N	\N	\N	24.87871910	67.06593790	+92 331 0222233	\N	https://mandihouse.pk/	\N	4.4	9880	Moderately expensive	\N	\N	Open · Closes 12:30 AM	\N	\N	\N	\N	\N	\N	\N	\N	https://lh3.googleusercontent.com/gps-cs-s/APNQkAF2jllOAWbieCKDtWDa8WV_J37zdV6fEBnVMteZ9P_UKx5OP4iCCOMb1nIn9iPj9V-vgpvO8yaWHQtHW7FeezFoZdjX4phWPxFOV2c7kvpmzqPUacG4nNtFf-UOwTt8u1Khaz2ubg=s1024-v1	[]	{"Onsite services",Takeout,Dine-in}	pending	\N	t	f	\N	\N	0	\N	\N	google_maps	\N	2026-06-25 15:33:58.318258+05	2026-06-27 13:46:25.612091+05	\N	{}
367d1638-473f-42d2-a6dd-595b721cbdbc	New Zahid Restaurant	\N	ChIJD1jCLY4-sz4RISsNTUhfupM	\N	1	\N	Pakistani restaurant	\N	Tariq Rd, Block 2 P.E.C.H.S., Karachi, 74600, Pakistan	1	1	\N	\N	\N	24.86859020	67.05772990	+92 301 2636546	\N	https://zahidnihari.pk/	\N	4.2	15654	Rs 1 to Rs 1,000	\N	\N	Open · Closes 11 PM	\N	\N	\N	\N	\N	\N	\N	\N	https://lh3.googleusercontent.com/gps-cs-s/APNQkAGgH7bfU_JrgEOmbkLuyERiVPhE2K1uDoSlR0fKHOZe0iUOb1t0V6pTzWU3_AS8mfgZfMPYftyDW3CZfH4BQ5PnOGYez9SDU1xeM4VJLodGEo4jgVU-__Q97V_aHwJi_4COtyeK=s1024-v1	[]	{"Onsite services",Takeout,Dine-in}	pending	\N	t	f	\N	\N	0	\N	\N	google_maps	\N	2026-06-25 15:33:58.328114+05	2026-06-27 13:46:25.615307+05	\N	{}
6499858b-c0d9-4bfb-8c98-c2d37e2d3ba2	Coconut Grove	\N	ChIJsezbVWE_sz4RMjL2wXm0lxw	\N	1	\N	Restaurant	\N	Plot #36, Block 7/8, Modern Cooperative Housing Society, Main Tipu Sultan Rd, Jinnah Housing Society Karachi, 75350, Pakistan	44	1	\N	\N	\N	24.86841010	67.07811370	+92 305 7774444	\N	https://onlinemenu.pk/coconut-grove-menu/	\N	4.2	5271	Rs 2,000 to Rs 8,000	\N	\N	Open · Closes 11:30 PM	\N	\N	\N	\N	\N	\N	\N	\N	https://lh3.googleusercontent.com/gps-cs-s/APNQkAHW_1V3XSt_Q71wxV0Myus935ynzQg9t9PJK9zYY3DzHq_MoWUYQY3TtwCqwIcT0yLCwavF2SexYAysrRNAOO2HWFhOsUgriYmlbdiqyVET6iq6WUoQMPiZ34VxWOlL__lATUQ=s1024-v1	[]	{"Outdoor seating",Delivery,"Onsite services",Takeout,Dine-in}	pending	\N	t	f	\N	\N	0	\N	\N	google_maps	\N	2026-06-25 15:33:58.339462+05	2026-06-27 13:46:25.626742+05	\N	{}
2bec33fe-aa63-41bc-b91f-d878ced78224	Karachi Foods	\N	ChIJDdXnApw-sz4RG3r1Hnq3HoQ	\N	1	\N	Restaurant	\N	Plot 12A, Al Rasheed Chamber, Shahra-e-Faisal, Block 6 P.E.C.H.S., Karachi, 75400, Pakistan	1	1	\N	\N	\N	24.86027890	67.06420640	+92 21 111 536 637	\N	http://www.karachifoods.pk/	\N	4.0	7436	Rs 1 to Rs 2,000	\N	\N	Open · Closes 2 AM	\N	\N	\N	\N	\N	\N	\N	\N	https://lh3.googleusercontent.com/gps-cs-s/APNQkAGog4kB4oEu7KZvQsVaAg5IjXxsfcwssQpHHc9XqzbCoxquBU8GJXKI4fRLnsV-9ikNAkduWCHJG_ntN8DbPmIEJXrW4bsYHUAypF3WbQ0rtm56NlGW9Z63lGw-7wu5qlk9_Q3dqg=s1024-v1	[]	{Drive-through,"Onsite services",Takeout,Dine-in}	pending	\N	t	f	\N	\N	0	\N	\N	google_maps	\N	2026-06-25 15:33:58.34337+05	2026-06-27 13:46:25.628556+05	\N	{}
b594370b-22f7-4a1a-95e2-eeaad299b839	USA FOOD	\N	ChIJpyowZws_sz4RzoH6B2nh4pU	\N	1	\N	Restaurant	\N	SHOP # 4/390NEAR, ERUM BAKERY, 4, Block 2 P.E.C.H.S., Karachi, 75400, Pakistan	1	1	\N	\N	\N	24.86778390	67.05249120	+92 312 2139263	\N	\N	\N	4.6	155	Rs 1 to Rs 500	\N	\N	Open · Closes 5 PM	\N	\N	\N	\N	\N	\N	\N	\N	https://lh3.googleusercontent.com/gps-cs-s/APNQkAFXUaqaT827-UOzhEWQ1yjA24nlgYffIX-PuWuBhCKZdR7G_Cot9w2MtjJRD8rzKDV3o8R_ZKmchp7OTV_T-2urg8q3yMQNJ8jpqywh8IvPJIFSYvrmTSTOdjTxo8yd149rMCnrOBvHKjan=s1024-v1	[]	{"Outdoor seating","No-contact delivery",Delivery,Takeout,Dine-in}	approved	\N	t	f	\N	\N	0	\N	\N	google_maps	\N	2026-06-25 15:33:58.347792+05	2026-06-27 13:46:25.630513+05	\N	{}
890298de-2346-4a32-8c8e-fde07b69f3f7	New Sadabahar Restaurant	\N	ChIJXS3rues-sz4RfjJi1so_fjk	\N	1	\N	Pakistani restaurant	\N	V3J8+QHF, Bahadurabad BMCHS Sharafabad, Karachi, Pakistan	23	1	\N	\N	\N	24.88194110	67.06641900	+92 21 34215869	\N	\N	\N	4.4	1205	Rs 1 to Rs 1,000	\N	\N	Open · Closes 12 AM	\N	\N	\N	\N	\N	\N	\N	\N	https://lh3.googleusercontent.com/gps-cs-s/APNQkAH4ePRY2hE6YcH3ilS-oK6JTxVZzuYn_phsp24EAvcGuyezuFBTjY5IG2W35cIWwXGEcLOK5rDrKftfgyIndDZk3KLXXumxu6ScZkDGs6zsXvVauTf76sQUXLQ338oDSjMfR9SrSv3G6PVG=s1024-v1	[]	{"Outdoor seating","Onsite services",Takeout,Dine-in}	approved	\N	t	f	\N	\N	0	\N	\N	google_maps	\N	2026-06-25 15:33:58.35879+05	2026-06-27 13:46:25.633709+05	\N	{}
1f42075a-0e2f-4733-bd5c-5a252aa4b243	Cocochan - Tipu Sultan	\N	ChIJO1g1i6Q-sz4R7Y6JMVcxyxA	\N	1	\N	Pan-Asian restaurant	\N	1A Tipu Sultan Rd, next to Xanders, Karachi Memon Co-operative Housing Society Jinnah Housing Society P.E.C.H.S., Karachi, Pakistan	1	1	\N	\N	\N	24.86618560	67.07782200	+92 21 34552695	\N	https://www.cocochan.com.pk/	\N	4.2	5139	Rs 2,000 to Rs 7,000	\N	\N	Open · Closes 12 AM	\N	\N	\N	\N	\N	\N	\N	\N	https://lh3.googleusercontent.com/gps-cs-s/APNQkAE6xl-QQo_2Pg6JLc-q5qkcePfqghHdAR66vI-PJZ0IM1Bzof0Zj-SCaaWmSK8xz3Gmg8X_dmbBHSKwXHsSanKJZtmWsulUUOIGmbcGVbbCiDjascJZh-nTIzttTZRi0ZGi=s1024-v1	[]	{Delivery,"Onsite services",Takeout,Dine-in}	approved	\N	t	f	\N	\N	0	\N	\N	google_maps	\N	2026-06-25 15:33:58.365968+05	2026-06-27 13:46:25.634998+05	\N	{}
c78065bc-4851-41d7-8883-0a5c0e562e4f	Burger O'Clock - SMCHS	\N	ChIJVwshFMo_sz4RmOwlei26DRU	\N	1	\N	Fast food restaurant	\N	Plot # 104-A, Ground floor, S.M.C.H.S Capt, Captain Fareed Bukhari Shaheed Road, Sindhi Muslim Cooperative Housing Society Block A Sindhi Muslim CHS (SMCHS), Karachi, Pakistan	8	1	\N	\N	\N	24.86372190	67.05467730	+92 21 111 432 532	\N	https://burgeroclock.com.pk/	\N	4.5	3228	Rs 1,000 to Rs 2,000	\N	\N	Open · Closes 3 AM	\N	\N	\N	\N	\N	\N	\N	\N	https://lh3.googleusercontent.com/gps-cs-s/APNQkAFn4FahnYH52zqDSP9dcutlLmruExuL04neoyKeRfpCKuAXvV7xbO9FjPeZcBIkxGtovQhp-ZLwLncxpV5Ebq-4A0TdhBpzTSDvJomN_22XmZyw1pLnu0WiUJNCn-0aQ92UrH5e=s1024-v1	[]	{"Outdoor seating",Delivery,"Onsite services",Takeout,Dine-in}	approved	\N	t	f	\N	\N	0	\N	\N	google_maps	\N	2026-06-25 15:33:58.373204+05	2026-06-25 15:33:58.373204+05	\N	{}
b7f7fe40-c553-482b-ad53-9030a168550e	Mizaaj Restaurant	\N	ChIJp-50KVY_sz4RfoJZa5IwWa0	\N	1	\N	Restaurant	\N	Plot 6 A, Main Shahra-e-Faisal, Sindhi Muslim Cooperative Housing Society Block A Sindhi Muslim CHS (SMCHS), Karachi, Pakistan	8	1	\N	\N	\N	24.86009690	67.05447380	+92 301 9025777	\N	http://www.mizaajrestaurant.com/	\N	4.6	6172	Rs 2,000 to Rs 8,000	\N	\N	Closed · Opens 6 PM	\N	\N	\N	\N	\N	\N	\N	\N	https://lh3.googleusercontent.com/gps-cs-s/APNQkAFlYKJSjI0Xb-_HbsxbJwVlSh9B7AAV2y8jIoBegL_506aOCb5legxRNzyEGv4XzIvSTOnKflyERr45RusoUavQSw2qp1fYjstDHi70Ld4_A26NA-OAANJXslv0HHH4GEHA5GzevNFu30EJ=s1024-v1	[]	{"Outdoor seating","Onsite services",Takeout,Dine-in}	approved	\N	t	f	\N	\N	0	\N	\N	google_maps	\N	2026-06-25 15:33:58.380173+05	2026-06-25 15:33:58.380173+05	\N	{}
53940322-2c5e-4bb9-9134-85a605f22e33	Nando's SMCHS	\N	ChIJBdOCqYU-sz4RQz1wyXuquHM	\N	1	\N	Restaurant	\N	Block D, Sub, Plot 8, Ghulam Ali Memon Rd, Block A Sindhi Muslim CHS (SMCHS), Karachi, 72500, Pakistan	8	1	\N	\N	\N	24.86258480	67.05519490	+92 21 111 626 367	\N	http://www.nandos.pk/	\N	4.2	6129	Rs 1,000 to Rs 6,000	\N	\N	Open · Closes 1 AM	\N	\N	\N	\N	\N	\N	\N	\N	https://lh3.googleusercontent.com/gps-cs-s/APNQkAHijb-4bv_PKa1fUwHmFiaBcbzc5iGCxb_4lqZfO7smUysec49OPHWbjgSMC45NRrbmEsliX_WdYk6k7ytq2sz3V_ROfaxQf3PUTFwNIoHQsboOYbhkSkBmgNmfQGgUZlZsrpZo=s1024-v1	[]	{"Onsite services",Takeout,Dine-in}	rejected	Demo: duplicate / low data quality	t	f	\N	\N	0	\N	\N	google_maps	\N	2026-06-25 15:33:58.397951+05	2026-06-25 15:33:58.397951+05	\N	{}
f48dd9a3-f7b0-4730-9ca8-59b4c0ccf51d	LEVEL2 by Espresso	\N	ChIJKTLI3-Y_sz4RO9YEHnTwftg	\N	1	\N	Western restaurant	\N	93 Tipu Sultan Rd, Karachi Memon Co-operative Housing Society Karachi Memon Society P.E.C.H.S., Karachi, Pakistan	1	1	\N	\N	\N	24.86773630	67.07756210	+92 348 2099235	\N	https://www.espressocoffeehouses.com/level2	\N	4.7	385	Rs 1,000 to Rs 5,000	\N	\N	Open · Closes 1 AM	\N	\N	\N	\N	\N	\N	\N	\N	https://lh3.googleusercontent.com/gps-cs-s/APNQkAE0EVlpdfkbbdyRGl8Ad0PH8-k8bkuNNxlaPEQrCri9-mJFudt5RYR6a7P63JuBfoixyULXS-l9KQeJTPE6FQMiVMIOQL2vCEKciYSP9Q45f60z4xW1IhtsUW_a1EeY9KlIMrcsJA=s1024-v1	[]	{Takeout,Dine-in}	approved	\N	t	f	\N	\N	0	\N	\N	google_maps	\N	2026-06-25 15:33:58.391581+05	2026-06-27 13:46:25.63839+05	\N	{}
698d3c16-82fd-4b7c-a0ac-d663b6e58f6b	Ghalib Restaurant Karachi	\N	ChIJk_wHXRo_sz4Rd9MSaWGi_1M	\N	1	\N	Restaurant	\N	Shahrah-e-Faisal Service Rd N, Karachi Memon Co-operative Housing Society Karachi Memon Society P.E.C.H.S., Karachi, Pakistan	33	1	\N	\N	\N	24.86559920	67.07706780	+92 21 111 442 542	\N	http://www.ghalib.com.pk/	\N	3.9	3703	Expensive	\N	\N	Open · Closes 12 AM	\N	\N	\N	\N	\N	\N	\N	\N	https://lh3.googleusercontent.com/gps-cs-s/APNQkAHP-pQsd_LuzTALI2KXgUULU6jhdGRAqvMgcHYNpQ3uGNZ45BvdeX__VWYtCCl60zzlPJ3y5g2bMWLTpS_Z8Yf3jqCuUTyAcf6PF0xzkexLXX8ESihUKE2VP-naYkCl9EbWH9-jFQ=s1024-v1	[]	{"Outdoor seating","No-contact delivery",Delivery,"Onsite services",Takeout,Dine-in}	rejected	Demo: duplicate / low data quality	t	f	\N	\N	0	\N	\N	google_maps	\N	2026-06-25 15:33:58.406886+05	2026-06-27 13:46:25.641801+05	\N	{}
247cde68-9a72-4877-ac08-88764707dc9b	Mamu Fish Grill Original	\N	ChIJdTYkmic_sz4R980q4NAA4vU	\N	1	\N	Restaurant	\N	Library Signal, Main Tariq Rd, opposite to UBL bank، near silver spoon II، Block 2 P.E.C.H.S., Karachi, Pakistan	1	1	\N	\N	\N	24.87132700	67.06002590	+92 301 2222690	\N	\N	\N	4.4	1345	Rs 2,000 to Rs 3,000	\N	\N	Closed · Opens 5:30 PM	\N	\N	\N	\N	\N	\N	\N	\N	https://lh3.googleusercontent.com/gps-cs-s/APNQkAGIRZFnCfbVXdtQ54wRf2V-ujR_1rBkLw25IhAAgwad7Qxy9bOsepFJJechkDKsjmQWh2lhRZNQK3Eiyguh7mNqA_T9aE7liR3ztmIOm1ok-6U63zYaUg53PUiceaYu7rMr7qfR=s1024-v1	[]	{"Outdoor seating",Delivery,Drive-through,"Onsite services",Takeout,Dine-in}	rejected	Demo: duplicate / low data quality	t	f	\N	\N	0	\N	\N	google_maps	\N	2026-06-25 15:33:58.414237+05	2026-06-27 13:46:25.643095+05	\N	{}
945703db-658b-41f3-9c27-c751f8437c51	Oh My Grill - Bahadurabad.	\N	ChIJ17EmTHA_sz4RWTHnohEvemU	\N	1	\N	Restaurant	\N	Bahadur Shah Zafar Road, BMCHS Sharafabad, Karachi, Pakistan	45	1	\N	\N	\N	24.88363630	67.06811050	+92 311 1664664	\N	http://www.ohmygrill.pk/	\N	4.3	2758	Rs 1,000 to Rs 2,000	\N	\N	Open · Closes 12 AM	\N	\N	\N	\N	\N	\N	\N	\N	https://lh3.googleusercontent.com/gps-cs-s/APNQkAF1ccWfE7XJWvTTIVZERPs9GrHsADFOhkt9rzuO5YmUde-g9pxB2656XWTlIOk81vBv_AETS1ZNq3Fr_lPF23-INM28YEozDh1ZI47AL-s3qOwuQ_E4eEGV45b_0leHYak3Xas=s1024-v1	[]	{"Onsite services",Takeout,Dine-in}	rejected	Demo: duplicate / low data quality	t	f	\N	\N	0	\N	\N	google_maps	\N	2026-06-25 15:33:58.420482+05	2026-06-27 13:46:25.645462+05	\N	{}
2ae7ded1-ea28-42cc-a0e7-4e34f282ff11	Savour Foods, Blue Area, Islamabad	\N	ChIJwbBFrqK_3zgRKtFBCoJQjwY	\N	1	\N	Rice restaurant	\N	Fortune Plaza, 2 Jinnah Ave, Block H G 7/2 Blue Area, Islamabad, 44000, Pakistan	46	3	\N	\N	\N	33.71320360	73.06346880	+92 51 2348097	\N	http://www.savourfoods.com.pk/	\N	4.3	70907	Rs 1 to Rs 1,000	\N	\N	Open · Closes 1 AM	\N	\N	\N	\N	\N	\N	\N	\N	https://lh3.googleusercontent.com/gps-cs-s/APNQkAGqBIt87yYNMtoCNYNd60o9YB77q9cWsbldB0dRqEjecOv7xkdpg4qC7DdxYw6C9vW5MgSLpn8t6Vd6M8XuJpLK4taKq5Vh_kZ3F8LL9pTqS1vAKHHMRjb4n6b0Q0gxPN2ljld8=s1024-v1	[]	{"No-contact delivery",Delivery,"Onsite services",Takeout,Dine-in}	pending	\N	t	f	\N	\N	0	\N	\N	google_maps	6e20cbb4-aab4-4a0d-92cc-17a3b5f88076	2026-06-25 15:40:57.749529+05	2026-06-27 13:46:25.647352+05	\N	{}
e291b195-e80a-484f-a49b-c20d46d11b56	Tandoori Restaurant F10	\N	ChIJM9-oxRG-3zgRkIBQ-85ZkAc	\N	1	\N	Restaurant	\N	House No, Khursheed Market, St#30, 66 Street No 25, F-10/1 F 10/1 F-10, Islamabad, 44000, Pakistan	47	3	\N	\N	\N	33.68662420	73.00606480	+92 51 2105566	\N	https://tandoorirestaurants.pk/	\N	4.3	8840	Moderately expensive	\N	\N	Open · Closes 12 AM	\N	\N	\N	\N	\N	\N	\N	\N	https://lh3.googleusercontent.com/gps-cs-s/APNQkAGDoabsXPFwttXVA__bwS95Z_jG5RiTkT5T5Y8YLvUkq39lnwn-QqzLNnKRBNclZgn3PeYskwZpx9zwI7bX8otZMoVWyYDxSZyudkVNv1Sx1RwWJB52pGLNyIkj4VDQI_C7BZYanA=s1024-v1	[]	{"Outdoor seating","No-contact delivery",Delivery,"Onsite services",Takeout,Dine-in}	pending	\N	t	f	\N	\N	0	\N	\N	google_maps	6e20cbb4-aab4-4a0d-92cc-17a3b5f88076	2026-06-25 15:40:57.800505+05	2026-06-27 13:46:25.649941+05	\N	{}
69fdefde-9263-4306-b47e-d36d77746eca	El Momento Islamabad	\N	ChIJ-dwI7sy_3zgRH1YF9a0EYZg	\N	1	\N	Steak house	\N	Shop#06, Ground Floor f6, Beverly Centre, 1 Jinnah Ave, F 6/1 Blue Area, Islamabad, 44000, Pakistan	48	3	\N	\N	\N	33.72006040	73.07382630	+92 311 1100317	\N	https://elmomento.pk/el-momento-islamabad/	\N	4.4	1687	Rs 1 to Rs 6,000	\N	\N	Open · Closes 12 AM	\N	\N	\N	\N	\N	\N	\N	\N	https://lh3.googleusercontent.com/gps-cs-s/APNQkAHQ3Z6xK6Sv_SVoQdypy0KyU-vlLomERf9c8S196iwl_oIxcUXv7GSX-ihU1BFJL1AY6VIMLFmEmxJTda0c3GwJ-KgSJYgAStDf-HmRXBh57YN3OxDjI3SWP3f4UYSgU4d-u1dasw=s1024-v1	[]	{"Outdoor seating","No-contact delivery",Delivery,Drive-through,Takeout,Dine-in}	pending	\N	t	f	\N	\N	0	\N	\N	google_maps	6e20cbb4-aab4-4a0d-92cc-17a3b5f88076	2026-06-25 15:40:57.804114+05	2026-06-27 13:46:25.653379+05	\N	{}
eb5e535b-1e92-4001-baf7-b95eef25208d	Zaviya Restaurant | Best BBQ & Shinwari Restaurant	\N	ChIJOd8fctyX3zgRc6FmymNQOAk	\N	1	\N	Restaurant	\N	H, Malik Haroon Street, Opp NUST Gate 2, 13/3 Srinagar Hwy, H-13, Islamabad, 24090, Pakistan	50	3	\N	\N	\N	33.64504520	72.97853160	+92 333 5476222	\N	https://zaviyarestaurant.com/	\N	4.7	1829	\N	\N	\N	Open · Closes 12 AM	\N	\N	\N	\N	\N	\N	\N	\N	https://lh3.googleusercontent.com/gps-cs-s/APNQkAFIQKVCSHwa1MeYY3uMnu2z0LANILWc7Li1TabXLeAXZ8O1ORr_kRCk36EuHJNnYvozPNu5IvNR1_MQLWq7TZlC_UfgWq70NaQ0xG8kvjySBODRQXBNRy47cJ4kZjo308_BMxITPHUPPbvf=s1024-v1	[]	{"Outdoor seating","No-contact delivery",Delivery,Takeout,Dine-in}	pending	\N	t	f	\N	\N	0	\N	\N	google_maps	6e20cbb4-aab4-4a0d-92cc-17a3b5f88076	2026-06-25 15:40:57.809635+05	2026-06-27 13:46:25.658209+05	\N	{}
c881f8d1-1f90-423f-9f09-85b1cf764cdb	The Dome	\N	ChIJddDmZgC_3zgRGEwxdkLwm4E	\N	1	\N	Restaurant	\N	P3Q4+4QJ, View Point, Daman -e- Koh Rd, E-7, Islamabad, Pakistan	51	3	\N	\N	\N	33.73827740	73.05705860	+92 332 9636636	\N	https://thedome.pk/	\N	4.4	3427	\N	\N	\N	Open · Closes 11 PM	\N	\N	\N	\N	\N	\N	\N	\N	https://lh3.googleusercontent.com/gps-cs-s/APNQkAGF8l6RDpO3NNkGZFv63oKmzRBbbqh3uCkxCcWy-g856Az4ReHtqqzEljJtVnLgHt26NdDIvr4tXdZvSZFH9xXF9pm4KEtH29Krofvv2H9WB9ZFyr-wGQtnVzz_KxrtK7CA7PR48SRcjXyW=s1024-v1	[]	{"Outdoor seating","Onsite services",Takeout,Dine-in}	pending	\N	t	f	\N	\N	0	\N	\N	google_maps	6e20cbb4-aab4-4a0d-92cc-17a3b5f88076	2026-06-25 15:40:57.812455+05	2026-06-27 13:46:25.660453+05	\N	{}
79975969-33fe-486d-8ab8-cb23d3b3be6d	Basha Istanbul Authentic Turkish Restaurant Islamabad	\N	ChIJU_-xeDa_3zgROhMtL6nRMzo	\N	1	\N	Turkish restaurant	\N	3rd Floor, 6-B Bhittai Rd, F-7 Markaz F 7 Markaz F-7, Islamabad, 46000, Pakistan	11	3	\N	\N	\N	33.71937200	73.05544090	+92 315 4128888	\N	https://bashaistanbul.com/	\N	4.4	6958	Rs 5,000 or above	\N	\N	Open · Closes 11 PM	\N	\N	\N	\N	\N	\N	\N	\N	https://lh3.googleusercontent.com/gps-cs-s/APNQkAEpKVYvHXaXZLrW0dqFluxIp6az0vLRVfOG8Lh8e2Y4SbdKijsk1zlr39FBs_jEVJB0yQs_xQYKPbECDdat1oShZf7EKuTSTJPRWCiowEg1pCui5VtbRGaOWMHMwvrvV3Kx_MWoPA=s1024-v1	[]	{"Outdoor seating",Delivery,"Onsite services",Takeout,Dine-in}	pending	\N	t	f	\N	\N	0	\N	\N	google_maps	6e20cbb4-aab4-4a0d-92cc-17a3b5f88076	2026-06-25 15:40:57.815005+05	2026-06-27 13:46:25.661438+05	\N	{}
35b3ff42-19a1-4c4b-9bc4-e94273518683	Tuscany Courtyard Islamabad	\N	ChIJ9bernAe_3zgRLkngRjLHosg	\N	1	\N	Italian restaurant	\N	No. 4, Kohsar market, Street 10, F 6/3 F-6, Islamabad, Pakistan	12	3	\N	\N	\N	33.73553670	73.07834780	+92 51 8445544	\N	https://www.facebook.com/pages/Tuscany-Courtyard-Islamabad/213588912048876	\N	4.1	7280	Rs 1,000 to Rs 6,000	\N	\N	Open · Closes 12 AM	\N	\N	\N	\N	\N	\N	\N	\N	https://lh3.googleusercontent.com/gps-cs-s/APNQkAGRgF34uwv3YHK9uVzR3f_lK7AcUIx96O8bTFVFuWRv3JSElvKCdSS--GfLulAQIFQyqitWzzIRoVa82gY_UMCbHNyvgth0-akHMZ1ZSNl0CH0aZGL7FnNRu5XzAfd51Ec1CYsC=s1024-v1	[]	{"Outdoor seating","No-contact delivery",Delivery,Takeout,Dine-in}	pending	\N	t	f	\N	\N	0	\N	\N	google_maps	6e20cbb4-aab4-4a0d-92cc-17a3b5f88076	2026-06-25 15:40:57.817214+05	2026-06-27 13:46:25.662333+05	\N	{}
8e6134e6-631f-442c-a6a0-c76f88106b93	1969 Restaurant	\N	ChIJXV_Db-O_3zgRumwPJFsWMog	\N	1	\N	Restaurant	\N	Garden Ave, Shakarpairan, 44000, Pakistan	37	1	\N	\N	\N	33.68661420	73.07339260	+92 323 9691969	\N	http://1969restaurant.com/	\N	4.2	9119	Rs 1,000 to Rs 6,000	\N	\N	Open · Closes 11 PM	\N	\N	\N	\N	\N	\N	\N	\N	https://lh3.googleusercontent.com/gps-cs-s/APNQkAFmTOQ9SuuK3O5v_6mIdeaatye5XfTM0L6psBJcvkPB1cueiMLjpQs3gDB7niLslzhFWDjd8ED84S9hicStzGQ7L4ISJzdz-_Z9rJ-NH1jom76y98jbY6E9kuh4veXkkQ7EKjC6DQ=s1024-v1	[]	{"Outdoor seating","No-contact delivery",Delivery,"Onsite services",Takeout,Dine-in}	pending	\N	t	f	\N	\N	0	\N	\N	google_maps	6e20cbb4-aab4-4a0d-92cc-17a3b5f88076	2026-06-25 15:40:57.819257+05	2026-06-27 13:46:25.663227+05	\N	{}
b56aa8d3-da89-4e8a-97d5-647c51dc9e23	Howdy Islamabad	\N	ChIJFZcFfAm_3zgRYCi3elXT2sM	\N	1	\N	Fast food restaurant	\N	Shop 6, Gol Market, Street 3, F-7/3 F 7/3 F-7, Islamabad, Pakistan	11	3	\N	\N	\N	33.72607950	73.05783430	+92 51 2611182	\N	https://www.howdy.pk/	\N	4.5	19091	Rs 1,000 to Rs 3,000	\N	\N	Open · Closes 1 AM	\N	\N	\N	\N	\N	\N	\N	\N	https://lh3.googleusercontent.com/gps-cs-s/APNQkAHSMFu9NGTumt5EckHFCFNlD8jPVKFXblvi4P1By-YfRkPzr8pVvhgwIemH8a6HrBTzi6dndOpl5CYI9VqxKDn5y1x3i1cCgDj3I5enxY_2HE0mlY60ez67PHMf8LyE7avoraXF=s1024-v1	[]	{"Outdoor seating",Delivery,"Onsite services",Takeout,Dine-in}	pending	\N	t	f	\N	\N	0	\N	\N	google_maps	6e20cbb4-aab4-4a0d-92cc-17a3b5f88076	2026-06-25 15:40:57.821355+05	2026-06-27 13:46:25.664267+05	\N	{}
3daf6a17-06ed-4270-be29-9023dbd4eeaa	Khoka Khola	\N	ChIJcdxZm5y_3zgRBj_ryQ5SRVg	\N	1	\N	Restaurant	\N	Beverly Centre, Jinnah Ave, F 6/1 Blue Area, Islamabad, 44000, Pakistan	48	3	\N	\N	\N	33.72021030	73.07343120	+92 51 8444929	\N	https://www.facebook.com/khokakholacafe	\N	4.2	3585	Rs 1,000 to Rs 2,000	\N	\N	Open · Closes 12 AM	\N	\N	\N	\N	\N	\N	\N	\N	https://lh3.googleusercontent.com/gps-cs-s/APNQkAEUOt3Uw6xzr6Mpjrzskbgog4YiuZ26iaFEu30BGRACZHHXTyf9LbzmgBgpNdIvuwyAF8jhYmwu_BcGGesRI0m6rLdYBnNoVyMfusM6b1sizzctL2JWtpA3SaGpnDH28uS1Cfh9zQ=s1024-v1	[]	{"Outdoor seating","No-contact delivery",Delivery,"Onsite services",Takeout,Dine-in}	pending	\N	t	f	\N	\N	0	\N	\N	google_maps	6e20cbb4-aab4-4a0d-92cc-17a3b5f88076	2026-06-25 15:40:57.823678+05	2026-06-27 13:46:25.665308+05	\N	{}
efb35e7d-46e7-483d-b55a-7227273a9f90	Asian Wok	\N	ChIJSxMxNsG_3zgRn3z0Ti4Mxh8	\N	1	\N	Asian restaurant	\N	Beverly Centre, Jinnah Ave, F 6/1 Blue Area, Islamabad, 44000, Pakistan	48	3	\N	\N	\N	33.72018010	73.07382340	+92 51 2206988	\N	https://asianwok.pk/	\N	4.5	7669	Expensive	\N	\N	Open · Closes 11 PM	\N	\N	\N	\N	\N	\N	\N	\N	https://lh3.googleusercontent.com/gps-cs-s/APNQkAEdGI9J1vETItOUnfLmEBCeDPjLHYLbaL1xtEHNLZkA4_y4k9_tYTs88VGq0t2uJhCtShlRjLMP3bLkvsmnuoZ2KL_pwlfaMGJP7NSh90Qs9ZSZ4hFcSpgfvKdKfa_u5stJ2qjZ=s1024-v1	[]	{"Outdoor seating",Delivery,"Onsite services",Takeout,Dine-in}	pending	\N	t	f	\N	\N	0	\N	\N	google_maps	6e20cbb4-aab4-4a0d-92cc-17a3b5f88076	2026-06-25 15:40:57.825867+05	2026-06-27 13:46:25.666929+05	\N	{}
2844c4dd-6ecb-4a06-823d-9beb3bad4415	Saddle Room, Islamabad Club	\N	ChIJlyz_9BjA3zgR-cRwyR3CIEE	\N	1	\N	Pan-Asian restaurant	\N	M4V5+VVW, Murree Rd, Shakar Parian, Islamabad, Pakistan	52	3	\N	\N	\N	33.69474470	73.10970600	+92 51 8435650	\N	\N	\N	4.4	934	Rs 1 to Rs 4,000	\N	\N	Open · Closes 11 PM	\N	\N	\N	\N	\N	\N	\N	\N	https://lh3.googleusercontent.com/gps-cs-s/APNQkAFa4BB9Kp2iQAojX2apJ5hRTamXSK0zeN6aMuv_VVhP2by12B14OtK8gRNkaOIXYnjB3gdHfdQh_F0VAeaDSE7-N9unPppoxX-JVetJTH4Ie_RrahBrZahOSYbErA-bewJ8lLuC=s1024-v1	[]	{"Outdoor seating","Onsite services",Takeout,Dine-in}	pending	\N	t	f	\N	\N	0	\N	\N	google_maps	6e20cbb4-aab4-4a0d-92cc-17a3b5f88076	2026-06-25 15:40:57.828006+05	2026-06-27 13:46:25.671414+05	\N	{}
89268880-2d79-4892-a998-ab8470b5afac	TAKSiM: Islamabad Turkish Restaurant	\N	ChIJe-tDA7q_3zgRr0wASvDZkkY	\N	1	\N	Turkish restaurant	\N	Block, E Super, F-6 Markaz F 6 Markaz Market, Islamabad, 44400, Pakistan	12	3	\N	\N	\N	33.72967100	73.07601490	+92 370 5473463	\N	https://taksim.com.pk/	\N	4.2	2157	Rs 1 to Rs 6,000	\N	\N	Open · Closes 12 AM	\N	\N	\N	\N	\N	\N	\N	\N	https://lh3.googleusercontent.com/gps-cs-s/APNQkAFQ0SVVaLG2epVoUNnzfp7RHcFFjecrsKFweHfCkPQKuXZUzqYa0NBnHNiTPanq6k5q-B8JQmMV4J_70iSom9A6lTg5M1Htd5h4-Gkz6Pjg2cpCjT8Mfpf2ly0n6NjiGRSmZVkRGabL5vg=s1024-v1	[]	{"Outdoor seating","No-contact delivery",Delivery,Drive-through,"Onsite services",Takeout,Dine-in}	pending	\N	t	f	\N	\N	0	\N	\N	google_maps	6e20cbb4-aab4-4a0d-92cc-17a3b5f88076	2026-06-25 15:40:57.830943+05	2026-06-27 13:46:25.673152+05	\N	{}
099ba19e-68da-4d83-b671-91799a7eb795	Tree House Cafe	\N	ChIJzcYZZQC_3zgRrv2vqZeJQ3A	\N	1	\N	Restaurant	\N	Rana Market, Street 16, F-7/2 F 7/2 F-7, Islamabad, 44000, Pakistan	11	3	\N	\N	\N	33.72134450	73.05091290	+92 333 1529746	\N	http://www.treehousecafe.com.pk/	\N	4.7	666	Rs 1,000 to Rs 7,000	\N	\N	Open · Closes 3 AM	\N	\N	\N	\N	\N	\N	\N	\N	https://lh3.googleusercontent.com/gps-cs-s/APNQkAG0ABbLbxrtl2P2e2jKWXrmvHpPXn5Ddd2tapCwiU8dSKrUKYwF5gcNY43B_NQ7gsT2xYbNjvfs7DaxJhX8tcoCWauINujybeWdI6zmWK7EHZD64rZWerNIKh0rNBxLMqOtj-A=s1024-v1	[]	{"Outdoor seating",Delivery,Takeout,Dine-in}	pending	\N	t	f	\N	\N	0	\N	\N	google_maps	6e20cbb4-aab4-4a0d-92cc-17a3b5f88076	2026-06-25 15:40:57.833945+05	2026-06-27 13:46:25.6745+05	\N	{}
7137d9d4-fcb1-4cf7-aaa0-52562dbe4118	Zeytin	\N	ChIJA_ehxI0_sz4RPxf8LaZmcJc	\N	1	\N	Turkish restaurant	\N	Safa Residency, Shaheed-e-Millat Rd, Maniya Society Maniya CHS (MCHS) P.E.C.H.S., Karachi, 75400, Pakistan	1	1	\N	\N	\N	24.88082330	67.06234020	+92 331 0223333	\N	https://www.zeytin.pk/	\N	4.4	7839	Rs 2,000 to Rs 6,000	\N	\N	Open · Closes 12 AM	\N	\N	\N	\N	\N	\N	\N	\N	https://lh3.googleusercontent.com/gps-cs-s/APNQkAEim_lsfmBGKXLXFyZbSPdKZd0liCNGB4s5Mcsb4-0O1DpJ6_h6cqv2yjTa5OhxvI6dcxKmKQalBkctu0PKK5Jr-9_bX0NzBH1AWDEOj9tizvUiejDYYyohJ6VkLKlaFvkcNKu5=s1024-v1	[]	{Delivery,"Onsite services",Takeout,Dine-in}	pending	\N	t	f	\N	\N	0	\N	\N	google_maps	\N	2026-06-25 15:33:58.278528+05	2026-06-27 13:46:24.937758+05	\N	{}
7df34366-7b5d-4e15-8015-3b6dd01e286a	Bella Vita - Tipu Sultan	\N	ChIJvWgwrPc8sz4RZuYF4GvAYt0	\N	1	\N	Restaurant	\N	1A Tipu Sultan Rd, Karachi Memon Co-operative Housing Society Jinnah Housing Society P.E.C.H.S., Karachi, Pakistan	1	1	\N	\N	\N	24.86611100	67.07781930	+92 21 111 435 286	\N	http://bellavita.com.pk/	\N	4.0	2870	Rs 2,000 to Rs 3,000	\N	\N	Open · Closes 12 AM	\N	\N	\N	\N	\N	\N	\N	\N	https://lh3.googleusercontent.com/gps-cs-s/APNQkAHa1zTj0q_ALdr87iPPo-1cBjhUA5u9ekIsOwftiqVesLuPVvFGj0IP6xLVjML_3R0L9arVx--ImAifdee2fnDT_EOhsyWBYUuAK1o-uyqzmhZWBd7_IsCw3ZQXLQCF0SpSRSgRHA=s1024-v1	[]	{Delivery,Takeout,Dine-in}	approved	\N	t	f	\N	\N	0	\N	\N	google_maps	\N	2026-06-25 15:33:58.386231+05	2026-06-27 13:46:25.637072+05	\N	{}
df17f1cf-0be9-4023-85b1-3c1f1c3882e9	TLT - The Last Tribe	\N	ChIJOZZmLgC93zgR_Vukx-uuOlI	\N	1	\N	Restaurant	\N	Level 5, The Olympus, Markaz, F 11 Markaz F-11, Islamabad, Pakistan	49	3	\N	\N	\N	33.68436450	72.98794310	+92 51 8776669	\N	\N	\N	4.8	6725	\N	\N	\N	Open · Closes 1 AM	\N	\N	\N	\N	\N	\N	\N	\N	https://lh3.googleusercontent.com/gps-cs-s/APNQkAF_qzf_nE_MeORw7DQ1C0M-hofWZ_ABANWflJ55A4_EQBGNdqVHLMI7kSwtfMqPJ_0XOrjoTfa0qX4UeXmdGFIYXROdmh1Rlsz3ExY8VqeLijWv0v3LTjxYZ6Lr7AKWYNKDCfbI=s1024-v1	[]	{"Outdoor seating",Delivery,"Onsite services",Takeout,Dine-in}	pending	\N	t	f	\N	\N	0	\N	\N	google_maps	6e20cbb4-aab4-4a0d-92cc-17a3b5f88076	2026-06-25 15:40:57.806845+05	2026-06-27 13:46:25.655438+05	\N	{}
746beb4f-4ffb-45db-b039-1e9606947e45	Bistro Noir Islamabad	\N	ChIJAVdjtfC_3zgRVTkulHVBSC0	\N	1	\N	French restaurant	\N	Gol Market, Street 4, F-7/3 F 7/3 F-7, Islamabad, Pakistan	11	3	\N	\N	\N	33.72632220	73.05764510	+92 300 1888768	\N	\N	\N	4.3	2443	\N	\N	\N	Open · Closes 11 PM	\N	\N	\N	\N	\N	\N	\N	\N	https://lh3.googleusercontent.com/gps-cs-s/APNQkAHDv4RsGg0eSfBmdzUlKvQzmF2DqdLlj1bunEhN7vweIFyov92dl0KeJrOOxnThqRvxJRRVV1p3-yvppWpyr6MtI3IuCrKplfz7RSVIS4iCOqNGjJbpI-9Z15kSwTx23LkEkeZY=s1024-v1	[]	{"Outdoor seating",Delivery,"Onsite services",Takeout,Dine-in}	pending	\N	t	f	\N	\N	0	\N	\N	google_maps	6e20cbb4-aab4-4a0d-92cc-17a3b5f88076	2026-06-25 15:40:57.836465+05	2026-06-27 13:46:25.675589+05	\N	{}
5e61800b-96da-49df-927c-2b6ba985d025	Truly Asian Cuisine	\N	ChIJ7SNdjii_3zgRhjPeSJ0qrRw	\N	1	\N	Pan-Asian restaurant	\N	Office no 2 Rooftop, Potohar Plaza, AKM Fazl-ul-Haq Rd, Block D G 6/2 Blue Area, Islamabad, 44000, Pakistan	53	3	\N	\N	\N	33.71952950	73.07649900	+92 307 3337333	\N	https://www.trulyasiancuisine.com/	\N	4.9	489	Rs 1,000 to Rs 2,000	\N	\N	Open · Closes 11:30 PM	\N	\N	\N	\N	\N	\N	\N	\N	https://lh3.googleusercontent.com/gps-cs-s/APNQkAFM1ij9xR0qk5AQEuwApi7Qr-HtErrX67K90OyLMko_dp_4fr1BwYucLHNbot6Jczo4OX1KFdlGHPCzLez5WYroMRTurcKkd6UPlP7Ip-XUhecYdhmVEQYlIw6VC53E8AgLoY_v=s1024-v1	[]	{"Outdoor seating","No-contact delivery",Delivery,"Onsite services",Takeout,Dine-in}	pending	\N	t	f	\N	\N	0	\N	\N	google_maps	6e20cbb4-aab4-4a0d-92cc-17a3b5f88076	2026-06-25 15:40:57.838598+05	2026-06-27 13:46:25.677683+05	\N	{}
99968377-31f7-47a2-ae25-ccc1402854a9	Islamabad restaurant	\N	ChIJLcGx8bvq3zgRxxi2R02fLfo	\N	1	\N	Restaurant	\N	M4C3+7WG, Margala Town, Margalla Town Phase 1 Orchard Scheme, Islamabad, Pakistan	54	3	\N	\N	\N	33.67069680	73.10482040	+92 306 4650507	\N	\N	\N	4.3	609	Rs 1 to Rs 1,000	\N	\N	Open · Closes 11 PM	\N	\N	\N	\N	\N	\N	\N	\N	https://lh3.googleusercontent.com/gps-cs-s/APNQkAG3K9pjZLMbzoZ0gpYx4qH4UeZfJ8AlavTHBvCG-OuNG6pNEDKK_CFwQd-ydJRaiLQD-0ell7fJ0Pa2jALiDIIZ8SqaJMYbDrP6Z2XJ-NwfasTxRIilFg0f1A58w7rT6ZEr99-MvfdHxiWm=s1024-v1	[]	{"Outdoor seating","No-contact delivery",Delivery,Drive-through,Takeout,Dine-in}	approved	\N	t	f	\N	\N	0	2026-06-25 15:41:42.881693+05	e96cc951-24d3-4f77-94c0-318696ad390d	google_maps	6e20cbb4-aab4-4a0d-92cc-17a3b5f88076	2026-06-25 15:40:57.845186+05	2026-06-27 13:46:25.67948+05	\N	{}
7d0b395f-f608-465e-9a0e-56d464043fa8	Doka Mocca	\N	ChIJ3Qf0Rci_3zgR0quEPU_49mE	\N	1	\N	Restaurant	\N	17 & 18, Ground Floor, Crescent Arcade, G-8 Markaz G 8 Markaz G-8, Islamabad, 44000, Pakistan	55	3	\N	\N	\N	33.69874390	73.04842830	+92 51 2282014	\N	http://www.dokamocca.com/	\N	4.3	2440	Rs 1 to Rs 4,000	\N	\N	Open · Closes 11 PM	\N	\N	\N	\N	\N	\N	\N	\N	https://lh3.googleusercontent.com/gps-cs-s/APNQkAE0nm16WDUjdV-f4gq58U5CnqsPlHKpQD_fnBNvsHEtuYaOKz-dKn544av0MqiDb0Z9zy1P3_v6wCIsp4J6IzImunPIeA0INntUGNzxOYtkq6HktLp-OuEkdTPLI6kooLq-Duk4hg=s1024-v1	[]	{"Identifies as women-owned"}	approved	\N	t	f	\N	\N	0	2026-06-25 15:42:02.314289+05	e96cc951-24d3-4f77-94c0-318696ad390d	google_maps	6e20cbb4-aab4-4a0d-92cc-17a3b5f88076	2026-06-25 15:40:57.842885+05	2026-06-27 13:46:25.681301+05	\N	{}
67b87b6f-3a38-4824-82eb-d80e83759f76	New Kabul Restaurant	\N	ChIJ____O6e_3zgR6Ogs9J-EnWE	\N	1	\N	Afghan restaurant	\N	Plot No. 17, Jinah Super Market, College Rd, next to Hill View Hotel, F-7 Markaz F 7 Markaz F-7, Islamabad, 44000, Pakistan	11	3	\N	\N	\N	33.72123700	73.05606590	+92 51 2650953	\N	https://kabulrestaurant.pk/	\N	4.1	8902	Rs 1,000 to Rs 7,000	\N	\N	Open · Closes 12 AM	\N	\N	\N	\N	\N	\N	\N	\N	https://lh3.googleusercontent.com/gps-cs-s/APNQkAE2Q1wY11j1SVcWkk6YaoQiNPF6sWsN7E3xkOsIDrYAC050GgnSQFvc_z9ngW0glYIw3_9JnquPz5bA1qsophtT35pLdtLKIvw2l3LhemE28uggmbuij52arEPC0DHHlkUxeDZ6=s1024-v1	[]	{"Outdoor seating","Onsite services",Takeout,Dine-in}	pending	\N	t	f	\N	\N	0	\N	\N	google_maps	6e20cbb4-aab4-4a0d-92cc-17a3b5f88076	2026-06-25 15:40:57.840587+05	2026-06-27 13:46:25.682182+05	\N	{}
ceaadda7-dc88-4fcb-85dc-9391d8df0172	terraza	\N	ChIJjb8PGAA9sz4Rfl7LoZzqna8	\N	1	\N	Restaurant	\N	F 35, Block 4 Clifton, Karachi, 05444, Pakistan	4	1	\N	\N	\N	24.80916810	67.03353130	+92 333 8377292	\N	http://terraza.pk/	\N	4.6	1486	Rs 2,000 to Rs 7,000	\N	\N	Open · Closes 2:30 AM	\N	\N	\N	\N	\N	\N	\N	\N	https://lh3.googleusercontent.com/gps-cs-s/APNQkAGm-3MG79Iuqz1na2OgREzjMbhIdiIqYZuXiPJ4vo5rN8zmzwVQ1H2Va3clfK8w9TDY2N-WX0UjQAB3iy8x_KUGZslOnpf-CfBTviyXIdkioK9o6bkYx4vdJlfEe6v4LBX9fSnv3UpSRDY=s1024-v1	["https://lh3.googleusercontent.com/gps-cs-s/APNQkAEcBRsPCnIIcimRGmFChMdxHwU3sqXY004p097tqklcVUPD5Q-rEPkGFDrQ1Vk33LOEQF_uJZKXCbSTUk3uUJuyxarFKrJ0pLGqMM5ahQvU2E8_Y54cHMUAeZMRU75TXxqPAsJXrrNJ4Vpt=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAFZDvlwAef6JELI6_3aaD9yI3EL-fZdze7_GT8D-QeknW6RIINsd-kfZ8iFllvzXEQ3NM4WoWyRtGBrdY1BYqf9XlgitWKce1H8cGLWqsUubjrxyEwyRBr1hXs6rY8ei63wMBLtzxS5g-mY=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAFolEiYK78k_qhYOYBwY7t8GSkBaKZJEA0Qh8uiWVp-4Hph4RYjcjIrcx0Ls5wbS8Nvepua2wutfumF6lLF220fbGqB2eDy_587YN6tZAHJhDhwFih8gnb-2jtBL6TupHV_sXDP9d5wPimQ=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAFiRuF7yCjog62cR3UGhXOu7eDVLy7E9Ln8C9xZrKg0TAAjl7HraM7aO3zXVUDC2z8S3c_98M1ijpb94d27JAOUfETcOf80zxpUuMdxeZISmKVT6AdBiTxD-1jJLq_hns4IOuHExIFEWef2=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAGDpd6CiHm_XVXKvNIEdAhf8oocG1rBhzh04JzFZtOdoK0aS_E9MrnaZfmuPDziO8AFIZ9V_h6bjNlGu26pxJwLVT1vAyFHKCyhgdco4f6nCboLvYxVnF5iBRKMdti62jDA4VPNR3iLF9C-=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAHBXIz5FekA-IS00nd6DZbFNk-YiYECSU2g7mR3dgXRqwkeG5wsIdLM7WthGUPZZx4kCVho9VO6TBipwr4AsjTjzXaJNnwIxjKGQUcoKdnDoq9iW-4yREIWKEWToyX52CoWs_XlGZ761L-p=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAGU8sQNEKcDmr6VX9LChKWxCe2GQH7y-rCRCrbv2CqKHQ2Lup3EDrr-vDQiadfUp_q-hOAx5qirbRR2LNx3u6Z5fyqVmqdVsZIHLW0BErXvxcSvNhxzX2cjVKsHyV2xy0-d2Ux25PZOkg8m=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAFA3oVNiclVmy29mrHfhrfw-v4AcipJ7zEGNdU_stzOICitoEhlXocqxj5psjv1OzKKur4G1WmqzqDJ_eKH5UXWGJWih0BU6x5gI6FZEVsjlBib6GeiNUJxbWAFBbNukHaxzdF7oXkAuTfH=s1024-v1"]	{"Outdoor seating",Takeout,Dine-in}	pending	\N	t	f	\N	\N	0	\N	\N	google_maps	f43cddfa-65d3-4896-bd4c-a6b6c6f33055	2026-06-27 13:53:33.680409+05	2026-06-27 13:53:33.680409+05	\N	{}
a2ca3291-17fe-4947-aae6-4f12b1e2990f	LalQila Restaurant Karachi	\N	ChIJ226CXrI-sz4RfSpsoO8Mg_g	\N	1	\N	Buffet restaurant	\N	10/A, M.A.C.H.S, Main Shahra-e-Faisal, Mohammad Ali Society Muhammad Ali Chs (Machs), Karachi, 75350, Pakistan	56	1	\N	\N	\N	24.87227550	67.09077540	+92 21 111 525 745	\N	https://www.lalqila.com/	\N	4.5	30438	Rs 2,000 to Rs 4,000	\N	\N	Open · Closes 11:30 PM	\N	\N	\N	\N	\N	\N	\N	\N	https://lh3.googleusercontent.com/gps-cs-s/APNQkAFsEviEr8-YtBgu7jE5lzUGCDGTY1-RRrlyPPVe-jNod3QHcGm8bfKECgT0-8Lkd5SNyT2YGJfh7rlObSrgYsjhwH-pJljgiiLMkLI6tQbWK4dr63P-qmNIOfEDhVCC6qmzYsxc=s1024-v1	["https://lh3.googleusercontent.com/gps-cs-s/APNQkAH-caKJ0wxBGdVz9mN0okxTBf5hB9SzD0CqBZOqmtp19kfg1pXDf2If8QAGPXX6aZkyJomrMOV6YEeWNEY53dLPj8O3QA5xXDSV5VVOTFM_akqnRha4P_f0NHgNapPPfBLJDy-4urfn5Xo=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAEjgDQ5NbitaFgDBwCgGvxl_R32R9uoC9E08g_4SjZzcTnYDiucMn8w84Cc_qxf0_ncBf-lo0lKa4k_AXMTtxUPUJ5sGe2AskXbD_ZoWwPsTXls17eoBLs5lJ6L1V9DFs_hKI4OBe5e6yH_=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAGLRlNp4ElYU6yY_pXwZT1P0dmF-xMSRlqhnavQMCelBlVAL3CJ1j1ZCLqIlKc09KGheFe-0ATCDfKjQ1O2r7MJd2ehNwYf-BSXKJldTo63AIHcl0yw8z5wmkkQVPbVSWoX_1hk7A=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAGuemKOwiY4TEiudiMnGWP8_QzdL-lXJgp7vo1o2zhofhzGJ3SHtkKSjLYgE-42-HdPYDI4MflRlFet4wlYDj-5Xxyt-FwjSJSf9Vo-jALxrI8TBpmWHDL6BOHPcSAVIml-liIQ=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAHGmAWdv7YyBN03kCOjxs8TwVGTFWiG1I09Qq6xGM-C0MKax7eMvai6aoI9djAivd7Kf8e34YkSDOlUSysJdcUQeW0mGEWpFhdZUlRh-PLnkIgf47USeFIs_poclkwSC4WSS7ik=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAFDsO3xR8aKjWa7dJWK-_1qN5ytL6LeZrpLFTaaeidt296iDvRRm13JWX3phS1DtjhQpoN8Gf2NvP2mTd8JYCCTiiQPwYIi1WurB4n1SNdZZHWFFfDFubtpSeLZh2NsN96_TBYtAQ=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAHVIqVBaZ3qoJXbeXgsbAgcxXezvMLGBAlRnKlapGUENpP_YipTaW4Ms6ff6lj-vLBRyLjslVY3lKbl2GpSu_DXrXTFEfbGrFS6hGJEQZdwJb4kVcM8G8Ibcq9TrSLSwj7TfpKl=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAFTQegyXjQZHzCd2trVWX6yHo2t5V_MdqXOn4AUkMdqZlYibMvPPZnb_8C3qL8RC7wLR0f0NfO7nCvb696jBp55S1oEm3aeqMQGrQPE_dIvWuRekWiv9vhPSGalk14pI8pEdBQ=s1024-v1"]	{"Outdoor seating","No-contact delivery",Delivery,"Onsite services",Takeout,Dine-in}	pending	\N	t	f	\N	\N	0	\N	\N	google_maps	f43cddfa-65d3-4896-bd4c-a6b6c6f33055	2026-06-27 13:53:33.839183+05	2026-06-27 13:53:33.839183+05	\N	{}
5883b2d2-d3de-433a-8702-1d8ade38a10c	Côte Rôtie	\N	ChIJ__9vDIk9sz4RQzqVPUJVCV8	\N	1	\N	French restaurant	\N	Plot/St, 1, Block 8 Clifton, Karachi, 75600, Pakistan	4	1	\N	\N	\N	24.83332010	67.03622120	+92 316 2882880	\N	\N	\N	4.3	2215	Rs 2,000 to Rs 8,000	\N	\N	Open · Closes 11:30 PM	\N	\N	\N	\N	\N	\N	\N	\N	https://lh3.googleusercontent.com/gps-cs-s/APNQkAF1AgVmob5E1rbDxVLuRveDji4E9xyH2EQXgPQKxyLOYQ3G3eUaEIocmBy_F2gnvB2ylUKWA9WVOAWWakGjBp6oL0bThx7F25XgI7p5RG9iVfl977fg-R94VwbqFLVbg-wwJl4x=s1024-v1	["https://lh3.googleusercontent.com/gps-cs-s/APNQkAG6iYIe4ByHiu3wTpktKBr5b2iBCzb-kFR70OEeugMEciUZHyJaldFReGW9wNLKf7F1ye8SQkcr1LSvOJbnCOhNUXv6E9nXaHXy2XJb-DHtomPuQ-33XeROWFSwLHco7flPxPZj-PjKaX2G=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAF8m0zsRfabeJ6Z1_vyhlS-GptYY-ioLn09fYcf3jmOxM8VSuVvRUWaSXaYkcEd4TTXlCnGgSgMRr9nyiYR_sGxuPGvW141-kmTz1KjGlun5RTpVuDknWcFZq8Dzk62NMWvyS1T3-w13uTw=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAH50HbN_fLpt_Xi_VoccLEDIHp5EpF6z6SzlLpGCxMuCUABQINU5Qyr4Dcc0eyt0b8M7XYaVnSs3xuglTChxdwRLPyfoNqfVtKEVV3ZqFDI0zZKNsrLCFFDNC5IPFMjYCX-yFSML5U-ac6Y=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAHkVkjxQHqEK7TNTXGkW4kPqvDpIaEgeXUbaONZbtODF_oe1pB8nflmYjtGOZpyi3UNE6MBmaDDLKle7A3dbW5b7xFRY0Zn8xXs3wGENmrUxgHgNSEDb3xR_gxF7h50Gie0xLV74-850pA=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAEnKS2qxXW8pmNfG55oVWVCTxxb7TS-QPIq_acbnLeh1SNLMJipMRHbON1ZFJFFFo8z-mYz_kyjsz-GjbJ9JLsF5FaTzcorCFY6ur_j0FAd9fG-y--8EkvxpRWAl2glI8nH0-oAGUKn0o4M=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAHej8sFyBik8I-rSukHCyLr-Edtbbvy7nx8hOjdd0KPuTAAX50Zv9yfbM-t9NbVl9vq8Uem7ZPQtEvdcxXcD_mJYr5An6SISthSBr-eMcDnvV8u4WLUtiCxGAAU2rf_0kKVjA4P87tVIPeX=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAEf_pW2DnLUCuWSkk9p-SpFNENKT6uN6MbqkmxInwayTmxQ3MW3ZO9Ygw_vLnIvJYLqv09OHmRJd-EAAmI-P3-G-bsuD4CA6_cVeaHddhfFyqOHBkWblRgsnuNvJhi8E12eYJsNylDHgzA=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAHTApSsD-mxBrYW4xebfw_MTk2NQCy-3130IHI1hsBkJ40TjyCeIYRnYOrOsq_A_uUMhR-PEVMbEAYeAmtSYBYveKjSe-71rct_hSA8IQJkcrGxHaWk-OrcLS7jrUzvkJdWhZIl=s1024-v1"]	{"Outdoor seating","No-contact delivery",Delivery,"Onsite services",Takeout,Dine-in}	pending	\N	t	f	\N	\N	0	\N	\N	google_maps	f43cddfa-65d3-4896-bd4c-a6b6c6f33055	2026-06-27 13:53:33.853238+05	2026-06-27 13:53:33.853238+05	\N	{}
70a3792c-dd64-48a6-8e51-980851026f71	Jardin	\N	ChIJl1adsDY9sz4RppQSu9Ps0gg	\N	1	\N	Fine dining restaurant	\N	Plot # 36-C, Ittehad Lane 6, Khayaban-e-Ghazi, D.H.A Phase 6 Ittehad Commercial Area Phase 6 Defence Housing Authority, Karachi, 75500, Pakistan	3	1	\N	\N	\N	24.80138520	67.07260700	+92 322 2527346	\N	http://jardin.pk/	\N	4.2	2701	Rs 2,000 to Rs 7,000	\N	\N	Open · Closes 12:30 AM	\N	\N	\N	\N	\N	\N	\N	\N	https://lh3.googleusercontent.com/gps-cs-s/APNQkAGDVtXsFbxqeMqA72x7C-LffF6YPaIzkYKj97nl__d2mSAeUnn0AZVWtkdfl-yr778HlserqepVmnzyd2dLkCAEY3Dqe9vO__TsrjhDwbteO6Y9hSa5Sz4AA_u0nLVyl1tiu14ieZPPnO91=s1024-v1	["https://lh3.googleusercontent.com/gps-cs-s/APNQkAH-kG1HEb_2hINLy-pces7m1Mu8HXDXwq3Dbq9Dn5H3g8Hc5fQgHpf5kBSctnAeD_Q-PzaVOg2sJ1bzWpe6L3xUT-4OFTyX71RprGHAd1ZfJMb19hHnXu67da6GyOMNxscUhLRG=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAG5KJzSmXkyc69GxD0qj5jYh1TNkUoulVdKGvBi30CeszPPpOilTBy81b2fyYa2QdH3o9TCjkkg88GpyG_cDePPut5k3xEjuO2bAiXBihSxthRzwAPS6SchOOO2S64cx-C8VFZtSw=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAFY0wzdq6Zl02RkhpnQHCCwVKk8Fl08m3v69iSg1BMZlt0E3l2morazlGWGJ_hOp_DtcK4IDnXIIsbo6MUaqyfO_UNkuhWA5wA9ixUtN4qxSyZZoANB3o3cruFXzePVViJ9Mc4q=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAHK-yHhxIQp6AdUxjfI7WeQvLsPqNJMifl4q6Sy0yeikEc-ZjSOvlZOTUxbScwzMqckUQ_3TLt0uCRFr_g47EHXEcBqlUzAzKjhS65k2INHs-9FHW3is_SzYJcLJsST995PQP3G=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAGQ0C6UyDtjUu1tXqE2HYCESl86e2i-U_c7TPYyplPlaeOCxjVsA4bG7ud6ZspiBTx8i0jmr1lpN-piifWkHGvOvNorf72dzGLCKzS0zTQdfCe-PodErQZ87z9ntEhGKM1MmBo=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAGmUkrqjVFjMeGdUAscEufoV-EQyjUdk9rLttv42x2-ilB-G4A3wRag7o4DiqDXPj75w7GPsUa-H7-J_nUMZrOx7VkyZzxqwDMTM2qu5YZ132h39OZsiXlnQdRUA8hXjQzSuwHn=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAG-vzLU2dPiQ_BOFbhr869aE6bQl6kaj607TlF5cZyNHYxD16anu9BbJr3QY_vAMLWYRpQpB46VkOVijnW4YZotL0JK-tlolkw6letyM9HPLqrMeknCUIWEr2r5svFwryH0Z7o-dA=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAGnKf3pw4fUJfHFhkjclHryJWSEqPOMiQTr542u35-9KMK4Z6utp8TLg0KkWp4Fbk1KX5zqPx_Rhp9egkoYYKP_j61ELcYJRezzz7s8xkcFJCiUpzhYz2wGu1EzQimUg9RppbTZhA=s1024-v1"]	{"No-contact delivery",Delivery,Takeout,Dine-in}	pending	\N	t	f	\N	\N	0	\N	\N	google_maps	f43cddfa-65d3-4896-bd4c-a6b6c6f33055	2026-06-27 13:53:33.864251+05	2026-06-27 13:53:33.864251+05	\N	{}
3a599d42-4744-460e-b846-1709ad2fd846	Big Tree House	\N	ChIJ7zOh8hk9sz4RS6_zRAN20Sc	\N	1	\N	Restaurant	\N	Bungalow No.76 Hatim Alvi Road, Old Clifton Rd, Karachi, Defence V Karachi, 75500, Pakistan	4	1	\N	\N	\N	24.81801900	67.03396920	+92 300 8870999	\N	https://bigtreehouse.co/	\N	4.0	2698	Very expensive	\N	\N	Open · Closes 12 AM	\N	\N	\N	\N	\N	\N	\N	\N	https://lh3.googleusercontent.com/gps-cs-s/APNQkAEt3o7DPNobDmXa99JkhINaELfqiJ6xVer4EF4y24kdMYHjGMzl0oMP1kBAoEof_fJvfeRkKZmDtuwS--FmdQt-V_NVVczvfXS0TxsyFWnZUkMcaa-DKZgFtQzi4Wn0ez2ciYc-=s1024-v1	["https://lh3.googleusercontent.com/gps-cs-s/APNQkAH7HWiyoT75WKwxUzAWuj6C2kmCMVfIRdeB1YWrdwy8yhLucqsku7qzKbtb5FIUH-qca2sj6yABVSA6VNUY4qK5LXxo90dHm3sdm9YDETh3Zk39DU-UIeRYfC-AMC0deihCzxnY=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAE8J_gL3AP5STexNIT5eW7-SyJXgXTdAbYO_UTasnz-e7JhATDjxYoFSMrUhLY1jGZuerpR0uONTetuFvcGbYdH48z79Y-cel3FZbLKyZlCKvaN9UT8rntbhOCXn4tCaUxqp10s=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAGUA_9bhUcCe8ZgOKv071CvUiI5OnqbSAdKPheqUMYr7nqNkTccOHLIjNV64kCpIzpNMZIVriQy4I1sjxM7qZJvAva09FBm553gETGZ3WljByn1PJcDZbsonZSJ7rcWi3I1ppfG=s1024-v1"]	{"Outdoor seating","No-contact delivery",Delivery,Drive-through,Takeout,Dine-in}	pending	\N	t	f	\N	\N	0	\N	\N	google_maps	f43cddfa-65d3-4896-bd4c-a6b6c6f33055	2026-06-27 13:53:33.884258+05	2026-06-27 13:53:33.884258+05	\N	{}
62d21fcf-9ead-4a48-a208-1e83f138917e	Cafe Aylanto	\N	ChIJ1QJhxQk9sz4Rur5qu8epPH0	\N	1	\N	Restaurant	\N	R23J+MG2, D 141, Block 4 Clifton, Karachi, 74600, Pakistan	4	1	\N	\N	\N	24.80416360	67.03128060	+92 307 2952686	\N	http://www.cafeaylanto.org/orderonlinekhi	\N	4.1	4504	Rs 2,000 to Rs 8,000	\N	\N	Open · Closes 12 AM	\N	\N	\N	\N	\N	\N	\N	\N	https://lh3.googleusercontent.com/gps-cs-s/APNQkAEx6YjJHunfQpbyaG2QGXpcqzBi8Lgy2_1ZTnJu1n04sV3qjehFUX0NsHSL7DecD92uq5JR2eYUvEiH4vCfgGwwNIMm1T38iyGQvh3p50uJxLzi8z1Qa1zGvYkOl8-To2CtAIg2aA=s1024-v1	["https://lh3.googleusercontent.com/gps-cs-s/APNQkAFPwXGodHR7y-auIuzAKybZPlfWkDC7Vey-awz-YfWnE2OU67P2Bvi4NlpiYjYSGuea5h2rFu5B0ttQsYAEcjdn8xC715Irm_95M-GXUWP2uXEzYSqy2t4b2_mOfs7qZS4W2qMR9zXfuX4=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAFhW6ziVoWVLig3Jx1LclCisrCSN76GW1GELZa66LiDVX6XsTO1U5i_58v8Wdgpj4PasrI-kB6Sk1V56I2JSNTCi0vheGTg9blgEDIw_ZlQjAJimrKidrIhpFkCicrbyH30mteW=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAFZQ5C5FQU3V0mTsCh9t7Fi0VQijZYT4s67M4QxHod-zMZHEp1_Xd_NmR4S3NAeVgRaN--Ak5hNIjWygxfRvUuQHG-AG4iJgwavmEcowUSzYvGiahRrFMpHHcBjHzrdu6Ngi96zJg=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAGWTKxUNE0h0pDwYQ85lT9bMHUTFbJfK6JbVcePi_3oyc1IeSOeMDSdxs-E3sseQ3atwYrJoC2nD0j0VISpZ7IB7b612iFI9ZUjVG4dW0q1vFg5CaCZqA78dQiPy_Uk3AL7PyDH=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAFnuf74tFmp9fomti20NPTGrMSdMMNUc0rqk0el-x2u4yg5YTJAjhUnGRbAReQ_bXvm18bKnBGc9PgLdVp0ghgyhV0OyW5vdQh3ozM0VckfcVoRzwxqk94s8szbWM7VV5Iq0bY6=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAEOcSrq_4PvtUwu9z_jVHWSS2m3MtKk4QFj2Of_4jCDXo0EuH0AWbhG52cG9YK2o3Abl-9iRf67aBYpKhPWeDquhOyEBYoupgTxeel_2KoGBdeNT3zQl_UOX4NJuQzYWABzOzEqEyvR_YI=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAGn9QACHQm0l_Obd2s-0OEwB1HydYOY197BcqTHNwUxlODuzgEcI4tl2O_k-22tc-N0nHjO22ygYWnAfLP_2Bmjv6_49uSucy6aCJJab9hTdXjO3djw1ZmtGeDNmANamzkZMdeQrM8dQDo0=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAGG0nTNLfrnmrfwC84hxWd3a_xgVd6lwGgMXGq3N0Lum-H2I_T-mBvHdFscfJWpoDGvi9qD7fbxQUEXrISIXRypvCdZn4ukkp8kZYXV0NL4g0EpOnRJANbjv1jPMePTei0n9I1HkoMym08=s1024-v1"]	{"Outdoor seating","No-contact delivery",Delivery,"Onsite services",Takeout,Dine-in}	pending	\N	t	f	\N	\N	0	\N	\N	google_maps	f43cddfa-65d3-4896-bd4c-a6b6c6f33055	2026-06-27 13:53:33.892897+05	2026-06-27 13:53:33.892897+05	\N	{}
adaae4bf-654d-4d1f-a420-591dbd93089d	Okra Restaurant	\N	ChIJr8hz77E9sz4RWiX6v7qfqoE	\N	1	\N	Restaurant	\N	Plot 12- C 10th Commercial Ln, Zamzama Commercial Area Defence V Karachi, 75600, Pakistan	35	1	\N	\N	\N	24.81839570	67.03947040	+92 300 8207539	\N	\N	\N	4.3	1339	Rs 2,000 to Rs 8,000	\N	\N	Open · Closes 3 PM · Reopens 7:30 PM	\N	\N	\N	\N	\N	\N	\N	\N	https://lh3.googleusercontent.com/gps-cs-s/APNQkAGqMoknTbLKvPyDShkvjGCn9_OAXh8yCy9UJ0CIOTwxVFZSeJ6AH1i-rASgrEVzMA8g5vINjYXOtAbK1GqPUM80YwIzEwCRFxyF137oHEgpnOdijGatcTQheYn1d7jNtgPTDQ3Q=s1024-v1	["https://lh3.googleusercontent.com/gps-cs-s/APNQkAG0fXB_O1vF6VIGi4XpT6goVzDDGkQRNMn8a8-m9Ua7tBomctblDtcy_fYDeqavUY6UQAubPlFECYxd_Ox2ysqaMn0f1AM78D8P53zaEfgR_jUnvC0HqyPEeR0DSdgfxxDXRxvzjtK5UpDW=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAEk6Dije_bASUqXJQ--ID3oOa1qnR7GrrPOpEz5BaUMWvFcE3Z2hw5rti_FD03LmgfHQ4Zec7J-1V_sdnrXp2jXfFHci0Z_ex3tIfaFu8CNBRziDjXsGIIJC7RVCh0W5Ule76KpXfZ59V8=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAHT0PM4qZxfXD3NLlXKc7SuLrMhDnslUHvklz2Lg_3DHv5QKsA3RindxJxLHTlKWit7sQNiyfgn30j9GnD1VgYEQ_2TeBW_hOkbsXUMrjaCIyVI4mxeE2XgDiu8CGQofq7Sz8C5-3SH9kHR=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAGkE-MQFvmISimqgSduukOeG2uy0G5evlgV9UEcnfySulaR1OmbLSivVtVqWe__s4Gixuwtng8IYqzbSC-OSWi-ekSVPXDx7DdRTnpfhcqr2lUztvUZSxLHbi5e40wHBvB1IvEW6mCREhYD=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAEZHabLSb5HuGjuBObf3ZgAm8EQReP0QKEm_yuCQPaQO8Grt-DnQc_H11QSsLUQ21A-kcn1_ZCNOE6pgbKBCwktQDf9_Hz3_xgluZ5kccUhDxjM2drUZhGK4UP8DzqIbygbIyjQYclTiYyC=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAErSr5UcTvDNH6XvPd07mxoCXcBdPmEY-o1Uk0Qqd2q0JH_x0kpjC0bhwhF5VrA0v_QUEcHE0ZFuCVBufO36ZSBhiM_32hOqV8fP_-ZyLwOBYbvD6UjC9R2X-bsE5-L_7T_DApSXdKreYKb=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAHxcgFn3xeO9gAKld5db2XDoEPBBEvJ5QADkD_D00CJlxeOLd3eCYfdeZdD2B6PItSKCEufTbY0sQ4Jh_JvZrTnwLRvxvBty4fgYda8VNBd0t0x3lCsHMlV4jOQWa8VjT9O8pogWhQ1X5PX=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAFXIoB1YcLKjWjeaJyXW1_ushbxMzW1Oeppz-AeJYn9OC77kuHYyGPQHm7LYa1MnwdkoyMgc2PvpoMY4RNOCLOU6P2UvjTNA6Rr6DhA7abi7WW2dlqoDSEGTv6Ll58Ux1xw3MB9IsgjFExB=s1024-v1"]	{"Outdoor seating","No-contact delivery",Delivery,Takeout,Dine-in}	pending	\N	t	f	\N	\N	0	\N	\N	google_maps	f43cddfa-65d3-4896-bd4c-a6b6c6f33055	2026-06-27 13:53:33.905055+05	2026-06-27 13:53:33.905055+05	\N	{}
6b23fb29-418c-4872-ac4a-1872c6021d97	Kanteen	\N	ChIJI21ObT09sz4R2X3oqfRPKEg	\N	1	\N	Restaurant	\N	Dolmen Mall, Block 4 Clifton, Karachi, 75600, Pakistan	4	1	\N	\N	\N	24.80163590	67.03027580	+92 21 35185002	\N	\N	\N	4.7	2841	Rs 1,000 to Rs 4,000	\N	\N	Open · Closes 10 PM	\N	\N	\N	\N	\N	\N	\N	\N	https://lh3.googleusercontent.com/gps-cs-s/APNQkAE7aPVkWz6ccYDVHdR_WNTKA_8CSsde635z1UqDLPzn9FaK8eduvsQ9VJ0A6Z09Ha9xd6vBrbxGr-SzYbzlq2G_2DuNCehupaHxoaAfoFN0SZB2gIuleGeN1mb6_MGoDY99BqPwjFs_awl4=s1024-v1	["https://lh3.googleusercontent.com/gps-cs-s/APNQkAF9CqP0nA5XqY6oBwSey5FHw4mIYVBekzYTTVxBHlMOaZhGZZjlEIL0XTMr-A-Ch1lnY8grAIVySs_47UIsl_GMgpV6yEufdunhHSACta3wjv0cUaDDLauVows4KpGL0zRxNVJm2AwI0w4X=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAEBmdGnH4ExcrqwWcvFo5N7IEPFLt2DD7DmDiRkf45-UKuGwkO9qalGzeb6qxtSHn8n42uBxc3l70Hsa460_ZPOAX-Shp_SJSCKFJ0Yv3jYjV2QmB9PTHLX99LIP-ZHWfrISc9RLlpz5hRw=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAHRDq_1JJ9HLTHT0K7d_u-0aBpDE06pqC8zBcZygfpfcs1KB3rYvIf_i9mEYECRlKnDDGhrGzL1xxjJxI4AK4vrhUEMGn3V8VMtm6oshBbE38L9i7WZYEUdAGl2r2yMLcMOVSxU48_8rBz9=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAFkP5xkwSnO9FMu3h9UvaP72-ec9EoP1nhl2AodMIdt_YjfytOSJ8ifu5eofsIVO4eIk14LVJvdbCKa3n95sMf1W7wDUdO9XA0FgnVDlLqy5EIeH_AfvDiPfzxmHttSYAz2tfbcBcEOqGZ2=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAG1f1W3YA7nuTw_BCp7tzjfHbv5tiWSHg-YPTWjMAXiHIpxbHKGN60RWywJq8XLh9fezfRltZW5OWfBmQpWW_hHEXTNjfieYQrGS5sgC8w4iBncsFLexopabHmt1N4LC_e3LjvMN4gjnXKa=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAFIOxjd_1Omur3SFsFnZFvan2_5kFBmVu5aKVfOZFM4122PFfU6s-gcgB5WoI92S4i42nR-rsmn-O-9OMp13IhKMM9IJ6PQhhlsgbLKvqweuMf0EgJ6U9f4qCHKSz0l8fvJHqKILyWjq2Tf=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAG-2YMP7QyqorC88lWfCxgkHn_0zX8-rxXUHpIJoEmhGKJqFty1mU7u3xxdGi0oJCGtdzwIV0Woja8B_o8u9PDkxDgwyPao3o4RcBmzSjvn4U5sXaw0L7A9PtorOKjSSzESkksDGS3A5FIc=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAFgfsUQMELBKCU9jcFt4JpMHVy_z45sNImqcnTTMJJtjmsVhY_BqzdWXWVuW5HkIjh6q8PhIXaH25MxybydlGM4b5GLmOM8rvGoSOIFgnkisEN_pu2TyBsi7G6VGUTo2DJxdVCiWM4uHeo=s1024-v1"]	{Delivery,"Onsite services",Takeout,Dine-in}	pending	\N	t	f	\N	\N	0	\N	\N	google_maps	f43cddfa-65d3-4896-bd4c-a6b6c6f33055	2026-06-27 13:53:33.915703+05	2026-06-27 13:53:33.915703+05	\N	{}
8c71d2b5-7e66-45e1-b691-bb68453b14fa	Cafe Flo	\N	ChIJUwL62qc9sz4RjF1BRoae7HI	\N	1	\N	Fine dining restaurant	\N	d82, 1 26th Street, Block 4 Clifton, Karachi, 75500, Pakistan	4	1	\N	\N	\N	24.80747690	67.03410470	+92 21 35830018	\N	https://www.facebook.com/cafeflo/	\N	4.2	3484	Rs 5,000 or above	\N	\N	Open · Closes 12 AM	\N	\N	\N	\N	\N	\N	\N	\N	https://lh3.googleusercontent.com/gps-cs-s/APNQkAHQj1ej0MoYv_sDPY_eV1mYNZMRbo9XZ4-GDsilvkstcx30SdNziaWsQ9aWD2ZSIhiMXZD0n8MgnptO7OJuqKvsfjhclnzU9wi1smQOxPfKP7iEFf6ox7EMmNVLI9BonnEFj_V7GQ=s1024-v1	["https://lh3.googleusercontent.com/gps-cs-s/APNQkAEhtsZO9EBfa_q5mM6FuNAhoQpRnwNAmaRud6qg39MKiPf3-JYfcpX_RQdCje3wZO-2UifLOrT4-gUE6AncceX4lSqS6FqX_L0YQi4nK08bRloKcoxbctnd5B2Lcqlturq4_OtsaM6pq2Yq=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAGGpygwIotyo6MuTU1f0HGvMl3c51Sx5Ba7aEkezqYuDNLjh0rL1LKi_A8GiHG1AtHEtXdAaxUGsPLGQ1suiB1FiZRteshmbI6IFPz6lTHF9UcUnDHdLuLZrANj4sv5KW1eMKM_=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAGUm9SA3dF-65QXHHvZaQWJP1x16AAZ77sfANQAXtShVdw8NRi9V-4rteukUa7OPdKfQ-DrX4NRZPZcI770XJev1HF9VjeLbbzx_r6nGiO2o4RXnYUyJK4TynwontNFQszfjyVM7Q=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAFDwNZIEAY1WE9wH4DFfHOtytV3C_0jXIoIaR-O3Xxazy2js8QrFf7RqS48oZOGYVgUSiftDptS8vUpdeAqYuhGqpj5r6WnRnvhF-4TNinaQ7ZjoMfxdnH7mTcxMFS0fU_8cgW1mGmuUyn-=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAFZqg0DGrR_lB2Gr84CMz40Apg5HJFU_UwM9RJ5dQv09AyMjZvctuFEjbypgaNngH139s06bDXBbP0gzKcnoJWO-yUvMeyagte_xOLnPG5ChyqEwdXab9QUiDf9ShmbuX62vPoPOQ=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAFpszqgYr0nQtOXV9Rf9LWghLEtfUDl6IcKKtCed-036L3xEfLeVjUWQcmqlD2rYpnEf6KqzKNHkBEFgoRXA7NkMEy-8bFV6hplz8y22cWH7ZH9vEIoERAKssJ7ADT4pab0Z3F5=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAFzQo-4GmglaArfsK4k7GxkpakbcEE6vRvAmUfSRX1rBVnkEUww15DR59qvG_RE8h0Fu_SQmkHTRj_nRT0H-I4yCoQbBPtjZOpi-o5ly5QFZSiWk4788zCEvEnejSzmxEfbPclHHQ=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAEgvXTu6GNZ-ENoAqMWMtKgrBL6vv9v8dRFPu2zJ6sY-BZUwL_jLU0L_8VreU6GevRCgRPdQwQddrstA01hbeLlhNbvt3lgrPMlFq_mKZNEqsdfOZCs2BUW39QzC143VBmIoBki=s1024-v1"]	{"Outdoor seating",Delivery,Takeout,Dine-in}	pending	\N	t	f	\N	\N	0	\N	\N	google_maps	f43cddfa-65d3-4896-bd4c-a6b6c6f33055	2026-06-27 13:53:33.925017+05	2026-06-27 13:53:33.925017+05	\N	{}
47a96938-ab24-4cfd-8467-41efdcfadd6e	Koyla Chai۔ کوئلہ چائے	\N	ChIJk7plPpc9sz4RpIn30QRqfZo	\N	1	\N	Restaurant	\N	D2 Clifton Block 2 Next to Shell Pump Bilawal Chowrangi, Shahrah-e-Ghalib Rd, Block 2 Clifton, Karachi, 75600, Pakistan	4	1	\N	\N	\N	24.81587270	67.01812620	+92 320 2828280	\N	http://www.koylachai.com.pk/	\N	4.4	8224	Rs 1,000 to Rs 7,000	\N	\N	Closed · Opens 5 PM	\N	\N	\N	\N	\N	\N	\N	\N	https://lh3.googleusercontent.com/gps-cs-s/APNQkAFnYJit6wGrXKHxl6y__XrSEdW-SBMr-dk7y8UbiyIVgMEB1izAr1XJiiC1cSZod2iTwSoe6TlEDFIAXo7LZ9S8R6eNxeRBLnK0CnuCSSGbg_LI4JQog6vUvtqEDajF2WvkfSC4Qg=s1024-v1	["https://lh3.googleusercontent.com/gps-cs-s/APNQkAGBnJ7SyMWRuN_BIZZzG3oKBST1WiUe31RgcAvBpmZPLAKICemwMTTnE2DQUBfwH7JFiKaZvt964uiMYKgah_dfz-3M4ykYUpieLp6hVrlE1-k8f-j3heK7oLY2UPoPAxRgKdo=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAGNyCOSQ3qKYy1NyPG_iKTG-JiAC4gIwNniLiDEi3XXY2VuBMFLMRrF3dxmQYu3_QLXwDTkPApn-9Uar6fsLqdUliYAcsEmyOHiKv_W9ZSWcow_qI5ADUYSs3uZ-hM7NzVwW-qzrw=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAFd1RuThAXXn5fbPVMzlX1IP33ySwj39Yxg6rdl3Kv0K_o7MEbDRWSVzJNtWBdU0G2sLzbj1RD20ngEKmutcvW653v3Zeqe2I_pmqr2Pcow2SXQ0wj3N8YPdaHebWgV9mv1bKl5lg=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAH_916NcSZR8GOBLLSyebcy-ci_eeNjIkOvKskBdUGmBlwSgfHcrepyKNwx0NQ3_hofWKwembh3gPdWaRxs_mL733KuQZMmduW4k7JZakLQ76hS3xjGCctSmRRaE3_F6Io5paw=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAHbWRYCWSAzZ1nZ6JrmTwZLSQSfUR-lWQMhrMLMXGLdVOmXSk5wfK325e2py1kjRih1o1-VVdgtzOKouC4ImDcnGb651_TvALMatYuIK5x3kEyuZb3Sbc6rhex42WfbwBJTQ18r=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAER-1jvnn4VpRJBE6R3m6w7KHAeBcGV-hs0RgqEhJgAp-44HnM6fju0CwGO4YbiJ6JS0oQYcGRgaXQEBO0xVuq9BDbtNHQriuxa0-7W7AWP-ZrE_rWW-wIG45FwH4Kez9R02i524g=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAGHVtI0aW7CYy-eQzHelAyscg8nV7oump1CvhLGcvMie9GnP3LLSteGP_K-GGpi2aIXfix12qSOoNTH-jh6Dtmr7o_l8qjOgKiFP4wg-XgvvfxTbtb-Tteomrb1HGw9uu6vp3M=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAGhjdQ8qkyLvBO5tnJo1mO3PW3JE97nioL5kK6qUS2sB-w7_d7lrV4nWy_ehMWEt5X3ubOOwd37texoNrUeuurvl9oxCmF4pUxocTRRJRsqhfWkcN4BL5U07aBOVtdQ6Nqcef6f=s1024-v1"]	{"Outdoor seating","Onsite services",Dine-in}	pending	\N	t	f	\N	\N	0	\N	\N	google_maps	f43cddfa-65d3-4896-bd4c-a6b6c6f33055	2026-06-27 13:53:33.936119+05	2026-06-27 13:53:33.936119+05	\N	{}
cb331c1e-35ea-4e1d-91aa-0779eceef813	The Patio Restaurant	\N	ChIJw9KJ8ac9sz4RfAByPUIB-mY	\N	1	\N	Restaurant	\N	F-50/1 D St, Block 4 Clifton, Karachi, 75500, Pakistan	4	1	\N	\N	\N	24.80626870	67.03367140	+92 300 8291936	\N	https://thepatio.com.pk/	\N	4.0	1173	Rs 3,000 to Rs 4,000	\N	\N	Open · Closes 12 AM	\N	\N	\N	\N	\N	\N	\N	\N	https://lh3.googleusercontent.com/gps-cs-s/APNQkAEc1V7RYn-p-BZ1PoHMN-JGhHYyfoE5bHXodkhBve-Iiw7vxblry1gvDgDOGUbuD2fL6aCBvGpqfCIzV_XX8f0yHANz0ATPEAM0dmNmAswppPnXCM5w3joA5rYUurTGasggPC6R2Q=s1024-v1	["https://lh3.googleusercontent.com/gps-cs-s/APNQkAG1QeGNzL6zQFQoGJZnDebi8uXbzAvtJ62PZpV-jbXBsM3sfY9RGggZf-PY52v8aOmbZ5LFe0Y75IwoM5YhjnsTo8xUaVoh0EdJr97bxOurbh7Jw7fFfAoLAvdalkEfiW2EKHeRI4C0wKno=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAGwZt0Kvl2JKMPeuExmFDcJNzhDmB-djWfcR4D8NBOPaJjqNj9uyJnERp3HCmJxqSgWmxEONS8So2KNeVdoF0LIu3sFL8Iuww4cTKXFcKkaV_dy1OaZpwxPWHGwyQUF50bOjS8-XitR0L8=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAEBwnJyszdK3YE6am2BEjV8rv7T_on7P87BIptwJvv3uBLorzrsbZVHiKQ9uINWtPKRDwC8zFA5DoL3ISwJkbIGEYgvsaL6JLD65b5m-Pxo6sU1klBow1nT6h_J0s7m7oU-KWC-eZTKTHI=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAG00aXp7zdfaezynRRcZYz9o9CjhbuVKSVz6OKtz41Co10eiNHfRHnofbLO3FSiRRlx8N1V6ZFpdB_96BsiGR5mT5zLqRwRJu4Sh9Gu8AeFn-btLaCL2IUjWyBaskKIcYbTv3wycoi3OPER=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAEoig8uvNpAkYLVsGcEsN4smnXJ_9Bdv9U6qZOGrBY7rn6XUgGfKbUGQOMhCgW9zez0QF4O83ci-xdLQq4Ok_aziE-gJsL3OGXukKRLx3fsRm0LCtEbTRQ8ZFpufTgCQNxduOIaj_DQp000=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAGcx4BMFANF1O5of3PGniKtvf-ocYpdgMpoAPj1Cispegn2OxjJ9ylzzT2IQG2BX9IvcUMMIfbkOWvG9gohK8ikr0z1s1-e9DVHOrt1341TKspaBIfKd4q9z-M54BrgIfGVnigl-_C0zJI=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAEzQmOLRRRqzkbMZhSslQw0zJLEMY2anyqAgMPDLJTa7qXAzVsTcwYC81tUy-1BVfwQ2e_5TojdT70OgDTdP8be6kIC16kTj6aMo2O4vi-tHFdqd9JJHzneQnuBCoBi-L8VPoDsBg=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAFgzeAP97leYwvFTCNvpL6OOgzDBufknPtnF3jFJvG_bsAM8BtuyBEhZ3FqE_FIHbV9D2TPNnxpS4xku5IweRv1vc5dEVhxjuDGZqfXrMah53NNfRPVjTww2sOnbYpU88guJXO7Evn1Mt8v=s1024-v1"]	{"Identifies as women-owned"}	pending	\N	t	f	\N	\N	0	\N	\N	google_maps	f43cddfa-65d3-4896-bd4c-a6b6c6f33055	2026-06-27 13:53:33.972181+05	2026-06-27 13:53:33.972181+05	\N	{}
9aa77d24-07e1-4654-81ff-6abc5baf8ce0	Pranzo	\N	ChIJyZBEZL09sz4RJdHUjUbH_xE	\N	1	\N	Fine dining restaurant	\N	Bunglow D, 151 Astrik St, Block 5 Clifton, Karachi, 75600, Pakistan	4	1	\N	\N	\N	24.81715870	67.02294900	+92 21 35148201	\N	\N	\N	4.1	2624	Rs 2,000 to Rs 7,000	\N	\N	Open · Closes 11:59 PM	\N	\N	\N	\N	\N	\N	\N	\N	https://lh3.googleusercontent.com/gps-cs-s/APNQkAGJ3X1d8se4bZWlx2qeOfukCjuUu3YgLYDazJn2pe8KWJ64CjBY9pi_Xeh1q18sU2rNZ3eDH7tir3UazTIxqgzqre8K8YLCVsbMNs4TpJN3KT7c45AZvpEMQ7olONE4hr9-Ua4YxA=s1024-v1	["https://lh3.googleusercontent.com/gps-cs-s/APNQkAEsFm2PYK7WG2MY5MvyDABjTYM2P-1_Gg_Ix0k46ZfIYzXo4SW3Qg9sWmoV56HB87BEVNE6mKoA0aV-eZlhZKa2hzExJsEP9iJSJVlTChRs2dTJzmVr8oyz9bcz3YJsaNij2ZpPHA=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAFIem1HSJg3jSLgGGHyAJVUs7sXkirPfFkBX5eGrsmH_KQ9uVcRYxY44A7UAFsIbcM72lFv2FwuO0xq9im5j5Yd2U8q-l43IAdOTBszwcvzB0DbQLBSdoIsaYbBp5jswn7ufcMQcQ=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAEKhNi-AdiKa_j-4nzeSI3lwT6d8QReY4lzFKFT3gZNK7pcfgqh3rJUK6Ykjh3KCIYSn7z_KmYJKfpUhxKb4yEZxI78qP8Rh96cYqDlFL81lKO3Wd9pEYsFc-EcI75D0kYCC_y1=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAEW-veohGZ_XLkUgZ_Aq-KpV9JO9nnfwpTdJlk2Ea4K8Cz3Uep3AhlefGzAeH5vp_Zm2-Ny994Y6piH9o2nQBBGBJkCrqN1-jXYvKz_DLkxWnLQBPp51jyVw7yX38_YRz0hvkFI=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAFMJlvVi9kw7SSPh9VKei2r8uI3vCtE1MRPJaziRevpoHajU7-JMqwh1kmUDxAeezD_9uNGqtCTY18VwMQJbYYGl27OgA9iBDgUarM_gPaytqCR7tMXhk-urOHZyrBIDD4uRnNt=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAFhC-jy7s_4zg36qijN7yqW6NBZTQPjklpmJzS23Iic-mVRbavUByq9p9lLK9nfvefYfH7tMZquf72uM04RewSRCJBdjetrZcnjOUgQ0OUwMSqOTvg1ESuHBtK0YqYvX36yo9-G=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAGj2EdXI-tA3VvNrMtJ5EogcNnslVKVRUT1KletIeBoqY_lXcj6-dXCAhmabuaHRlGiIVj2aDK-MvZ_06E8JqxfNsZpfRYEOBV6AIQopDBUBqDKEaJatkd8obj5xR2CECQ1-lu9iA=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAEWCgX9i_jrBIkeAhkgNoNiZdXVGXar6b0GYKOyWwx8eVElRD-HS6QDDJjTvJcbSYX4lXOzUMuOMvBhkC_SZAWcYJ7vB0UPFYLScSsKGvfImvylHPFLUkrTDI1cLOt39mydl798mQ=s1024-v1"]	{"Outdoor seating",Delivery,Takeout,Dine-in}	pending	\N	t	f	\N	\N	0	\N	\N	google_maps	f43cddfa-65d3-4896-bd4c-a6b6c6f33055	2026-06-27 13:53:33.981608+05	2026-06-27 13:53:33.981608+05	\N	{}
512aee71-82dd-4433-863a-9e1afcfdf8f6	Xander's Clifton	\N	ChIJLXpsRAg9sz4R8FH-nwG8Tjg	\N	1	\N	Restaurant	\N	C32, E St, Block 4 Clifton, Karachi, 75500, Pakistan	4	1	\N	\N	\N	24.80384890	67.03263010	+92 21 35293653	\N	http://www.xanders.pk/	\N	4.3	5250	Rs 2,000 to Rs 6,000	\N	\N	Open · Closes 1 AM	\N	\N	\N	\N	\N	\N	\N	\N	https://lh3.googleusercontent.com/gps-cs-s/APNQkAHwk2TalAO6YfR7ZsbL3h-n-1RiptRHk5p0-YDH2lzEdcn1i2CumsEtVsFqjz5rcNnEfydEmi215pSOwNEVjMRl48KBaljvwk6Z4lE9uvklxIDF5KVCWZ2rXdbT7vhVj6mbpzQ5=s1024-v1	["https://lh3.googleusercontent.com/gps-cs-s/APNQkAHqau7mcirC75USr4iG4h5qqxfZeqiE3ASLeXSt_Pej2LYGicV5qxOLrVWuOlaZ1rumo8XoIN_RBwk7avYs2cSBfUZxVk5J70KhFdj6NHPrPXIBJRPa3KGK-l_jl6cU5of1euQtqQPudvmi=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAHRJYvWI7tfm4AlAEhATNIpQUrXLosLba22apbFa3JzEoMcL0-eRCHo2w9B2ODbiH1JTFRvhLWqUO7TAJoAg-ciBz5axBQ3t3S1IheFnrzMx-V9GXxFPivxuw300XJv4luQSPRpaFcxf00v=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAF62HftCV9hVHPUfxU49LGpzjzHpTtM0M5q9b6VVe7f_guYH7UUE2E0iFO9FKQU3FmepxUCn3HQcLv01k63T_R3oIVG0zHHOlodXTtmkEBMfRDouYhfwGFzXjb6qQkdb4uN_EcFMzPsMEHn=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAHVFhDcMoAipfhIjeaBpICjAhUlVNjghl9vxBY5M4En9JPH7l-C6LpiZnopkDaJWhL8sY_4GYY7uVk_bWkt8Hkhuq2bWjqiErDftd96O4ysc03wOEsh8c1aL-33RuNPN0HeS4-_GUKH4XYR=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAEKYuL-5I46lGQ8csrCXJVOLFLJDUFoGVAQC8p2c-lUrup1bUUYnzeJ1Dm6L4yvMZkdtuvNsx2vusD1PFzOgNPiJb0r3LERzOCqkZiILOc5h7FaQzi6Lkr0iWiSHAepc-SauEkqkCM7gGo=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAFMi2IE9ABQGmZ0Kykj3tBQQAwik3Mq4NxtvNSou2bxoWZ0-C-Px7GpSDWmaqcxWIBcy-hX7lyogZqvxAiYFwiuJw8eFK9WHqrZ1ez7dLD5gg9yfoCuLYcrikcVYZuZT0OCIQlTnsqTb5NL=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAGh1Aek6GxBq4T4lRxdWdUly9moRF8wS0a7Pxuzp6S36qoLDrgf9-pM9PW0qyJHwu_Ikhcpu0Ym8DyUXxtXriqOcTa8Rg4DPlidpFsAqJ34x5q-mooUkTUfAdhJfgABzSqZHht7JXx0jfJ9=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAHT6Fyw56Iu4GZarNp_l98S8aSaaVtQqqy7q4Apedvpi80mdNw3L79VwbrId1gGdnjr9LvYph7fXj6qCkJDJuS9TnlwCoJvjM4x1WsathFIK9WGXtyxZFC5X5VgHXlcCJFg_HiVMRAE69A=s1024-v1"]	{"Outdoor seating","No-contact delivery",Delivery,Takeout,Dine-in}	pending	\N	t	f	\N	\N	0	\N	\N	google_maps	f43cddfa-65d3-4896-bd4c-a6b6c6f33055	2026-06-27 13:53:33.988814+05	2026-06-27 13:53:33.988814+05	\N	{}
a506ddc1-fd08-4a6d-9af8-d8b75bb57052	Chai Chatt	\N	ChIJwQswsM4_sz4RF5mdPFqPNQA	\N	1	\N	Family restaurant	\N	Street No. 3, Karachi Memon Co-operative Housing Society Karachi Memon Society P.E.C.H.S., Karachi, Pakistan	1	1	\N	\N	\N	24.86618560	67.07743100	+92 301 5687898	\N	http://chaichatt.com/	\N	4.6	4124	Rs 1,000 to Rs 2,000	\N	\N	Open · Closes 2 AM	\N	\N	\N	\N	\N	\N	\N	\N	https://lh3.googleusercontent.com/gps-cs-s/APNQkAE3iDj3PSc_huSve4GNsz3I5bBSszGzEGbBEByjjEuNxBYHsVeO_psTmFNWuCIXWmeCGc_tBTC-YoOEKFpxykP8HVLnWHKXy0HEGX2yjD2BhWPVENvbbOMU85aLGChc-_a29Iw=s1024-v1	["https://lh3.googleusercontent.com/gps-cs-s/APNQkAGCG5zYVKI8HgkTaG39TotvjIbwzrx3LqKJJ-iNAgUUeO5_mtF-0zU_5Pgx0x13h-aTrJBBnvwEkETEkkGYpUUimSOfkwB23qsgs_ft2Jg-d4Y6j_yF1LrO2rmYytUlP4FgGwSPW0Y3Pq7k=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAEzC4XhuAdHNJHmtAfkVse84oTYKZP2a1_MOIMsZaTMRSa279fhG5kSSpAxMVWlzXZWV48xQjBIUgOQWQa_TubrYpJHm6ETD7wXu6xr2ynERYD2-uDthWK9fVaX_n3Nk8iF4uNbuKJ6Hs6E=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAEZdZyxNWc0qU1YXAWn-oEyKCE3xVCy4G8J3pLbgXXzAHj9-XbiLr_ihcd1lz1u8s8YWVCYYmFjj3O4awACxEVG7L9yQ1JRnyhNX66GA1rhgq7sEAND56Wx_3ZBi1ywMzM-WzHTHNaXrWU=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAFYYTgTKnzmtnPA8qT2SZ4Z-cBcDFybPUSM-Z7I2z4of2MzsMLTnqVYgVWld0MNcgTRCg3tnBDc4nLYr60fk8HWU7VFo5Hdvz6BtJBWXoSPLSjUN0c9m3tdoQj5eZjCKjDHfIe8Ctz6Z-kz=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAFHO8Ch-VCUQvxaqCiEhtlhBkpQ_KwQSCEx-zhtXc0O0baYXCULql9OBuBqZMfC1hBTpXN3_QGcehGx7EKjSBweuSXc9VAMQsPKuOU8fL1LVXb9UZDi3unHYtlVamYHpzA8sYDg7MEiJQ8=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAGFW9Kt1I26zfykXutlRngC2SJ4a-WylOAI2m9IlR7xVyL_gN5AevM6nIcrQvo34u1I0MylK3zkG7Qg7Bf19pO_EO0fwCtEw4uydAagiqZ04_mGPh1dcIPcZuBp0Tn3JbGfl2QP6kUOYtA2=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAE3zPf2RxIFtD_rWB9FAP23U8DbwSAVsJzsy0YFC1liiHFh-UX9uXmAxMlbP6yZqYo9u4_267g4-X6p0Ev-uEf_MxXuPeaSjDr1hQ-5iRli-nce8LWEx-AGX_tXq_NqxSHgQJr7=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAF96ylsjqC889grsOKeZAsZ6Vzk-U41VqrCY1vqfEvxWew633po_oQJEalPWyTa29_6FuMoBp6du_6f_ELE6KI10QHgDtslShnuDTZK71SqiWTReYaqdNtJ8X-YPpR4QHCcC5wo=s1024-v1"]	{"Outdoor seating","No-contact delivery",Delivery,"Onsite services",Takeout,Dine-in}	approved	\N	t	f	\N	\N	0	2026-07-02 13:02:33.837728+05	e96cc951-24d3-4f77-94c0-318696ad390d	google_maps	f43cddfa-65d3-4896-bd4c-a6b6c6f33055	2026-06-27 13:53:34.011323+05	2026-07-02 13:02:33.837728+05	\N	{}
4b0ed062-5745-43af-bd8f-0b9d41b9170d	Boat Basin	\N	ChIJ6bRTfb89sz4RyimBb1q-HlY	\N	1	\N	Restaurant	\N	Boat Basin Food Street, SC-6 Bank Rd, Block 5 Clifton, Karachi, 75600, Pakistan	34	1	\N	\N	\N	24.82654040	67.02598470	+92 21 35364444	\N	https://boatbasin.pk/	\N	4.2	15227	Moderately expensive	\N	\N	Open 24 hours	\N	\N	\N	\N	\N	\N	\N	\N	https://lh3.googleusercontent.com/gps-cs-s/APNQkAHBWvUbOqEqelcXKzbTg1BVT73QWCNR2xzUSMhhp51bj7-Qx_Daa0pnd_TUunLgLzC9WNlgYTu1iwvxqxY04zTEjBvi73aa8VtElM_uI5eGOKLRghtkSZyXpCLWkIM4mUpb2Qr1=s1024-v1	["https://lh3.googleusercontent.com/gps-cs-s/APNQkAHW7guXPdvpMNORC4bCeUu7sTGDad16bS0vkKoyNtUKJX342BCPRZu0raS-qX45IyKyuwie75i0OhYRRqRwf1PLhnwAzduVEt33etKyAaKoWjiUQqzuvvZAQcpiNyxzfGTw4MuW=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAEohAsQ_eWongcZXLsrJ87ps5tzLc2QjTzuWyWfysb3uIIdxMpsVfPxgwTTVCbJreN7NJQWnYMVqDTtn2MCZP14M-iBQTdZcmVLDuzIQF_kC0If_HK_bQSfnS7VdaQbjIdp1rTlNY9-RGY=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAHH0M3tbkTo7aC9JR_67FRg4UtnDOAhPYJv0ujY8aRR-KatfcpINO3ONQkdEzb9WMtmV3VQkvXt2B3H8I4Bs00rTePJlTsDA9x6NygyuN72dOhOWGM2FRLMueyO6idVLe7PuvPQlQ=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAHzizUnGz_IgQSeyDI4vqnJRXRdIYKte7cJTdv0s17DDkQIBVQpN5rP3-GJUTJkUSY5kkK68dulTgJ3S97aOMhFFZJF0s7uLGx3PupY01ou4y1-FXwfuH0RaZJfkgDQYIJV9GO_Lg=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAEKLF9RiTmJ831QdSn7ew7XsqbgZf3dkpChzvw9tkkYGFwvVHK7lX3SQZFJkb_7Z0j3ZAUAa82ZkjvlxSDAV450LVpQ9MVopQv3tQB5bKs-PJXmXXadNbrtWNKEn5TKKW73QqpFog=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAHglwJn8ytK6af9xKYBeY-H9rAD1u-SI1vjUzpVlPIXCPE2XPgPhdegPP4Ii_Up598cGh5pCljS4OQvJBb1cL62H9hqcvL_bSEdNh54nr9fufZtqpS_8D6JUejmxG3INPTx50Xz=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAGuOkQSuaBcehZLWJFvMhewKVPO2hNRw76eu6hAyrr5YZvCUB1SbOY9yEdytOSr7lV3L-CWmPM9wqok4U37z5odIXRWZnKq8Qto2-PZS_NnnXRS18GT5Z1oB26v7cFBoYLWwFVB=s1024-v1", "https://lh3.googleusercontent.com/gps-cs-s/APNQkAEDDg4vx-RTXFO28yYydq_NX3P4_ndFAvqOxxYNHnU5qDBFKF4diE4F8JiPN_Vk3qJRRyrUYXUixf4wVkDYjw2i_HpIy31-wX2N8ATYQaYdhrHaWa74xnKKJzUDtlXqW_ZttMfH=s1024-v1"]	{"No-contact delivery",Delivery,Drive-through,"Onsite services",Takeout,Dine-in}	approved	\N	t	f	\N	\N	0	2026-07-03 14:18:59.3419+05	e96cc951-24d3-4f77-94c0-318696ad390d	google_maps	f43cddfa-65d3-4896-bd4c-a6b6c6f33055	2026-06-27 13:53:34.003067+05	2026-07-03 14:18:59.3419+05	\N	{}
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, name, slug, icon, is_active, created_at, updated_at) FROM stdin;
1	Restaurant	restaurant	\N	t	2026-06-25 14:55:04.765029+05	2026-06-25 14:55:04.765029+05
2	CafÃ©	cafe	\N	t	2026-06-25 14:55:04.765029+05	2026-06-25 14:55:04.765029+05
3	Bakery	bakery	\N	t	2026-06-25 14:55:04.765029+05	2026-06-25 14:55:04.765029+05
4	Dhaba	dhaba	\N	t	2026-06-25 14:55:04.765029+05	2026-06-25 14:55:04.765029+05
5	Hotel	hotel	\N	t	2026-06-25 14:55:04.765029+05	2026-06-25 14:55:04.765029+05
6	Cloud Kitchen	cloud-kitchen	\N	t	2026-06-25 14:55:04.765029+05	2026-06-25 14:55:04.765029+05
7	Food Court	food-court	\N	t	2026-06-25 14:55:04.765029+05	2026-06-25 14:55:04.765029+05
8	Catering	catering	\N	t	2026-06-25 14:55:04.765029+05	2026-06-25 14:55:04.765029+05
9	Sweet Shop	sweet-shop	\N	t	2026-06-25 14:55:04.765029+05	2026-06-25 14:55:04.765029+05
10	Ice Cream Parlour	ice-cream-parlour	\N	t	2026-06-25 14:55:04.765029+05	2026-06-25 14:55:04.765029+05
\.


--
-- Data for Name: cities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cities (id, province_id, name, code, boundary, created_at, updated_at) FROM stdin;
1	1	Karachi	\N	\N	2026-06-25 15:33:44.992322+05	2026-06-27 13:46:11.61863+05
2	2	Lahore	\N	\N	2026-06-25 15:33:45.004194+05	2026-06-27 13:46:11.631513+05
3	5	Islamabad	\N	\N	2026-06-25 15:33:45.008808+05	2026-06-27 13:46:11.633743+05
4	2	Rawalpindi	\N	\N	2026-06-25 15:33:45.010634+05	2026-06-27 13:46:11.636941+05
5	3	Peshawar	\N	\N	2026-06-25 15:33:45.01435+05	2026-06-27 13:46:11.639255+05
6	2	Faisalabad	\N	\N	2026-06-25 15:33:45.017076+05	2026-06-27 13:46:11.640879+05
7	2	Multan	\N	\N	2026-06-25 15:33:45.021135+05	2026-06-27 13:46:11.64242+05
8	4	Quetta	\N	\N	2026-06-25 15:33:45.022541+05	2026-06-27 13:46:11.643956+05
\.


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.companies (id, name, slug, industry, logo_url, website, email, phone, address, city_id, status, plan, plan_started_at, plan_expires_at, max_employees, max_territories, admin_user_id, created_at, updated_at, deleted_at, legal_name) FROM stdin;
11111111-1111-1111-1111-111111111111	PakIndex Corporate Test	pakindex-corporate-test	FMCG / Distribution	\N	\N	\N	\N	\N	\N	active	pro	\N	\N	5	1	\N	2026-06-25 18:00:36.723648+05	2026-07-01 14:35:31.274889+05	\N	\N
09148055-e830-421c-8e9e-1c642344d1a8	Pepsi	pepsi	Bakery Supplies	\N	\N	pepsi@gmail.com	03223123123	\N	\N	active	premium	\N	\N	5	1	15662fc5-a595-42af-827e-2925c30b11d7	2026-07-01 14:34:58.39069+05	2026-07-02 13:05:17.518545+05	\N	pepsi.co
b4162808-f43f-4330-9aba-0a53295f6fee	Cola	cola	FMCG Distribution	\N	\N	cola@gmail.com	\N	\N	\N	active	free	\N	\N	5	1	8903ef44-00eb-4516-95ae-4ea1642cd8fc	2026-07-03 14:25:45.272939+05	2026-07-03 14:25:45.272939+05	\N	cola
\.


--
-- Data for Name: company_areas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.company_areas (company_id, area_id, assigned_at) FROM stdin;
09148055-e830-421c-8e9e-1c642344d1a8	14	2026-07-01 14:34:58.39069+05
b4162808-f43f-4330-9aba-0a53295f6fee	2	2026-07-03 14:25:45.272939+05
b4162808-f43f-4330-9aba-0a53295f6fee	3	2026-07-03 14:25:45.272939+05
b4162808-f43f-4330-9aba-0a53295f6fee	4	2026-07-03 14:25:45.272939+05
b4162808-f43f-4330-9aba-0a53295f6fee	34	2026-07-03 14:25:45.272939+05
b4162808-f43f-4330-9aba-0a53295f6fee	37	2026-07-03 14:25:45.272939+05
b4162808-f43f-4330-9aba-0a53295f6fee	1	2026-07-03 14:25:45.272939+05
\.


--
-- Data for Name: company_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.company_categories (company_id, category_id, assigned_at) FROM stdin;
09148055-e830-421c-8e9e-1c642344d1a8	3	2026-07-01 14:34:58.39069+05
b4162808-f43f-4330-9aba-0a53295f6fee	4	2026-07-03 14:25:45.272939+05
\.


--
-- Data for Name: company_pinned_businesses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.company_pinned_businesses (company_id, business_id, pinned_by, pinned_at) FROM stdin;
\.


--
-- Data for Name: company_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.company_settings (company_id, settings, updated_at) FROM stdin;
\.


--
-- Data for Name: company_territories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.company_territories (company_id, territory_id, assigned_at) FROM stdin;
\.


--
-- Data for Name: crm_activities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.crm_activities (id, lead_id, performed_by, activity_type, title, body, visit_location, visit_completed, stage_from, stage_to, scheduled_at, completed_at, created_at) FROM stdin;
\.


--
-- Data for Name: crm_leads; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.crm_leads (id, company_id, business_id, assigned_to, assigned_by, stage, priority, expected_value, actual_value, next_follow_up, last_contact_at, notes, won_at, lost_at, lost_reason, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: cuisine_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cuisine_types (id, name, slug, is_active, created_at) FROM stdin;
1	Pakistani	pakistani	t	2026-06-25 14:55:04.770317+05
2	Chinese	chinese	t	2026-06-25 14:55:04.770317+05
3	Fast Food	fast-food	t	2026-06-25 14:55:04.770317+05
4	Seafood	seafood	t	2026-06-25 14:55:04.770317+05
5	BBQ	bbq	t	2026-06-25 14:55:04.770317+05
6	Italian	italian	t	2026-06-25 14:55:04.770317+05
7	Continental	continental	t	2026-06-25 14:55:04.770317+05
8	Indian	indian	t	2026-06-25 14:55:04.770317+05
9	Turkish	turkish	t	2026-06-25 14:55:04.770317+05
10	Desi	desi	t	2026-06-25 14:55:04.770317+05
11	Breakfast	breakfast	t	2026-06-25 14:55:04.770317+05
12	Desserts	desserts	t	2026-06-25 14:55:04.770317+05
\.


--
-- Data for Name: duplicate_pairs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.duplicate_pairs (id, business_a_id, business_b_id, similarity, detection_method, resolved, resolution, resolved_by, resolved_at, created_at) FROM stdin;
\.


--
-- Data for Name: employee_territory_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employee_territory_assignments (id, user_id, territory_id, assigned_by, assigned_at, revoked_at, is_active) FROM stdin;
\.


--
-- Data for Name: export_jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.export_jobs (id, requested_by, company_id, export_type, filters, status, file_url, row_count, error_message, expires_at, created_at, completed_at) FROM stdin;
\.


--
-- Data for Name: follow_ups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.follow_ups (id, lead_id, assigned_to, due_at, note, is_completed, completed_at, created_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, recipient_id, company_id, type, title, body, link, entity_type, entity_id, is_read, read_at, created_at) FROM stdin;
430cbf10-b82e-442c-96e8-30efc809f19f	e96cc951-24d3-4f77-94c0-318696ad390d	\N	new_scrape	15 new businesses scraped	"Karachi Popular Resturants" added 15 new records to Pending Approval.	/admin/pending	\N	\N	t	2026-06-27 13:54:10.726759+05	2026-06-27 13:53:34.027484+05
0a1031ae-29ff-45aa-b068-55f09ef1d0a7	e96cc951-24d3-4f77-94c0-318696ad390d	\N	company_activity	New company created: Pepsi	Admin login: pepsi@gmail.com · Plan: premium	/admin/companies	\N	\N	t	2026-07-02 13:03:10.882812+05	2026-07-01 14:34:59.265149+05
71fcb214-efde-42bb-b1f4-891ea223dce9	8fc98569-4063-468a-a0e5-5190ed656a2d	09148055-e830-421c-8e9e-1c642344d1a8	employee_update	Employee suspendd	1 employee record(s) updated: suspend.	/company/employees	\N	\N	f	\N	2026-07-02 14:37:04.295873+05
5d9de006-2f3f-405a-8f07-7be1571172e9	b54ec1fa-bb46-4c4f-a1d3-f4953cf4c216	09148055-e830-421c-8e9e-1c642344d1a8	employee_update	Employee suspendd	1 employee record(s) updated: suspend.	/company/employees	\N	\N	f	\N	2026-07-02 14:37:04.426103+05
2ec0ab56-69c9-406a-9055-1e21b6e2666b	15662fc5-a595-42af-827e-2925c30b11d7	09148055-e830-421c-8e9e-1c642344d1a8	employee_update	Employee suspendd	1 employee record(s) updated: suspend.	/company/employees	\N	\N	f	\N	2026-07-02 14:37:04.431347+05
26881729-07a6-4b98-99c5-fb95b8b6f318	8fc98569-4063-468a-a0e5-5190ed656a2d	09148055-e830-421c-8e9e-1c642344d1a8	employee_update	Employee activated	1 employee record(s) updated: activate.	/company/employees	\N	\N	f	\N	2026-07-02 14:37:17.925577+05
9b194760-1ca0-4bc8-8b52-13161b191d17	8cba116b-7cd9-4093-a18c-949e6cf6705a	09148055-e830-421c-8e9e-1c642344d1a8	employee_update	Employee activated	1 employee record(s) updated: activate.	/company/employees	\N	\N	f	\N	2026-07-02 14:37:17.944765+05
a30b1e72-8708-44d5-ad2f-e4b2ed08e192	b54ec1fa-bb46-4c4f-a1d3-f4953cf4c216	09148055-e830-421c-8e9e-1c642344d1a8	employee_update	Employee activated	1 employee record(s) updated: activate.	/company/employees	\N	\N	f	\N	2026-07-02 14:37:17.949247+05
d0d4bf0a-9fa8-4a4a-a711-c86170334997	15662fc5-a595-42af-827e-2925c30b11d7	09148055-e830-421c-8e9e-1c642344d1a8	employee_update	Employee activated	1 employee record(s) updated: activate.	/company/employees	\N	\N	f	\N	2026-07-02 14:37:17.953035+05
ebb93960-9801-4d3b-a2fe-8139e80ffbaf	8fc98569-4063-468a-a0e5-5190ed656a2d	09148055-e830-421c-8e9e-1c642344d1a8	employee_update	New employee added	Hassan Ali (EMP-400813) was added to your team.	/company/employees	\N	\N	f	\N	2026-07-02 14:38:42.132977+05
524f5bb8-7389-4671-8214-f55f2bddf56f	8cba116b-7cd9-4093-a18c-949e6cf6705a	09148055-e830-421c-8e9e-1c642344d1a8	employee_update	New employee added	Hassan Ali (EMP-400813) was added to your team.	/company/employees	\N	\N	f	\N	2026-07-02 14:38:42.139118+05
cd7f9d79-477d-4371-b62a-ebd25735a753	f9f8f90c-2e88-4e47-9d59-ed3ddf3e37f3	09148055-e830-421c-8e9e-1c642344d1a8	employee_update	New employee added	Hassan Ali (EMP-400813) was added to your team.	/company/employees	\N	\N	f	\N	2026-07-02 14:38:42.143654+05
817183b0-b8ce-43ab-96ce-689f752c07e8	b54ec1fa-bb46-4c4f-a1d3-f4953cf4c216	09148055-e830-421c-8e9e-1c642344d1a8	employee_update	New employee added	Hassan Ali (EMP-400813) was added to your team.	/company/employees	\N	\N	f	\N	2026-07-02 14:38:42.148996+05
4f0e73ec-4d60-4d88-924b-e8a7b04b4c30	15662fc5-a595-42af-827e-2925c30b11d7	09148055-e830-421c-8e9e-1c642344d1a8	employee_update	New employee added	Hassan Ali (EMP-400813) was added to your team.	/company/employees	\N	\N	f	\N	2026-07-02 14:38:42.153356+05
1280ba6e-d199-4e0a-99b1-8ed28e897972	8fc98569-4063-468a-a0e5-5190ed656a2d	09148055-e830-421c-8e9e-1c642344d1a8	employee_update	Employee suspendd	1 employee record(s) updated: suspend.	/company/employees	\N	\N	f	\N	2026-07-03 14:16:27.916938+05
8dc68178-52eb-4eea-8230-d000b902ce11	8cba116b-7cd9-4093-a18c-949e6cf6705a	09148055-e830-421c-8e9e-1c642344d1a8	employee_update	Employee suspendd	1 employee record(s) updated: suspend.	/company/employees	\N	\N	f	\N	2026-07-03 14:16:27.964652+05
d13525a9-c9ca-4a50-8a4f-142b8bef0c97	15662fc5-a595-42af-827e-2925c30b11d7	09148055-e830-421c-8e9e-1c642344d1a8	employee_update	Employee suspendd	1 employee record(s) updated: suspend.	/company/employees	\N	\N	f	\N	2026-07-03 14:16:27.972001+05
58aafd2f-0dbb-45ef-8697-735937e94876	b54ec1fa-bb46-4c4f-a1d3-f4953cf4c216	09148055-e830-421c-8e9e-1c642344d1a8	employee_update	Employee suspendd	1 employee record(s) updated: suspend.	/company/employees	\N	\N	f	\N	2026-07-03 14:16:27.976127+05
d4068671-ddad-4bbc-baa6-0539895ead7b	e96cc951-24d3-4f77-94c0-318696ad390d	\N	company_activity	New company created: Cola	Admin login: cola@gmail.com · Plan: free	/admin/companies	\N	\N	f	\N	2026-07-03 14:25:45.451383+05
\.


--
-- Data for Name: provinces; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.provinces (id, name, code, created_at, updated_at) FROM stdin;
1	Sindh	SD	2026-06-25 14:55:04.757308+05	2026-06-27 13:45:43.672021+05
2	Punjab	PB	2026-06-25 14:55:04.757308+05	2026-06-27 13:45:43.672021+05
3	Khyber Pakhtunkhwa	KP	2026-06-25 14:55:04.757308+05	2026-06-27 13:45:43.672021+05
4	Balochistan	BL	2026-06-25 14:55:04.757308+05	2026-06-27 13:45:43.672021+05
5	Islamabad Capital Territory	ICT	2026-06-25 14:55:04.757308+05	2026-06-27 13:45:43.672021+05
6	Azad Jammu & Kashmir	AJK	2026-06-25 14:55:04.757308+05	2026-06-27 13:45:43.672021+05
7	Gilgit-Baltistan	GB	2026-06-25 14:55:04.757308+05	2026-06-27 13:45:43.672021+05
\.


--
-- Data for Name: scrape_jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.scrape_jobs (id, initiated_by, source, query, area_id, city_id, category_id, status, total_found, new_records, duplicates, failed_records, started_at, completed_at, error_message, raw_payload, created_at) FROM stdin;
6e20cbb4-aab4-4a0d-92cc-17a3b5f88076	e96cc951-24d3-4f77-94c0-318696ad390d	google_maps	restaurants in islamabad	\N	3	\N	completed	20	20	0	0	2026-06-25 15:40:57.721139+05	2026-06-25 15:40:57.846972+05	\N	{}	2026-06-25 15:40:57.721139+05
f43cddfa-65d3-4896-bd4c-a6b6c6f33055	e96cc951-24d3-4f77-94c0-318696ad390d	google_maps	Karachi Popular Resturants	\N	1	\N	completed	20	15	5	0	2026-06-27 13:53:33.2515+05	2026-06-27 13:53:34.017676+05	\N	{}	2026-06-27 13:53:33.2515+05
\.


--
-- Data for Name: scrape_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.scrape_logs (id, scrape_job_id, business_id, place_id, log_level, message, raw_data, logged_at) FROM stdin;
\.


--
-- Data for Name: spatial_ref_sys; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.spatial_ref_sys (srid, auth_name, auth_srid, srtext, proj4text) FROM stdin;
\.


--
-- Data for Name: subscription_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subscription_logs (id, company_id, plan_from, plan_to, changed_by, reason, changed_at) FROM stdin;
\.


--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_settings (key, value, description, updated_by, updated_at) FROM stdin;
app_name	"PakIndex"	Platform display name	\N	2026-06-25 15:28:18.280611+05
scrape_rate_limit	{"requests_per_min": 30}	Scraper rate limit	\N	2026-06-25 15:28:18.280611+05
duplicate_threshold	0.85	Cosine similarity threshold for duplicate detection	\N	2026-06-25 15:28:18.280611+05
default_plan	"trial"	Default plan for new companies	\N	2026-06-25 15:28:18.280611+05
trial_days	14	Length of trial period in days	\N	2026-06-25 15:28:18.280611+05
max_export_rows	50000	Max rows per CSV export	\N	2026-06-25 15:28:18.280611+05
\.


--
-- Data for Name: territories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.territories (id, name, description, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: territory_areas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.territory_areas (territory_id, area_id) FROM stdin;
\.


--
-- Data for Name: user_preferences; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_preferences (user_id, dark_mode, language, preferences, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, employee_code, full_name, email, phone, username, password_hash, role, status, designation, department, avatar_url, company_id, assigned_area_id, email_verified_at, last_login_at, password_reset_token, password_reset_expires, refresh_token_hash, dark_mode, created_at, updated_at, deleted_at) FROM stdin;
8cba116b-7cd9-4093-a18c-949e6cf6705a	EMP-445262	Shafiq	shafiq@pepsi.com	0323232344	saffu	$2b$10$X1sehyWIs/RuqBYPHi5vbex7kDZIQ0Ll5BlVrzKeL2tJZeJyB0c6u	employee	active	Engineer	Production 	\N	09148055-e830-421c-8e9e-1c642344d1a8	\N	\N	\N	\N	\N	\N	f	2026-07-02 14:15:05.996117+05	2026-07-02 14:37:17.894072+05	\N
aae54d17-9a78-464e-8f22-d8a080c950c1	\N	Taha Ahmed	taha@company.com	\N	\N	$2b$10$S2Wf5jdXakhKnHefHAvIiOdRokvOxKGXgkNnK0cgNEFNR4nUC3ZQG	employee	inactive	\N	\N	\N	11111111-1111-1111-1111-111111111111	\N	\N	\N	\N	\N	\N	f	2026-06-27 11:56:42.164779+05	2026-06-27 12:41:28.894865+05	2026-06-27 12:41:28.894865+05
8fc98569-4063-468a-a0e5-5190ed656a2d	EMP-128403	Taha Ahmed	taha@pepsi.com	032323232323	taha	$2b$10$S5PvzOZcl4V2poPAm3X6X.2mTBGmkab4zUOKdlZxRPIq26gRDSwsO	employee	active	Lead	Engineer	\N	09148055-e830-421c-8e9e-1c642344d1a8	\N	\N	2026-07-03 22:19:36.969324+05	\N	\N	\N	f	2026-07-01 17:35:03.915289+05	2026-07-03 22:19:36.969324+05	\N
e96cc951-24d3-4f77-94c0-318696ad390d	\N	Admin	admin@pakindex.com	\N	\N	$2b$10$SAHliwn0S7PNYnxpQ5gErOMdYRWLllDYhE.g2KM4vLD56upTNd6yC	super_admin	active	\N	\N	\N	\N	\N	\N	2026-07-03 22:40:31.094391+05	\N	\N	\N	f	2026-06-25 15:33:45.253156+05	2026-07-03 22:40:31.094391+05	\N
9718f28c-c980-4ac9-975d-b82645e654f5	EMP-6401	Salman Hussain	salman@company.com	03323232323	Sallu.Hussain	$2b$10$zjscgB.LVBj4xjdfa3bnWeh/GmeelyOquMiuxFnCViTVtRPeFvwCu	employee	inactive	Officer	Sales	\N	11111111-1111-1111-1111-111111111111	\N	\N	\N	\N	\N	\N	f	2026-06-27 12:31:53.542575+05	2026-06-27 12:56:16.454324+05	\N
cd741a17-694b-4d01-ab30-0e3d35085bf7	\N	Muhammad Yousuf	manager@company.com	\N	\N	$2b$10$3uxYgZy7dres8tXSNY0OJOS.RtKRcN4I53d.k3skbHq8UWLvtlX3C	company_admin	active	\N	\N	\N	11111111-1111-1111-1111-111111111111	\N	\N	2026-07-01 15:45:01.739205+05	\N	\N	\N	f	2026-06-25 18:00:36.845561+05	2026-07-01 15:45:01.739205+05	\N
f9f8f90c-2e88-4e47-9d59-ed3ddf3e37f3	EMP-400813	Hassan Ali Afandi	hassanali@pepsi.com	0300022200	hassan.ali	$2b$10$dl2UvR/Y7xnpH/bEJqH.u.0TWFmWbH8I6gf9DITHZguSlvNUMG2/S	employee	inactive	Physics	Wala	\N	09148055-e830-421c-8e9e-1c642344d1a8	\N	\N	2026-07-02 14:40:05.091678+05	\N	\N	\N	f	2026-07-02 14:38:42.103661+05	2026-07-03 14:16:36.043144+05	\N
15662fc5-a595-42af-827e-2925c30b11d7	\N	03321212121	pepsi@gmail.com	03223123123	\N	$2b$10$dNmeBz05Sv6PIUQjt5KKEuA1IFhO3UWR1yC/3wIy79BQYY..CTbgq	company_admin	active	\N	\N	\N	09148055-e830-421c-8e9e-1c642344d1a8	\N	\N	2026-07-03 14:23:12.736883+05	\N	\N	\N	f	2026-07-01 14:34:58.39069+05	2026-07-03 14:23:12.736883+05	\N
b54ec1fa-bb46-4c4f-a1d3-f4953cf4c216	EMP-438390	Ali Ahmed	ali@pepsi.com	03232112222	ali.ahmed	$2b$10$awWxdhDz7H.xva/SjmiWTO6sWN4No.TFdEXvpRj8NP5H/kvHGfecC	employee	active	Software Engineer	Engineering	\N	09148055-e830-421c-8e9e-1c642344d1a8	\N	\N	\N	\N	\N	\N	f	2026-07-01 16:46:21.475815+05	2026-07-01 17:13:28.652227+05	\N
01e72fcc-7497-4336-9c7d-d1cc9f9e4e61	EMP-342922	Hassan	hassan@pepsi.com	03567890345	hassan	$2b$10$mKeVvwL3csoaoWUx82NosOYpJR4Ay0Li/ZLSKY1ees40mMVZpo4BS	employee	inactive	Aptech	Taxation	\N	09148055-e830-421c-8e9e-1c642344d1a8	\N	\N	\N	\N	\N	\N	f	2026-07-01 17:46:35.311541+05	2026-07-01 18:27:31.810892+05	2026-07-01 18:27:31.810892+05
7d235c68-77a7-4726-9003-41979be7602d	EMP-210451	Salman 	sallu@pepsi.com	0321212121	sallu	$2b$10$SO2N0n4bakQd3ULLdFoj5uCcVQlnZaj.B86iktPkzPH9R/BIN3yGa	employee	inactive	Engineer	Development	\N	09148055-e830-421c-8e9e-1c642344d1a8	\N	\N	\N	\N	\N	\N	f	2026-07-01 17:45:44.709809+05	2026-07-01 18:31:42.789797+05	2026-07-01 18:31:42.789797+05
259f67d5-d4c9-41f3-b29e-d7b84e7fe349	EMP-789871	john doe	john@pepsi.com	0233344566	john.doe	$2b$10$HioSI.S5uBuInQrzB6XyGeBMtNQowRaLCv/774KFFA5ddvYMNSUZW	employee	inactive	akakak	aakak	\N	09148055-e830-421c-8e9e-1c642344d1a8	\N	\N	\N	\N	\N	\N	f	2026-07-01 17:14:26.046021+05	2026-07-01 18:32:02.591886+05	2026-07-01 18:32:02.591886+05
8903ef44-00eb-4516-95ae-4ea1642cd8fc	\N	qwerty	cola@gmail.com	\N	\N	$2b$10$GOS2txBfaTIyfghKosGUluK4TrEM1r2H2PKDF4jVmCIFstN2CDJaO	company_admin	active	\N	\N	\N	b4162808-f43f-4330-9aba-0a53295f6fee	\N	\N	2026-07-03 14:26:07.354644+05	\N	\N	\N	f	2026-07-03 14:25:45.272939+05	2026-07-03 14:27:53.498157+05	\N
\.


--
-- Name: areas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.areas_id_seq', 56, true);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 34, true);


--
-- Name: business_hours_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.business_hours_id_seq', 1, false);


--
-- Name: business_tags_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.business_tags_id_seq', 1, false);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 12, true);


--
-- Name: cities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cities_id_seq', 16, true);


--
-- Name: cuisine_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cuisine_types_id_seq', 14, true);


--
-- Name: provinces_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.provinces_id_seq', 9, true);


--
-- Name: scrape_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.scrape_logs_id_seq', 1, false);


--
-- Name: areas areas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_pkey PRIMARY KEY (id);


--
-- Name: areas areas_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_slug_key UNIQUE (slug);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: business_hours business_hours_business_id_day_of_week_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business_hours
    ADD CONSTRAINT business_hours_business_id_day_of_week_key UNIQUE (business_id, day_of_week);


--
-- Name: business_hours business_hours_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business_hours
    ADD CONSTRAINT business_hours_pkey PRIMARY KEY (id);


--
-- Name: business_tags business_tags_business_id_tag_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business_tags
    ADD CONSTRAINT business_tags_business_id_tag_key UNIQUE (business_id, tag);


--
-- Name: business_tags business_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business_tags
    ADD CONSTRAINT business_tags_pkey PRIMARY KEY (id);


--
-- Name: businesses businesses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.businesses
    ADD CONSTRAINT businesses_pkey PRIMARY KEY (id);


--
-- Name: businesses businesses_place_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.businesses
    ADD CONSTRAINT businesses_place_id_key UNIQUE (place_id);


--
-- Name: categories categories_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key UNIQUE (name);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: categories categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_key UNIQUE (slug);


--
-- Name: cities cities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cities
    ADD CONSTRAINT cities_pkey PRIMARY KEY (id);


--
-- Name: cities cities_province_id_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cities
    ADD CONSTRAINT cities_province_id_name_key UNIQUE (province_id, name);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: companies companies_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_slug_key UNIQUE (slug);


--
-- Name: company_areas company_areas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_areas
    ADD CONSTRAINT company_areas_pkey PRIMARY KEY (company_id, area_id);


--
-- Name: company_categories company_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_categories
    ADD CONSTRAINT company_categories_pkey PRIMARY KEY (company_id, category_id);


--
-- Name: company_pinned_businesses company_pinned_businesses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_pinned_businesses
    ADD CONSTRAINT company_pinned_businesses_pkey PRIMARY KEY (company_id, business_id);


--
-- Name: company_settings company_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_settings
    ADD CONSTRAINT company_settings_pkey PRIMARY KEY (company_id);


--
-- Name: company_territories company_territories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_territories
    ADD CONSTRAINT company_territories_pkey PRIMARY KEY (company_id, territory_id);


--
-- Name: crm_activities crm_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.crm_activities
    ADD CONSTRAINT crm_activities_pkey PRIMARY KEY (id);


--
-- Name: crm_leads crm_leads_company_id_business_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.crm_leads
    ADD CONSTRAINT crm_leads_company_id_business_id_key UNIQUE (company_id, business_id);


--
-- Name: crm_leads crm_leads_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.crm_leads
    ADD CONSTRAINT crm_leads_pkey PRIMARY KEY (id);


--
-- Name: cuisine_types cuisine_types_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cuisine_types
    ADD CONSTRAINT cuisine_types_name_key UNIQUE (name);


--
-- Name: cuisine_types cuisine_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cuisine_types
    ADD CONSTRAINT cuisine_types_pkey PRIMARY KEY (id);


--
-- Name: cuisine_types cuisine_types_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cuisine_types
    ADD CONSTRAINT cuisine_types_slug_key UNIQUE (slug);


--
-- Name: duplicate_pairs duplicate_pairs_business_a_id_business_b_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.duplicate_pairs
    ADD CONSTRAINT duplicate_pairs_business_a_id_business_b_id_key UNIQUE (business_a_id, business_b_id);


--
-- Name: duplicate_pairs duplicate_pairs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.duplicate_pairs
    ADD CONSTRAINT duplicate_pairs_pkey PRIMARY KEY (id);


--
-- Name: employee_territory_assignments employee_territory_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_territory_assignments
    ADD CONSTRAINT employee_territory_assignments_pkey PRIMARY KEY (id);


--
-- Name: export_jobs export_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.export_jobs
    ADD CONSTRAINT export_jobs_pkey PRIMARY KEY (id);


--
-- Name: follow_ups follow_ups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.follow_ups
    ADD CONSTRAINT follow_ups_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: provinces provinces_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provinces
    ADD CONSTRAINT provinces_code_key UNIQUE (code);


--
-- Name: provinces provinces_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provinces
    ADD CONSTRAINT provinces_name_key UNIQUE (name);


--
-- Name: provinces provinces_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provinces
    ADD CONSTRAINT provinces_pkey PRIMARY KEY (id);


--
-- Name: scrape_jobs scrape_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scrape_jobs
    ADD CONSTRAINT scrape_jobs_pkey PRIMARY KEY (id);


--
-- Name: scrape_logs scrape_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scrape_logs
    ADD CONSTRAINT scrape_logs_pkey PRIMARY KEY (id);


--
-- Name: subscription_logs subscription_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_logs
    ADD CONSTRAINT subscription_logs_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (key);


--
-- Name: territories territories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.territories
    ADD CONSTRAINT territories_pkey PRIMARY KEY (id);


--
-- Name: territory_areas territory_areas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.territory_areas
    ADD CONSTRAINT territory_areas_pkey PRIMARY KEY (territory_id, area_id);


--
-- Name: user_preferences user_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_pkey PRIMARY KEY (user_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_employee_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_employee_code_key UNIQUE (employee_code);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_audit_company; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_company ON public.audit_logs USING btree (company_id);


--
-- Name: idx_audit_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_date ON public.audit_logs USING btree (created_at DESC);


--
-- Name: idx_audit_entity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_entity ON public.audit_logs USING btree (entity_type, entity_id);


--
-- Name: idx_audit_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_user ON public.audit_logs USING btree (performed_by);


--
-- Name: idx_businesses_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_businesses_active ON public.businesses USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_businesses_area; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_businesses_area ON public.businesses USING btree (area_id);


--
-- Name: idx_businesses_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_businesses_category ON public.businesses USING btree (category_id);


--
-- Name: idx_businesses_city; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_businesses_city ON public.businesses USING btree (city_id);


--
-- Name: idx_businesses_location; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_businesses_location ON public.businesses USING gist (location);


--
-- Name: idx_businesses_name_trgm; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_businesses_name_trgm ON public.businesses USING gin (name public.gin_trgm_ops);


--
-- Name: idx_businesses_place_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_businesses_place_id ON public.businesses USING btree (place_id);


--
-- Name: idx_businesses_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_businesses_status ON public.businesses USING btree (status);


--
-- Name: idx_company_areas_company; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_company_areas_company ON public.company_areas USING btree (company_id);


--
-- Name: idx_company_categories_company; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_company_categories_company ON public.company_categories USING btree (company_id);


--
-- Name: idx_crm_activities_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_crm_activities_date ON public.crm_activities USING btree (created_at);


--
-- Name: idx_crm_activities_lead; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_crm_activities_lead ON public.crm_activities USING btree (lead_id);


--
-- Name: idx_crm_activities_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_crm_activities_type ON public.crm_activities USING btree (activity_type);


--
-- Name: idx_crm_activities_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_crm_activities_user ON public.crm_activities USING btree (performed_by);


--
-- Name: idx_crm_leads_assigned; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_crm_leads_assigned ON public.crm_leads USING btree (assigned_to);


--
-- Name: idx_crm_leads_company; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_crm_leads_company ON public.crm_leads USING btree (company_id);


--
-- Name: idx_crm_leads_followup; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_crm_leads_followup ON public.crm_leads USING btree (next_follow_up);


--
-- Name: idx_crm_leads_stage; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_crm_leads_stage ON public.crm_leads USING btree (stage);


--
-- Name: idx_emp_territory_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_emp_territory_user ON public.employee_territory_assignments USING btree (user_id);


--
-- Name: idx_export_jobs_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_export_jobs_user ON public.export_jobs USING btree (requested_by);


--
-- Name: idx_follow_ups_due; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_follow_ups_due ON public.follow_ups USING btree (due_at) WHERE (is_completed = false);


--
-- Name: idx_follow_ups_lead; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_follow_ups_lead ON public.follow_ups USING btree (lead_id);


--
-- Name: idx_follow_ups_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_follow_ups_user ON public.follow_ups USING btree (assigned_to);


--
-- Name: idx_notifications_company; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_company ON public.notifications USING btree (company_id);


--
-- Name: idx_notifications_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_created ON public.notifications USING btree (created_at DESC);


--
-- Name: idx_notifications_recipient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_recipient ON public.notifications USING btree (recipient_id, is_read);


--
-- Name: idx_scrape_jobs_initiated; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_scrape_jobs_initiated ON public.scrape_jobs USING btree (initiated_by);


--
-- Name: idx_scrape_jobs_source; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_scrape_jobs_source ON public.scrape_jobs USING btree (source);


--
-- Name: idx_scrape_jobs_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_scrape_jobs_status ON public.scrape_jobs USING btree (status);


--
-- Name: idx_scrape_logs_job; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_scrape_logs_job ON public.scrape_logs USING btree (scrape_job_id);


--
-- Name: idx_users_company; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_company ON public.users USING btree (company_id);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: idx_users_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_status ON public.users USING btree (status);


--
-- Name: areas trg_areas_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_areas_updated_at BEFORE UPDATE ON public.areas FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: businesses trg_businesses_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_businesses_updated_at BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: categories trg_categories_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: cities trg_cities_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_cities_updated_at BEFORE UPDATE ON public.cities FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: companies trg_companies_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: crm_leads trg_crm_leads_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_crm_leads_updated_at BEFORE UPDATE ON public.crm_leads FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: cuisine_types trg_cuisine_types_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_cuisine_types_updated_at BEFORE UPDATE ON public.cuisine_types FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: provinces trg_provinces_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_provinces_updated_at BEFORE UPDATE ON public.provinces FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: territories trg_territories_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_territories_updated_at BEFORE UPDATE ON public.territories FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: users trg_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: areas areas_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id) ON DELETE RESTRICT;


--
-- Name: audit_logs audit_logs_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;


--
-- Name: audit_logs audit_logs_performed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: business_hours business_hours_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business_hours
    ADD CONSTRAINT business_hours_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: business_tags business_tags_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business_tags
    ADD CONSTRAINT business_tags_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: businesses businesses_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.businesses
    ADD CONSTRAINT businesses_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas(id) ON DELETE SET NULL;


--
-- Name: businesses businesses_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.businesses
    ADD CONSTRAINT businesses_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: businesses businesses_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.businesses
    ADD CONSTRAINT businesses_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id);


--
-- Name: businesses businesses_cuisine_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.businesses
    ADD CONSTRAINT businesses_cuisine_type_id_fkey FOREIGN KEY (cuisine_type_id) REFERENCES public.cuisine_types(id) ON DELETE SET NULL;


--
-- Name: businesses businesses_merged_into_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.businesses
    ADD CONSTRAINT businesses_merged_into_id_fkey FOREIGN KEY (merged_into_id) REFERENCES public.businesses(id) ON DELETE SET NULL;


--
-- Name: businesses businesses_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.businesses
    ADD CONSTRAINT businesses_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.businesses(id) ON DELETE SET NULL;


--
-- Name: businesses businesses_province_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.businesses
    ADD CONSTRAINT businesses_province_id_fkey FOREIGN KEY (province_id) REFERENCES public.provinces(id);


--
-- Name: cities cities_province_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cities
    ADD CONSTRAINT cities_province_id_fkey FOREIGN KEY (province_id) REFERENCES public.provinces(id) ON DELETE RESTRICT;


--
-- Name: companies companies_admin_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_admin_user_id_fkey FOREIGN KEY (admin_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: companies companies_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id) ON DELETE SET NULL;


--
-- Name: company_areas company_areas_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_areas
    ADD CONSTRAINT company_areas_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas(id) ON DELETE CASCADE;


--
-- Name: company_areas company_areas_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_areas
    ADD CONSTRAINT company_areas_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: company_categories company_categories_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_categories
    ADD CONSTRAINT company_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: company_categories company_categories_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_categories
    ADD CONSTRAINT company_categories_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: company_pinned_businesses company_pinned_businesses_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_pinned_businesses
    ADD CONSTRAINT company_pinned_businesses_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: company_pinned_businesses company_pinned_businesses_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_pinned_businesses
    ADD CONSTRAINT company_pinned_businesses_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: company_pinned_businesses company_pinned_businesses_pinned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_pinned_businesses
    ADD CONSTRAINT company_pinned_businesses_pinned_by_fkey FOREIGN KEY (pinned_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: company_settings company_settings_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_settings
    ADD CONSTRAINT company_settings_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: company_territories company_territories_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_territories
    ADD CONSTRAINT company_territories_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: company_territories company_territories_territory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_territories
    ADD CONSTRAINT company_territories_territory_id_fkey FOREIGN KEY (territory_id) REFERENCES public.territories(id) ON DELETE CASCADE;


--
-- Name: crm_activities crm_activities_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.crm_activities
    ADD CONSTRAINT crm_activities_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.crm_leads(id) ON DELETE CASCADE;


--
-- Name: crm_activities crm_activities_performed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.crm_activities
    ADD CONSTRAINT crm_activities_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: crm_leads crm_leads_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.crm_leads
    ADD CONSTRAINT crm_leads_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: crm_leads crm_leads_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.crm_leads
    ADD CONSTRAINT crm_leads_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: crm_leads crm_leads_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.crm_leads
    ADD CONSTRAINT crm_leads_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: crm_leads crm_leads_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.crm_leads
    ADD CONSTRAINT crm_leads_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: duplicate_pairs duplicate_pairs_business_a_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.duplicate_pairs
    ADD CONSTRAINT duplicate_pairs_business_a_id_fkey FOREIGN KEY (business_a_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: duplicate_pairs duplicate_pairs_business_b_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.duplicate_pairs
    ADD CONSTRAINT duplicate_pairs_business_b_id_fkey FOREIGN KEY (business_b_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: duplicate_pairs duplicate_pairs_resolved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.duplicate_pairs
    ADD CONSTRAINT duplicate_pairs_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: employee_territory_assignments employee_territory_assignments_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_territory_assignments
    ADD CONSTRAINT employee_territory_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: employee_territory_assignments employee_territory_assignments_territory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_territory_assignments
    ADD CONSTRAINT employee_territory_assignments_territory_id_fkey FOREIGN KEY (territory_id) REFERENCES public.territories(id) ON DELETE CASCADE;


--
-- Name: employee_territory_assignments employee_territory_assignments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_territory_assignments
    ADD CONSTRAINT employee_territory_assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: export_jobs export_jobs_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.export_jobs
    ADD CONSTRAINT export_jobs_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: export_jobs export_jobs_requested_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.export_jobs
    ADD CONSTRAINT export_jobs_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: businesses fk_businesses_scrape_job; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.businesses
    ADD CONSTRAINT fk_businesses_scrape_job FOREIGN KEY (scrape_job_id) REFERENCES public.scrape_jobs(id) ON DELETE SET NULL;


--
-- Name: businesses fk_businesses_verified_by; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.businesses
    ADD CONSTRAINT fk_businesses_verified_by FOREIGN KEY (verified_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: users fk_users_company; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_company FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;


--
-- Name: follow_ups follow_ups_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.follow_ups
    ADD CONSTRAINT follow_ups_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: follow_ups follow_ups_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.follow_ups
    ADD CONSTRAINT follow_ups_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.crm_leads(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_recipient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: scrape_jobs scrape_jobs_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scrape_jobs
    ADD CONSTRAINT scrape_jobs_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas(id) ON DELETE SET NULL;


--
-- Name: scrape_jobs scrape_jobs_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scrape_jobs
    ADD CONSTRAINT scrape_jobs_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: scrape_jobs scrape_jobs_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scrape_jobs
    ADD CONSTRAINT scrape_jobs_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id);


--
-- Name: scrape_jobs scrape_jobs_initiated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scrape_jobs
    ADD CONSTRAINT scrape_jobs_initiated_by_fkey FOREIGN KEY (initiated_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: scrape_logs scrape_logs_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scrape_logs
    ADD CONSTRAINT scrape_logs_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE SET NULL;


--
-- Name: scrape_logs scrape_logs_scrape_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scrape_logs
    ADD CONSTRAINT scrape_logs_scrape_job_id_fkey FOREIGN KEY (scrape_job_id) REFERENCES public.scrape_jobs(id) ON DELETE CASCADE;


--
-- Name: subscription_logs subscription_logs_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_logs
    ADD CONSTRAINT subscription_logs_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: subscription_logs subscription_logs_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_logs
    ADD CONSTRAINT subscription_logs_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: system_settings system_settings_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: territory_areas territory_areas_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.territory_areas
    ADD CONSTRAINT territory_areas_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas(id) ON DELETE CASCADE;


--
-- Name: territory_areas territory_areas_territory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.territory_areas
    ADD CONSTRAINT territory_areas_territory_id_fkey FOREIGN KEY (territory_id) REFERENCES public.territories(id) ON DELETE CASCADE;


--
-- Name: user_preferences user_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_assigned_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_assigned_area_id_fkey FOREIGN KEY (assigned_area_id) REFERENCES public.areas(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict Eczfyg1mwWDNaePv9iRRMPNNXTp1MP5Y48i8amZ8hplqb3VlztUIII7Ok1aO4aD

