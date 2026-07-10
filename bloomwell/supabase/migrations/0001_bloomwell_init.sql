-- Bloomwell v1 — initial schema
-- Compliance rules 1–6 are enforced HERE (constraints + triggers), mirroring the
-- Axiom pattern: rules live in the schema and validators, not in vibes.

-- ============================================================================
-- Tenancy & users
-- ============================================================================

create table tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  brand_config jsonb default '{}',        -- white-label colors/logo/name (Track 2)
  created_at timestamptz default now()
);

-- Seed the direct-to-consumer tenant with a fixed id so it can be a column default.
insert into tenants (id, name)
values ('00000000-0000-0000-0000-000000000001', 'bloomwell-direct');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid references tenants(id) not null
    default '00000000-0000-0000-0000-000000000001',
  display_name text,
  timezone text default 'America/Los_Angeles',
  topics text[] default '{}',             -- education feed opt-ins (RULE 5)
  brief_channel text default 'app'
    check (brief_channel in ('app','telegram','email','sms')),
  sms_consent_at timestamptz,             -- RULE 6: null = no SMS ever
  telegram_chat_id text,                  -- set on bot pairing
  created_at timestamptz default now()
);

-- RULE 6: consent ledger — explicit, timestamped, revocable, per data source.
create table data_consents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade not null,
  source text not null,                   -- 'terra','food_log','lab_upload','mfp','cronometer'
  granted_at timestamptz default now(),
  revoked_at timestamptz
);

-- ============================================================================
-- Raw ingestion
-- ============================================================================

create table wearable_daily (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade not null,
  day date not null,
  sleep_score int, deep_sleep_min int, rem_min int,
  hrv_ms int, resting_hr int, readiness int, steps int,
  raw jsonb,
  unique (profile_id, day)
);

create table food_log (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade not null,
  logged_at timestamptz not null,
  description text,
  calories int, protein_g int, carbs_g int, fat_g int,
  quality_score int check (quality_score between 0 and 100),
  source text default 'voice'
    check (source in ('voice','mfp','cronometer','manual'))
);

create table habit_log (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade not null,
  logged_at timestamptz not null,
  kind text not null,                     -- 'exercise','meditation','hydration','custom'
  detail jsonb                            -- sets/reps/minutes etc.
);

-- ============================================================================
-- Labs
-- ============================================================================

create table lab_panels (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade not null,
  drawn_on date,
  source text default 'pdf_upload'
    check (source in ('pdf_upload','function_mcp')),
  created_at timestamptz default now()
);

create table biomarkers (
  id uuid primary key default gen_random_uuid(),
  panel_id uuid references lab_panels(id) on delete cascade not null,
  name text not null,                     -- 'LDL-C','HbA1c','Vitamin D'...
  value numeric, unit text,
  range_low numeric, range_high numeric,
  status text generated always as (
    case when value < range_low then 'below'
         when value > range_high then 'above'
         else 'in_range' end) stored,
  system_group text                       -- 'metabolic','cardio','hormonal'...
);

-- RULE 2: every out-of-range biomarker gets a doctor flag — plain English + the
-- exact question to ask a physician. Never paired with a supplement/protocol.
create table doctor_flags (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade not null,
  biomarker_id uuid references biomarkers(id) on delete cascade not null,
  plain_english text not null,
  question_for_doctor text not null,
  acknowledged_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================================================
-- Weekly output (RULES 1–4 enforced here)
-- ============================================================================

create table weekly_briefs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade not null,
  week_start date not null,
  trend_window_days int not null check (trend_window_days >= 7),          -- RULE 4
  recommendations jsonb not null
    check (jsonb_array_length(recommendations) between 1 and 2),          -- RULE 3
  doctor_flag_ids uuid[] default '{}',
  copy_validated boolean not null default false,                          -- RULE 1 gate
  delivered_at timestamptz,
  created_at timestamptz default now(),
  unique (profile_id, week_start)
);

-- RULE 2 trigger: no recommendation may target a biomarker that has a doctor flag,
-- and every recommendation must be behavior-only (never a substance).
-- Recommendation shape: {"kind": "behavior", "title": ..., "detail": ...,
--                        "biomarker": <optional biomarker name it relates to>}
create or replace function check_no_rec_on_flagged()
returns trigger
language plpgsql
as $$
declare
  rec jsonb;
  rec_biomarker text;
