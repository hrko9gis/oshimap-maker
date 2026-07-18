-- projects / spots / project_members（フェーズ5a）。合言葉はハッシュのみ（平文列を持たない＝案A）。
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users(id) on delete cascade,
  title jsonb not null,
  area_name jsonb not null,
  description jsonb not null,
  theme_type text not null default 'anime',
  default_language text not null default 'ja' check (default_language in ('ja','en')),
  visibility text not null default 'private' check (visibility in ('private','unlisted','public')),
  license text not null,
  disclaimer jsonb not null,
  official_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists spots (
  id text not null,
  project_id uuid not null references projects(id) on delete cascade,
  title jsonb not null,
  category text not null,
  work_title jsonb,
  summary jsonb not null,
  source_url text not null,
  source_name jsonb not null,
  address jsonb,
  lng double precision not null,
  lat double precision not null,
  location_accuracy text not null,
  stamp_enabled boolean not null default false,
  stamp_keyword_hash text,            -- 合言葉は SHA-256 ハッシュのみ。平文列は存在しない。
  stamp_keyword_hint jsonb,
  sort_order integer not null default 1,
  visit_difficulty text not null,
  estimated_stay_min integer,
  notes jsonb,
  status text not null default 'draft' check (status in ('draft','review','published')),
  primary key (project_id, id)
);

create table if not exists project_members (
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','editor','reviewer')),
  primary key (project_id, user_id)
);

-- オーナー作成時に自身を owner メンバーとして登録するトリガ
create or replace function add_owner_membership() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into project_members (project_id, user_id, role)
  values (new.id, new.owner, 'owner')
  on conflict do nothing;
  return new;
end; $$;
drop trigger if exists trg_add_owner on projects;
create trigger trg_add_owner after insert on projects
  for each row execute function add_owner_membership();

-- メンバーシップ判定（SECURITY DEFINER で RLS 再帰を回避。引数付き関数）
create or replace function is_member(pid uuid, min_role text) returns boolean
language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from project_members m
    where m.project_id = pid and m.user_id = auth.uid()
      and (
        min_role = 'reviewer'
        or (min_role = 'editor' and m.role in ('editor','owner'))
        or (min_role = 'owner' and m.role = 'owner')
      )
  );
$$;

alter table projects enable row level security;
alter table spots enable row level security;
alter table project_members enable row level security;

-- projects: メンバーは読取。作成は本人が owner。更新/削除は owner。
create policy projects_select on projects for select using (is_member(id, 'reviewer'));
create policy projects_insert on projects for insert with check (owner = auth.uid());
create policy projects_update on projects for update using (is_member(id, 'owner'));
create policy projects_delete on projects for delete using (is_member(id, 'owner'));

-- spots: メンバー読取、editor 以上で書込。
create policy spots_select on spots for select using (is_member(project_id, 'reviewer'));
create policy spots_write on spots for all
  using (is_member(project_id, 'editor')) with check (is_member(project_id, 'editor'));

-- project_members: メンバー読取、owner のみ変更。
create policy members_select on project_members for select using (is_member(project_id, 'reviewer'));
create policy members_write on project_members for all
  using (is_member(project_id, 'owner')) with check (is_member(project_id, 'owner'));
