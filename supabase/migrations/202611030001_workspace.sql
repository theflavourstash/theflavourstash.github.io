begin;
create table if not exists public.workspaces (
 user_id uuid primary key references auth.users(id) on delete cascade,
 document jsonb not null,
 revision bigint not null default 1 check (revision > 0),
 updated_at timestamptz not null default now(),
 constraint workspace_shape check (
   document->>'version' = '1'
   and jsonb_typeof(document->'flavours') = 'array'
   and jsonb_typeof(document->'recipes') = 'array'
   and jsonb_typeof(document->'batches') = 'array'
 )
);
alter table public.workspaces enable row level security;
revoke all on public.workspaces from anon, authenticated;
grant select on public.workspaces to authenticated;
create policy "Read own workspace" on public.workspaces for select to authenticated using ((select auth.uid()) = user_id);
-- All writes go through a compare-and-swap transaction. Stock and batch history
-- are one document, so neither can commit without the other. A stale device
-- must refresh and review before retrying; it cannot overwrite newer stock.
create or replace function public.save_workspace(new_document jsonb, expected_revision bigint)
returns bigint language plpgsql security definer set search_path = '' as $$
declare owner_id uuid := auth.uid(); next_revision bigint;
begin
 if owner_id is null then raise exception 'Sign in required' using errcode='42501'; end if;
 if expected_revision is null or expected_revision < 0 then raise exception 'Invalid revision'; end if;
 if new_document is null or new_document->>'version' is distinct from '1'
   or jsonb_typeof(new_document->'flavours') is distinct from 'array'
   or jsonb_typeof(new_document->'recipes') is distinct from 'array'
   or jsonb_typeof(new_document->'batches') is distinct from 'array'
   or pg_column_size(new_document) > 5242880 then raise exception 'Invalid workspace'; end if;
 if exists (select 1 from jsonb_array_elements(new_document->'flavours') f
   where jsonb_typeof(f->'amount') is distinct from 'number') then raise exception 'Invalid stock'; end if;
 if exists (select 1 from jsonb_array_elements(new_document->'flavours') f
   where (f->>'amount')::numeric < 0) then raise exception 'Negative stock'; end if;
 if expected_revision = 0 then
   insert into public.workspaces(user_id,document) values(owner_id,new_document)
   on conflict (user_id) do nothing returning revision into next_revision;
 else
   update public.workspaces set document=new_document,revision=revision+1,updated_at=now()
   where user_id=owner_id and revision=expected_revision returning revision into next_revision;
 end if;
 if next_revision is null then raise exception 'Collection changed on another device. Refresh and review before trying again.' using errcode='40001'; end if;
 return next_revision;
end;
$$;
revoke all on function public.save_workspace(jsonb,bigint) from public, anon;
grant execute on function public.save_workspace(jsonb,bigint) to authenticated;
commit;
