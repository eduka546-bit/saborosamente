-- Vincula inscrição existente à conta recém-criada somente quando
-- telefone do perfil autenticado e identificador anônimo da sessão conferem.
-- Não cria contas e não transfere dados/consentimentos de outro telefone.
alter table public.sorteio_leads
  add column if not exists user_id uuid references auth.users(id) on delete set null;
create index if not exists sorteio_leads_user_id_idx on public.sorteio_leads(user_id);

create or replace function public.vincular_lead_sorteio_a_conta(p_session_id text)
returns boolean
language plpgsql security definer set search_path to ''
as $fn$
declare
  v_user_id uuid := (select auth.uid());
  v_telefone text;
  v_vinculado_id uuid;
begin
  if v_user_id is null then return false; end if;
  if p_session_id is null or length(p_session_id) not between 20 and 128
     or p_session_id !~ '^sess_[A-Za-z0-9_-]+$' then
    return false;
  end if;
  select regexp_replace(coalesce(p.telefone,''), '\D', '', 'g')
    into v_telefone from public.profiles p where p.id=v_user_id;
  if v_telefone is null then return false; end if;
  if left(v_telefone,2)='55' and length(v_telefone) in (12,13) then
    v_telefone := substring(v_telefone from 3);
  end if;
  if length(v_telefone) not in (10,11) then return false; end if;
  update public.sorteio_leads
     set user_id=v_user_id, updated_at=now()
   where session_id=p_session_id
     and telefone=v_telefone
     and (user_id is null or user_id=v_user_id)
  returning id into v_vinculado_id;
  return v_vinculado_id is not null;
end;
$fn$;
revoke all on function public.vincular_lead_sorteio_a_conta(text)
  from public,anon,authenticated;
grant execute on function public.vincular_lead_sorteio_a_conta(text) to authenticated;
