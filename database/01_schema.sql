-- =============================================================================
-- SaaS de Gestão Ambiental — Schema Supabase
-- Execute no SQL Editor do Supabase (dashboard → SQL Editor → New query)
-- =============================================================================

-- ─── Extensões ───────────────────────────────────────────────────────────────
create extension if not exists "unaccent";

-- ─── ENUMs ───────────────────────────────────────────────────────────────────

create type user_role as enum (
  'admin', 'director', 'environmental_engineer', 'biologist',
  'field_technician', 'commercial', 'financial', 'legal', 'designer', 'client'
);

create type license_type as enum (
  'LP', 'LI', 'LO', 'LAS', 'LAR', 'LUP', 'AAF', 'AUF', 'ADA', 'OTHER'
);

create type project_status as enum (
  'draft', 'in_progress', 'waiting_agency', 'pending_docs',
  'approved', 'rejected', 'archived'
);

create type condicionante_status as enum (
  'pending', 'in_progress', 'fulfilled', 'overdue', 'waived'
);

create type task_status as enum (
  'backlog', 'todo', 'in_progress', 'review', 'done'
);

create type task_priority as enum (
  'low', 'medium', 'high', 'urgent'
);

create type lead_stage as enum (
  'new', 'contacted', 'proposal_sent', 'negotiation', 'won', 'lost'
);

create type client_type as enum ('pf', 'pj');

create type document_category as enum (
  'report', 'license', 'study', 'map', 'photo',
  'contract', 'official_letter', 'other'
);

create type document_status as enum (
  'pending_upload', 'uploaded', 'processing', 'error'
);

create type notification_type as enum (
  'condicionante_due', 'task_due', 'license_expiring',
  'project_status_changed', 'document_uploaded', 'mention'
);

create type org_plan   as enum ('trial', 'starter', 'pro', 'enterprise');
create type org_status as enum ('trial', 'active', 'suspended', 'cancelled');

-- =============================================================================
-- TABELAS CORE
-- =============================================================================

