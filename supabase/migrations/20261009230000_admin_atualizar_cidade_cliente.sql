create or replace function public.atualizar_cidade_cliente_admin(p_cliente_id uuid,p_cidade text)
returns boolean language plpgsql security definer set search_path to ''
as $$
declare cidade_limpa text := nullif(btrim(coalesce(p_cidade,'')),'');
begin
 if not public.has_role((select auth.uid()),'admin'::public.app_role) then
  raise exception 'Somente administradores podem atualizar cidades' using errcode='42501';
 end if;
 if cidade_limpa is not null and length(cidade_limpa)>100 then
  raise exception 'Nome da cidade muito longo';
 end if;
 update public.profiles set cidade=cidade_limpa, updated_at=now() where id=p_cliente_id;
 return found;
end;
$$;
revoke all on function public.atualizar_cidade_cliente_admin(uuid,text) from public;
grant execute on function public.atualizar_cidade_cliente_admin(uuid,text) to authenticated;