begin
  for rec in select jsonb_array_elements(new.recommendations)
  loop
    -- Behavior only. Substances (supplements, dosages, protocols) are permanently
    -- out of scope for the recommendation engine.
    if coalesce(rec->>'kind', '') <> 'behavior' then
      raise exception 'weekly_briefs: recommendation kind must be ''behavior'' (got %)',
        coalesce(rec->>'kind', 'null');
    end if;

    rec_biomarker := rec->>'biomarker';
    if rec_biomarker is not null and exists (
      select 1
      from doctor_flags df
      join biomarkers b on b.id = df.biomarker_id
      where df.profile_id = new.profile_id
        and lower(b.name) = lower(rec_biomarker)
    ) then
      raise exception
        'weekly_briefs: biomarker "%" has a doctor_flag — RULE 2 forbids pairing it with a recommendation',
        rec_biomarker;
    end if;
  end loop;

  return new;
end;
$$;

create trigger weekly_briefs_no_rec_on_flagged
  before insert or update on weekly_briefs
  for each row execute function check_no_rec_on_flagged();

-- RULE 1 gate: a brief can never be delivered unless it passed the copy validator.
create or replace function enforce_copy_validated_before_delivery()
returns trigger
language plpgsql
as $$
begin
  if new.delivered_at is not null and new.copy_validated = false then
    raise exception
      'weekly_briefs: cannot set delivered_at while copy_validated = false (RULE 1)';
  end if;
  return new;
end;
$$;

create trigger weekly_briefs_copy_validated_gate
  before insert or update on weekly_briefs
  for each row execute function enforce_copy_validated_before_delivery();

-- ============================================================================
-- Education feed (RULE 5: general content, topic-tagged, same for everyone)
-- ============================================================================

create table education_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id)
    default '00000000-0000-0000-0000-000000000001',
  title text, summary text, source_url text,
  topics text[] not null,
  published_on date,
  reviewed boolean default false,         -- human-in-loop before it hits any feed
  created_at timestamptz default now()
);
-- Deliberately NO profile_id here: education is never keyed to an individual's data.

-- ============================================================================
-- Validator audit log (RULE 1)
-- ============================================================================

create table copy_violations (
  id uuid primary key default gen_random_uuid(),
  source text not null,                   -- 'weekly_review','lab_decoder','education_curator'
  profile_id uuid references profiles(id) on delete set null,
  offending_text text not null,
  violations jsonb not null,              -- [{rule, match, suggestion}]
  created_at timestamptz default now()
);

-- ============================================================================
-- Row Level Security
-- ============================================================================
-- Policy model: users see only their own rows (profile_id = auth.uid()).
-- Server-side agents use the service-role key, which bypasses RLS.
-- Labs tables get the strictest treatment: no client-side insert/update at all.

alter table tenants          enable row level security;
alter table profiles         enable row level security;
alter table data_consents    enable row level security;
alter table wearable_daily   enable row level security;
alter table food_log         enable row level security;
alter table habit_log        enable row level security;
alter table lab_panels       enable row level security;
alter table biomarkers       enable row level security;
alter table doctor_flags     enable row level security;
alter table weekly_briefs    enable row level security;
alter table education_items  enable row level security;
alter table copy_violations  enable row level security;   -- no client policies: server-only

create policy "own profile" on profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy "own consents" on data_consents
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "own wearable data" on wearable_daily
  for select using (profile_id = auth.uid());

create policy "own food log" on food_log
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "own habit log" on habit_log
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- Labs: read-only from the client; writes only via service role (lab decoder agent).
create policy "own lab panels (read)" on lab_panels
  for select using (profile_id = auth.uid());

create policy "own biomarkers (read)" on biomarkers
  for select using (
    exists (select 1 from lab_panels p
            where p.id = biomarkers.panel_id and p.profile_id = auth.uid()));

create policy "own doctor flags (read)" on doctor_flags
  for select using (profile_id = auth.uid());

create policy "acknowledge own doctor flags" on doctor_flags
  for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "own weekly briefs (read)" on weekly_briefs
  for select using (profile_id = auth.uid());

-- Education: readable by any authenticated user of the same tenant, only once reviewed.
create policy "reviewed education by tenant" on education_items
  for select using (
    reviewed = true
    and tenant_id = (select tenant_id from profiles where id = auth.uid()));

create policy "own tenant (read)" on tenants
  for select using (
    id = (select tenant_id from profiles where id = auth.uid()));

-- ============================================================================
-- RULE 6: one-tap full deletion (hard delete + connector revocation hook)
-- ============================================================================
-- Cascades on profiles.id handle child rows. Call via RPC from the privacy center;
-- connector revocation (Terra etc.) is done by the API layer before invoking this.

create or replace function delete_all_my_data()
returns void
language plpgsql
security definer
as $$
begin
  delete from profiles where id = auth.uid();
end;
$$;