-- ─── Organizations (tenants) ──────────────────────────────────────────────────
create table organizations (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null unique,
  document      text,
  plan          org_plan   not null default 'trial',
  status        org_status not null default 'trial',
  trial_ends_at timestamptz default (now() + interval '14 days'),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ─── Profiles (estende auth.users do Supabase) ───────────────────────────────
create table profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  name            text not null,
  role            user_role not null default 'environmental_engineer',
  avatar_url      text,
  phone           text,
  crea_number     text,
  status          text not null default 'active'
                  check (status in ('active', 'inactive')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Função auxiliar: retorna organization_id do usuário logado
create or replace function get_org_id()
returns uuid
language sql stable security definer
as $$
  select organization_id from profiles where id = auth.uid()
$$;

-- =============================================================================
-- TABELAS DE DOMÍNIO
-- =============================================================================

-- ─── Clientes ─────────────────────────────────────────────────────────────────
create table clients (
  id                       uuid primary key default gen_random_uuid(),
  organization_id          uuid not null references organizations(id) on delete cascade,
  type                     client_type not null default 'pj',
  name                     text not null,
  document                 text,
  email                    text,
  phone                    text,
  address                  text,
  city                     text,
  state                    text,
  notes                    text,
  portal_token             text unique default gen_random_uuid()::text,
  portal_token_expires_at  timestamptz,
  created_by               uuid references profiles(id),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

-- ─── Leads (CRM) ──────────────────────────────────────────────────────────────
create table leads (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references organizations(id) on delete cascade,
  name                  text not null,
  company               text,
  email                 text,
  phone                 text,
  document              text,
  source                text,
  stage                 lead_stage not null default 'new',
  estimated_value       numeric(12,2),
  notes                 text,
  assigned_to           uuid references profiles(id),
  converted_to_client_id uuid references clients(id),
  created_by            uuid references profiles(id),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ─── Atividades de Lead ───────────────────────────────────────────────────────
create table lead_activities (
  id              uuid primary key default gen_random_uuid(),
  lead_id         uuid not null references leads(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  type            text not null check (type in ('call','email','meeting','note','whatsapp')),
  description     text not null,
  created_by      uuid references profiles(id),
  created_at      timestamptz not null default now()
);

-- ─── Projetos ─────────────────────────────────────────────────────────────────
create table projects (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references organizations(id) on delete cascade,
  client_id             uuid not null references clients(id),
  name                  text not null,
  license_type          license_type   not null,
  status                project_status not null default 'draft',
  agency                text,
  protocol_number       text,
  license_number        text,
  license_issued_at     date,
  license_expires_at    date,
  license_validity_years int,
  description           text,
  progress_pct          int not null default 0 check (progress_pct between 0 and 100),
  created_by            uuid references profiles(id),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ─── Membros do projeto ───────────────────────────────────────────────────────
create table project_members (
  project_id      uuid not null references projects(id) on delete cascade,
  profile_id      uuid not null references profiles(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  primary key (project_id, profile_id)
);

-- ─── Condicionantes ───────────────────────────────────────────────────────────
create table condicionantes (
  id                uuid primary key default gen_random_uuid(),
  project_id        uuid not null references projects(id) on delete cascade,
  organization_id   uuid not null references organizations(id) on delete cascade,
  title             text not null,
  description       text,
  due_date          date,
  status            condicionante_status not null default 'pending',
  alert_days_before int not null default 30,
  fulfilled_at      timestamptz,
  created_by        uuid references profiles(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ─── Templates de checklist ───────────────────────────────────────────────────
create table checklist_templates (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name            text not null,
  license_type    license_type not null,
  is_default      boolean not null default false,
  created_by      uuid references profiles(id),
  created_at      timestamptz not null default now()
);

create table checklist_template_items (
  id          uuid primary key default gen_random_uuid(),
  template_id uuid not null references checklist_templates(id) on delete cascade,
  title       text not null,
  description text,
  "order"     int not null default 0
);

-- ─── Checklist do projeto (gerado a partir do template) ───────────────────────
create table project_checklist_items (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references projects(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  title           text not null,
  description     text,
  "order"         int not null default 0,
  completed       boolean not null default false,
  completed_at    timestamptz,
  completed_by    uuid references profiles(id),
  created_at      timestamptz not null default now()
);

-- ─── Tarefas ──────────────────────────────────────────────────────────────────
create table tasks (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  project_id      uuid references projects(id),
  parent_task_id  uuid references tasks(id),
  title           text not null,
  description     text,
  status          task_status    not null default 'backlog',
  priority        task_priority  not null default 'medium',
  assigned_to     uuid references profiles(id),
  due_date        date,
  estimated_hours numeric(5,1),
  created_by      uuid references profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ─── Comentários de tarefa ────────────────────────────────────────────────────
create table task_comments (
  id              uuid primary key default gen_random_uuid(),
  task_id         uuid not null references tasks(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  body            text not null,
  created_by      uuid references profiles(id),
  created_at      timestamptz not null default now()
);

-- ─── Documentos ───────────────────────────────────────────────────────────────
create table documents (
  id                   uuid primary key default gen_random_uuid(),
  organization_id      uuid not null references organizations(id) on delete cascade,
  project_id           uuid references projects(id),
  uploaded_by          uuid references profiles(id),
  name                 text not null,
  filename             text not null,
  mime_type            text not null,
  size_bytes           bigint not null default 0,
  storage_path         text not null,
  category             document_category not null default 'other',
  status               document_status   not null default 'pending_upload',
  is_visible_to_client boolean not null default false,
  created_at           timestamptz not null default now()
);

-- ─── Notificações ─────────────────────────────────────────────────────────────
create table notifications (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id         uuid not null references profiles(id) on delete cascade,
  type            notification_type not null,
  title           text not null,
  body            text not null,
  read            boolean not null default false,
  link            text,
  created_at      timestamptz not null default now()
);

-- =============================================================================
-- ÍNDICES
-- =============================================================================

create index on profiles          (organization_id);
create index on clients           (organization_id);
create index on leads             (organization_id, stage);
create index on lead_activities   (lead_id);
create index on projects          (organization_id, status);
create index on projects          (client_id);
create index on condicionantes    (project_id);
create index on condicionantes    (organization_id, status, due_date);
create index on project_checklist_items (project_id);
create index on tasks             (organization_id, status);
create index on tasks             (assigned_to);
create index on tasks             (project_id);
create index on documents         (organization_id);
create index on documents         (project_id);
create index on notifications     (user_id, read);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

alter table organizations           enable row level security;
alter table profiles                enable row level security;
alter table clients                 enable row level security;
alter table leads                   enable row level security;
alter table lead_activities         enable row level security;
alter table projects                enable row level security;
alter table project_members         enable row level security;
alter table condicionantes          enable row level security;
alter table checklist_templates     enable row level security;
alter table checklist_template_items enable row level security;
alter table project_checklist_items enable row level security;
alter table tasks                   enable row level security;
alter table task_comments           enable row level security;
alter table documents               enable row level security;
alter table notifications           enable row level security;

-- ─── Policies ────────────────────────────────────────────────────────────────

-- organizations: membro só vê a própria org
create policy "org_select" on organizations for select
  using (id = get_org_id());

-- profiles: só vê perfis da própria org
create policy "profiles_select" on profiles for select
  using (organization_id = get_org_id());

create policy "profiles_update_own" on profiles for update
  using (id = auth.uid());

-- clients
create policy "clients_all" on clients for all
  using (organization_id = get_org_id());

-- leads
create policy "leads_all" on leads for all
  using (organization_id = get_org_id());

-- lead_activities
create policy "lead_activities_all" on lead_activities for all
  using (organization_id = get_org_id());

-- projects
create policy "projects_all" on projects for all
  using (organization_id = get_org_id());

-- project_members
create policy "project_members_all" on project_members for all
  using (organization_id = get_org_id());

-- condicionantes
create policy "condicionantes_all" on condicionantes for all
  using (organization_id = get_org_id());

-- checklist_templates
create policy "checklist_templates_all" on checklist_templates for all
  using (organization_id = get_org_id());

-- checklist_template_items (acesso via template da org)
create policy "checklist_template_items_all" on checklist_template_items for all
  using (
    template_id in (
      select id from checklist_templates where organization_id = get_org_id()
    )
  );

-- project_checklist_items
create policy "project_checklist_items_all" on project_checklist_items for all
  using (organization_id = get_org_id());

-- tasks
create policy "tasks_all" on tasks for all
  using (organization_id = get_org_id());

-- task_comments
create policy "task_comments_all" on task_comments for all
  using (organization_id = get_org_id());

-- documents
create policy "documents_all" on documents for all
  using (organization_id = get_org_id());

-- notifications: cada usuário só vê as próprias
create policy "notifications_select" on notifications for select
  using (user_id = auth.uid());

create policy "notifications_update" on notifications for update
  using (user_id = auth.uid());

-- =============================================================================
-- TRIGGER: updated_at automático
-- =============================================================================

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on organizations
  for each row execute function set_updated_at();

create trigger set_updated_at before update on profiles
  for each row execute function set_updated_at();

create trigger set_updated_at before update on clients
  for each row execute function set_updated_at();

create trigger set_updated_at before update on leads
  for each row execute function set_updated_at();

create trigger set_updated_at before update on projects
  for each row execute function set_updated_at();

create trigger set_updated_at before update on condicionantes
  for each row execute function set_updated_at();

create trigger set_updated_at before update on tasks
  for each row execute function set_updated_at();

-- =============================================================================
-- TRIGGER: criar profile automaticamente ao registrar usuário
-- =============================================================================

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, organization_id, name, role)
  values (
    new.id,
    (new.raw_user_meta_data->>'organization_id')::uuid,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'admin')::user_role
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
