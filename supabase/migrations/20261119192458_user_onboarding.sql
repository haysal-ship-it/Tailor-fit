-- Apply before deploying the matching app update.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';
-- No account can be created between backfill and trigger installation.
lock table auth.users in share row exclusive mode;
create schema if not exists tailorfit_private;
revoke all on schema tailorfit_private from public, anon;
grant usage on schema tailorfit_private to authenticated;
create table public.user_onboarding (
  user_id uuid primary key references auth.users(id) on delete cascade,
  version smallint not null default 1 check (version=1),
  revision bigint not null default 1 check (revision>0),
  status text not null check (status in ('not_started','in_progress','deferred','completed','legacy_existing')),
  last_step smallint not null default 1 check (last_step in (1,2)),
  checklist_dismissed boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  completed_at timestamptz,
  check ((status='completed')=(completed_at is not null))
);
alter table public.user_onboarding enable row level security;
revoke all on public.user_onboarding from public, anon, authenticated;
grant select on public.user_onboarding to authenticated;
create policy own_onboarding_read on public.user_onboarding for select to authenticated
  using (user_id=(select auth.uid()));
-- Preserve saved progress; an empty workspace never proves an existing user is new.
insert into public.user_onboarding(user_id,status,last_step,checklist_dismissed,created_at,updated_at,completed_at)
select u.id,
  case when s.data#>>'{onboarding,studioSetup,version}'='1'
    and s.data#>>'{onboarding,studioSetup,status}' in ('in_progress','deferred','completed')
    then s.data#>>'{onboarding,studioSetup,status}' else 'legacy_existing' end,
  case when s.data#>>'{onboarding,studioSetup,lastStep}'='2'
    or s.data#>>'{onboarding,studioSetup,status}'='completed' then 2 else 1 end,
  coalesce(s.data#>>'{onboarding,studioSetup,checklistDismissed}'='true',false),
  u.created_at,coalesce(s.updated_at,u.created_at),
  case when s.data#>>'{onboarding,studioSetup,version}'='1'
    and s.data#>>'{onboarding,studioSetup,status}'='completed' then coalesce(s.updated_at,u.created_at) else null end
from auth.users u left join public.studio_settings s on s.id=u.id and s.owner_id=u.id
on conflict(user_id) do nothing;

create function tailorfit_private.initialize_user_onboarding() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.user_onboarding(user_id,status) values(new.id,'not_started') on conflict(user_id) do nothing;
  return new;
end;
$$;
revoke all on function tailorfit_private.initialize_user_onboarding() from public, anon, authenticated;
create trigger initialize_tailorfit_onboarding after insert on auth.users
  for each row execute function tailorfit_private.initialize_user_onboarding();

create function tailorfit_private.update_user_onboarding(
  p_expected_revision bigint, p_status text default null,
  p_last_step integer default null, p_checklist_dismissed boolean default null
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid(); current_state public.user_onboarding%rowtype;
  next_status text; next_step smallint; next_dismissed boolean;
begin
  if uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_expected_revision is null or p_expected_revision<1
    or (p_status is not null and p_status not in ('in_progress','deferred','completed'))
    or (p_last_step is not null and p_last_step not in (1,2)) then raise exception 'VALIDATION'; end if;
  select * into current_state from public.user_onboarding where user_id=uid for update;
  if not found then raise exception 'ONBOARDING_STATE_MISSING'; end if;
  next_status := coalesce(p_status,current_state.status);
  next_step := coalesce(p_last_step,current_state.last_step);
  next_dismissed := coalesce(p_checklist_dismissed,current_state.checklist_dismissed);
  -- Late tabs cannot undo completed setup. Legacy users may explicitly opt in.
  if current_state.status='completed' then next_status := 'completed'; end if;
  if next_status='completed' then next_step := 2; end if;
  if next_status=current_state.status and next_step=current_state.last_step
    and next_dismissed=current_state.checklist_dismissed then return to_jsonb(current_state); end if;
  if current_state.revision<>p_expected_revision then raise exception 'CONFLICT'; end if;
  if next_status='completed' and current_state.status<>'completed' then
    if not exists(select 1 from public.profiles p where p.id=uid and length(trim(p.display_name))>0)
      or not exists(select 1 from public.studio_settings s where s.id=uid and s.owner_id=uid
        and s.data->>'defaultUnit' in ('cm','in') and s.data->>'currency' ~ '^[A-Z]{3}$')
      then raise exception 'SETUP_DETAILS_REQUIRED'; end if;
  end if;
  update public.user_onboarding set status=next_status,last_step=next_step,
    checklist_dismissed=next_dismissed,revision=revision+1,updated_at=now(),
    completed_at=case when next_status='completed' then coalesce(completed_at,now()) else null end
    where user_id=uid returning * into current_state;
  return to_jsonb(current_state);
end;
$$;
revoke all on function tailorfit_private.update_user_onboarding(bigint,text,integer,boolean) from public, anon;
grant execute on function tailorfit_private.update_user_onboarding(bigint,text,integer,boolean) to authenticated;
create function public.update_user_onboarding(
 p_expected_revision bigint,p_status text default null,p_last_step integer default null,p_checklist_dismissed boolean default null
) returns jsonb language sql security invoker set search_path = '' as $$
 select tailorfit_private.update_user_onboarding(p_expected_revision,p_status,p_last_step,p_checklist_dismissed);
$$;
revoke all on function public.update_user_onboarding(bigint,text,integer,boolean) from public, anon;
grant execute on function public.update_user_onboarding(bigint,text,integer,boolean) to authenticated;
commit;
