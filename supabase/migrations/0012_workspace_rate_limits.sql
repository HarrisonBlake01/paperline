-- Durable per-workspace request limits for expensive document/AI operations.
-- Apply after 0011_security_hardening.sql and before deploying routes that call
-- consume_workspace_rate_limit.

create table if not exists public.workspace_rate_limits (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  action text not null check (char_length(action) between 1 and 64),
  window_start timestamptz not null,
  request_count integer not null default 1 check (request_count > 0),
  primary key (workspace_id, action, window_start)
);

create index if not exists workspace_rate_limits_window_idx
  on public.workspace_rate_limits(window_start);

alter table public.workspace_rate_limits enable row level security;
revoke all on table public.workspace_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on table public.workspace_rate_limits to service_role;

create or replace function public.consume_workspace_rate_limit(
  p_workspace_id uuid,
  p_action text,
  p_limit integer,
  p_window_seconds integer
)
returns table (
  allowed boolean,
  remaining integer,
  reset_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_window_start timestamptz;
  v_count integer;
begin
  if p_workspace_id is null
     or p_action is null
     or char_length(p_action) not between 1 and 64
     or p_limit < 1
     or p_window_seconds < 1
     or p_window_seconds > 86400 then
    raise exception 'invalid rate-limit parameters';
  end if;

  if not exists (
    select 1 from public.workspaces w where w.id = p_workspace_id
  ) then
    raise exception 'workspace not found';
  end if;

  v_window_start := to_timestamp(
    floor(extract(epoch from statement_timestamp()) / p_window_seconds)
      * p_window_seconds
  );

  insert into public.workspace_rate_limits (
    workspace_id,
    action,
    window_start,
    request_count
  )
  values (p_workspace_id, p_action, v_window_start, 1)
  on conflict (workspace_id, action, window_start)
  do update set request_count = public.workspace_rate_limits.request_count + 1
  returning request_count into v_count;

  return query
  select
    v_count <= p_limit,
    greatest(p_limit - v_count, 0),
    v_window_start + make_interval(secs => p_window_seconds);
end;
$$;

revoke all on function public.consume_workspace_rate_limit(uuid, text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_workspace_rate_limit(uuid, text, integer, integer)
  to service_role;
