-- Only guarded functions can write delivery records; clients may read their own history.
create table public.invoice_sends (
  id uuid primary key, owner_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid not null, fingerprint text not null check(length(fingerprint)=64), recipient text not null,
  lease uuid not null default gen_random_uuid(), provider_message_id text,
  status text not null default 'pending' check(status in ('pending','accepted','failed')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key(owner_id,order_id) references public.orders(owner_id,id) on delete cascade
);
alter table public.invoice_sends enable row level security;
revoke all on public.invoice_sends from public,anon,authenticated;
grant select(id,owner_id,order_id,fingerprint,recipient,provider_message_id,status,created_at,updated_at) on public.invoice_sends to authenticated;
create policy own_invoice_history on public.invoice_sends for select to authenticated using(owner_id=(select auth.uid()));
create index invoice_sends_rate on public.invoice_sends(owner_id,order_id,created_at);

-- Definer rights are limited to this bookkeeping operation so clients cannot
-- bypass the rate limit by directly inserting/updating/deleting ledger rows.
create function public.reserve_invoice_send(p_request uuid,p_order uuid,p_fingerprint text,p_recipient text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); existing public.invoice_sends; recipient text;
begin
  if uid is null then raise exception 'AUTH_REQUIRED'; end if;
  perform pg_advisory_xact_lock(hashtextextended(uid::text||p_order::text,0));
  select c.data->>'email' into recipient from public.orders o join public.clients c on c.id=o.client_id and c.owner_id=o.owner_id where o.id=p_order and o.owner_id=uid;
  if not found or recipient is distinct from p_recipient then raise exception 'CONFLICT'; end if;
  select * into existing from public.invoice_sends where id=p_request;
  if found then
    if existing.owner_id<>uid or existing.order_id<>p_order or existing.fingerprint<>p_fingerprint or existing.recipient<>p_recipient then raise exception 'CONFLICT'; end if;
    if existing.status<>'accepted' and existing.created_at<now()-interval '23 hours' then raise exception 'RETRY_EXPIRED'; end if;
    return jsonb_build_object('id',existing.id,'lease',existing.lease,'status',existing.status);
  end if;
  if (select count(*) from public.invoice_sends where owner_id=uid and order_id=p_order and created_at>now()-interval '1 hour')>=5 then raise exception 'RATE_LIMIT'; end if;
  insert into public.invoice_sends(id,owner_id,order_id,fingerprint,recipient) values(p_request,uid,p_order,p_fingerprint,p_recipient) returning * into existing;
  return jsonb_build_object('id',existing.id,'lease',existing.lease,'status',existing.status);
end $$;
revoke all on function public.reserve_invoice_send(uuid,uuid,text,text) from public,anon;
grant execute on function public.reserve_invoice_send(uuid,uuid,text,text) to authenticated;

create function public.finish_invoice_send(p_request uuid,p_lease uuid,p_provider text,p_failed boolean) returns void
language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  update public.invoice_sends set status=case when p_failed then 'failed' else 'accepted' end,provider_message_id=p_provider,updated_at=now()
  where id=p_request and owner_id=auth.uid() and lease=p_lease and status<>'accepted';
end $$;
revoke all on function public.finish_invoice_send(uuid,uuid,text,boolean) from public,anon;
grant execute on function public.finish_invoice_send(uuid,uuid,text,boolean) to authenticated;
