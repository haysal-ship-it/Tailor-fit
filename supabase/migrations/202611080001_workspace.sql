-- TailorFit: run once per Supabase environment. No service-role access is used by the app.
create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '', created_at timestamptz not null default now()
);
create table public.clients (
  id uuid primary key, owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  data jsonb not null, version integer not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(owner_id,id), check(jsonb_typeof(data)='object'), check(length(data->>'name') between 1 and 200)
);
create table public.measurement_snapshots (
  id uuid primary key, owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  data jsonb not null, version integer not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  client_id uuid generated always as ((data->>'clientId')::uuid) stored not null,
  unique(owner_id,id), unique(owner_id,client_id,id),
  foreign key(owner_id,client_id) references public.clients(owner_id,id) on delete cascade,
  check(data->>'unit' in ('cm','in')), check(jsonb_typeof(data->'measurements')='object')
);
create table public.orders (
  id uuid primary key, owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  data jsonb not null, version integer not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  client_id uuid generated always as ((data->>'clientId')::uuid) stored not null,
  snapshot_id uuid generated always as (nullif(data->>'measurementSnapshotId','')::uuid) stored,
  unique(owner_id,id),
  foreign key(owner_id,client_id) references public.clients(owner_id,id) on delete cascade,
  foreign key(owner_id,client_id,snapshot_id) references public.measurement_snapshots(owner_id,client_id,id) deferrable initially deferred,
  check(data->>'status' in ('Pending','Completed','Paused','In Progress','Ready','Picked Up')),
  check((data->>'price')::numeric >= 0), check(jsonb_array_length(data->'referenceImages') <= 6)
);
create table public.studio_settings (
  id uuid primary key references auth.users(id) on delete cascade, owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  data jsonb not null, version integer not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check(id=owner_id), check(data->>'defaultUnit' in ('cm','in'))
);
create table public.attachments (
  id uuid primary key, owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  object_path text not null unique, mime_type text not null check(mime_type in ('image/jpeg','image/png','image/webp')),
  byte_size bigint not null check(byte_size > 0 and byte_size <= 5242880),
  client_id uuid, order_id uuid, created_at timestamptz not null default now(), cleanup_after timestamptz default (now()+interval '24 hours'),
  check(split_part(object_path,'/',1)=owner_id::text),
  foreign key(owner_id,client_id) references public.clients(owner_id,id) on delete set null (client_id),
  foreign key(owner_id,order_id) references public.orders(owner_id,id) on delete set null (order_id)
);
create table public.import_runs (
  id uuid not null, owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(), result jsonb not null, primary key(owner_id,id)
);
create table public.mutation_receipts (
  id uuid not null, owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(), result jsonb not null, primary key(owner_id,id)
);

