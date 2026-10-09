
create or replace function public.sorteio_config_admin()
returns jsonb
language plpgsql security definer set search_path to ''
as $fn$
declare v_s public.site_settings%rowtype;
begin
  if not public.has_role((select auth.uid()),'admin'::public.app_role) then
    raise exception 'Acesso administrativo obrigatório' using errcode='42501';
  end if;
  select * into v_s from public.site_settings limit 1;
  return jsonb_build_object(
    'ativo',coalesce(v_s.sorteio_ativo,false),
    'regulamento_url',v_s.sorteio_regulamento_url,
    'certificado',v_s.sorteio_certificado
  );
end;
$fn$;
revoke all on function public.sorteio_config_admin() from public,anon,authenticated;
grant execute on function public.sorteio_config_admin() to authenticated;

create or replace function public.atualizar_sorteio_config_admin(
  p_ativo boolean,p_regulamento_url text,p_certificado text
)
returns jsonb
language plpgsql security definer set search_path to ''
as $fn$
begin
  if not public.has_role((select auth.uid()),'admin'::public.app_role) then
    raise exception 'Acesso administrativo obrigatório' using errcode='42501';
  end if;
  if p_ativo and
    (nullif(btrim(p_certificado),'') is null or
     p_regulamento_url !~* '^https://') then
    raise exception 'Informe o certificado de autorização e a URL HTTPS do regulamento aprovado.';
  end if;
  update public.site_settings set
    sorteio_ativo=coalesce(p_ativo,false),
    sorteio_regulamento_url=nullif(btrim(left(coalesce(p_regulamento_url,''),1024)),''),
    sorteio_certificado=nullif(btrim(left(coalesce(p_certificado,''),200)),''),
    updated_at=now();
  return public.sorteio_config_admin();
end;
$fn$;
revoke all on function public.atualizar_sorteio_config_admin(boolean,text,text) from public,anon,authenticated;
grant execute on function public.atualizar_sorteio_config_admin(boolean,text,text) to authenticated;
