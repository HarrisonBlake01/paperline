-- =====================================================================
-- Paperline — community templates (0006)
-- =====================================================================
-- Lets users publish reusable templates, upvote them, and copy them into
-- their workspace without re-running AI generation.
-- =====================================================================

alter table templates
  add column if not exists is_community boolean not null default false,
  add column if not exists source_template_id uuid references templates(id) on delete set null,
  add column if not exists published_by text,
  add column if not exists published_at timestamptz,
  add column if not exists upvotes_count int not null default 0,
  add column if not exists uses_count int not null default 0;

create index if not exists templates_community_idx
  on templates(is_community, upvotes_count desc, uses_count desc)
  where is_community = true;

create table if not exists template_votes (
  template_id uuid not null references templates(id) on delete cascade,
  user_id text not null,
  created_at timestamptz not null default now(),
  primary key (template_id, user_id)
);

alter table template_votes enable row level security;

-- Replace template read policy so community templates are discoverable.
drop policy if exists templates_select on templates;
create policy templates_select on templates
  for select using (
    workspace_id is null
    or is_community = true
    or is_workspace_member(workspace_id)
  );

-- Votes are public counts, but each user can only manage their own vote.
drop policy if exists template_votes_select on template_votes;
create policy template_votes_select on template_votes
  for select using (true);

drop policy if exists template_votes_write on template_votes;
create policy template_votes_write on template_votes
  for all using (user_id = auth.jwt() ->> 'sub');