do $$ declare t text; begin
  foreach t in array array['clients','measurement_snapshots','orders','studio_settings','attachments','import_runs','mutation_receipts'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('create policy own_records on public.%I for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()))',t);
    execute format('grant select, insert, update, delete on public.%I to authenticated',t);
    execute format('revoke all on public.%I from anon',t);
    execute format('create index on public.%I (owner_id)',t);
  end loop;
end $$;
alter table public.profiles enable row level security;
create policy own_profile on public.profiles for all to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
grant select,insert,update,delete on public.profiles to authenticated;
revoke all on public.profiles from anon;
create index on public.orders(owner_id,client_id);
create index on public.measurement_snapshots(owner_id,client_id);

create function public.server_record_fields() returns trigger language plpgsql set search_path = '' as $$
begin
  if TG_OP='UPDATE' then
    if new.owner_id <> old.owner_id or new.id <> old.id then raise exception 'Ownership cannot change'; end if;
    new.version := old.version+1; new.created_at := old.created_at;
  else new.version := 1; new.created_at := now(); end if;
  new.updated_at := now();
  new.data := new.data - 'version' - 'createdAt' - 'updatedAt' - 'owner_id' - 'ownerId' - 'id';
  return new;
end $$;
do $$ declare t text; begin
  foreach t in array array['clients','measurement_snapshots','orders','studio_settings'] loop
    execute format('create trigger server_fields before insert or update on public.%I for each row execute function public.server_record_fields()',t);
  end loop;
end $$;

create function public.unlink_snapshot() returns trigger language plpgsql set search_path = '' as $$
begin
  update public.orders set data=data-'measurementSnapshotId' where owner_id=old.owner_id and snapshot_id=old.id;
  return old;
end $$;
create trigger unlink_snapshot before delete on public.measurement_snapshots for each row execute function public.unlink_snapshot();

create function public.queue_attachment_cleanup() returns trigger language plpgsql set search_path = '' as $$
begin
  if (old.client_id is not null and new.client_id is null) or (old.order_id is not null and new.order_id is null) then
    new.cleanup_after := now();
  end if;
  return new;
end $$;
create trigger queue_cleanup before update on public.attachments for each row execute function public.queue_attachment_cleanup();

-- All operations in a request commit together. A receipt makes replay safe.
create function public.commit_records(p_request uuid,p_operations jsonb) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare uid uuid:=auth.uid(); op jsonb; saved jsonb; result jsonb:='[]'; target text; affected integer; asset jsonb; file_path text;
begin
  if uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if jsonb_typeof(p_operations)<>'array' or jsonb_array_length(p_operations)>20000 then raise exception 'VALIDATION'; end if;
  perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
  select r.result into saved from public.mutation_receipts r where r.owner_id=uid and r.id=p_request;
  if found then return saved; end if;
  for op in select * from jsonb_array_elements(p_operations) loop
    target:=op->>'kind';
    if target not in ('clients','measurement_snapshots','orders','studio_settings') then raise exception 'VALIDATION'; end if;
    if op->>'action'='delete' then
      execute format('delete from public.%I where id=$1 and owner_id=$2 and version=$3 returning to_jsonb(%I.*)',target,target)
        into saved using (op->>'id')::uuid,uid,(op->>'expected')::integer;
      get diagnostics affected=row_count;
      if affected<>1 then raise exception 'CONFLICT'; end if;
    elsif op->>'action'='put' then
      if (op->>'expected')::integer=0 then
        execute format('insert into public.%I (id,owner_id,data) values($1,$2,$3) returning to_jsonb(%I.*)',target,target)
          into saved using (op->>'id')::uuid,uid,op->'data';
      else
        execute format('update public.%I set data=$3 where id=$1 and owner_id=$2 and version=$4 returning to_jsonb(%I.*)',target,target)
          into saved using (op->>'id')::uuid,uid,op->'data',(op->>'expected')::integer;
        get diagnostics affected=row_count;
        if affected<>1 then raise exception 'CONFLICT'; end if;
      end if;
      if target in ('orders','clients') then
        update public.attachments set order_id=null,client_id=null,cleanup_after=now()
          where owner_id=uid and ((target='orders' and order_id=(op->>'id')::uuid) or (target='clients' and client_id=(op->>'id')::uuid and order_id is null));
        for asset in select * from jsonb_array_elements(case when target='orders' then coalesce(op->'data'->'referenceImages','[]') else jsonb_build_array(jsonb_build_object('storagePath',op->'data'->>'photoPath')) end) loop
          file_path:=asset->>'storagePath';
          if file_path is not null then
            update public.attachments set client_id=case when target='clients' then (op->>'id')::uuid else null end,
              order_id=case when target='orders' then (op->>'id')::uuid else null end,cleanup_after=null
              where owner_id=uid and object_path=file_path;
            get diagnostics affected=row_count;
            if affected<>1 then raise exception 'VALIDATION: missing attachment'; end if;
          end if;
        end loop;
      end if;
    else raise exception 'VALIDATION'; end if;
    result:=result||jsonb_build_array(jsonb_build_object('kind',target,'action',op->>'action','record',saved));
  end loop;
  insert into public.mutation_receipts(id,owner_id,result) values(p_request,uid,result);
  return result;
end $$;
revoke all on function public.commit_records(uuid,jsonb) from public,anon;
grant execute on function public.commit_records(uuid,jsonb) to authenticated;

create function public.import_workspace(p_run uuid,p_operations jsonb,p_replace boolean,p_expected_version integer) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare uid uuid:=auth.uid(); previous jsonb; result jsonb; current_version integer;
begin
  if uid is null then raise exception 'AUTH_REQUIRED'; end if;
  perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
  select r.result into previous from public.import_runs r where r.owner_id=uid and r.id=p_run;
  if found then return previous; end if;
  select coalesce(sum(version),0)::integer into current_version from (
    select version from public.clients where owner_id=uid union all select version from public.orders where owner_id=uid union all select version from public.measurement_snapshots where owner_id=uid union all select version from public.studio_settings where owner_id=uid
  ) records;
  if p_replace and current_version<>p_expected_version then raise exception 'CONFLICT'; end if;
  if p_replace then
    delete from public.orders where owner_id=uid;
    delete from public.measurement_snapshots where owner_id=uid;
    delete from public.clients where owner_id=uid;
    delete from public.studio_settings where owner_id=uid;
  end if;
  result:=public.commit_records(p_run,p_operations);
  insert into public.import_runs(id,owner_id,result) values(p_run,uid,result);
  return result;
end $$;
revoke all on function public.import_workspace(uuid,jsonb,boolean,integer) from public,anon;
grant execute on function public.import_workspace(uuid,jsonb,boolean,integer) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('workspace-images','workspace-images',false,5242880,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create policy own_image_read on storage.objects for select to authenticated using(bucket_id='workspace-images' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy own_image_insert on storage.objects for insert to authenticated with check(bucket_id='workspace-images' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy own_image_delete on storage.objects for delete to authenticated using(bucket_id='workspace-images' and (storage.foldername(name))[1]=(select auth.uid())::text);
