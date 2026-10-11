-- Visão segura da lista de pré-cadastros por número, incluindo opt-ins já revogados.
-- Não cria usuários em auth nem duplica perfis de clientes existentes.
create or replace function public.listar_whatsapp_cadastros_admin()
returns table(
  telefone text,
  nome text,
  consentimento boolean,
  cadastrado_em timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.has_role((select auth.uid()),'admin'::public.app_role) then
    raise exception 'Acesso administrativo obrigatório' using errcode='42501';
  end if;

  return query
    select o.telefone,
           nullif(btrim(o.nome),'')::text,
           o.consentimento,
           o.criado_em
      from public.whatsapp_ofertas_optins o
     order by o.criado_em desc
     limit 10000;
end;
$$;
revoke all on function public.listar_whatsapp_cadastros_admin() from public;
grant execute on function public.listar_whatsapp_cadastros_admin() to authenticated;
comment on function public.listar_whatsapp_cadastros_admin() is
  'Pré-cadastros captados pelo carrinho, identificados por telefone e com consentimento independente. Acesso exclusivo de admin.';
