-- Vinculação segura de pedidos anteriores: apenas titular com telefone verificado
-- ou administrador confirmando conta existente e telefone sem ambiguidades.
create or replace function public.vincular_historico_whatsapp_verificado()
returns integer language plpgsql security definer set search_path = ''
as $$
declare
 v_phone text;
 v_digits text;
 v_qtd integer := 0;
begin
 if auth.uid() is null then raise exception 'Entre na sua conta.' using errcode='42501'; end if;
 select regexp_replace(coalesce(u.phone,''),'[^0-9]','','g')
 into v_digits
 from auth.users u where u.id = auth.uid() and u.phone_confirmed_at is not null;
 if v_digits is null then return 0; end if;
 if length(v_digits) in (12,13) and left(v_digits,2)='55' then
   v_digits:=substring(v_digits from 3);
 end if;
 if length(v_digits) not in (10,11) then return 0; end if;
 v_phone:=v_digits;

 -- Nunca vincular telefone que esteja confirmado em mais de uma conta.
 if (select count(*) from auth.users u
   where u.phone_confirmed_at is not null
     and right(regexp_replace(coalesce(u.phone,''),'[^0-9]','','g'),length(v_phone))=v_phone) <> 1
 then return 0; end if;

 update public.pedidos p set user_id = auth.uid()
 where p.origem = 'whatsapp' and p.user_id is null
 and (
   case
     when length(regexp_replace(coalesce(p.telefone_cliente,''),'[^0-9]','','g')) in (12,13)
       and left(regexp_replace(coalesce(p.telefone_cliente,''),'[^0-9]','','g'),2)='55'
     then substring(regexp_replace(p.telefone_cliente,'[^0-9]','','g') from 3)
     else regexp_replace(coalesce(p.telefone_cliente,''),'[^0-9]','','g')
   end
 ) = v_phone;
 get diagnostics v_qtd = row_count;
 return v_qtd;
end;
$$;
revoke all on function public.vincular_historico_whatsapp_verificado() from public,anon;
grant execute on function public.vincular_historico_whatsapp_verificado() to authenticated;

create or replace function public.vincular_historico_whatsapp_admin(p_cliente_id uuid)
returns integer language plpgsql security definer set search_path = ''
as $$
declare v_phone text; v_qtd integer := 0;
begin
 if not exists (
  select 1 from public.user_roles
  where user_id=auth.uid() and role='admin'
 ) then raise exception 'Acesso administrativo necessário.' using errcode='42501'; end if;
 select regexp_replace(coalesce(telefone,''),'[^0-9]','','g')
 into v_phone from public.profiles where id=p_cliente_id;
 if v_phone is null then raise exception 'Conta não encontrada.' using errcode='22023'; end if;
 if length(v_phone) in (12,13) and left(v_phone,2)='55' then
   v_phone:=substring(v_phone from 3);
 end if;
 if length(v_phone) not in (10,11) then
   raise exception 'Informe um telefone válido na conta do cliente.' using errcode='22023';
 end if;
 if (select count(*) from public.profiles p
  where (case
    when length(regexp_replace(coalesce(p.telefone,''),'[^0-9]','','g')) in (12,13)
       and left(regexp_replace(coalesce(p.telefone,''),'[^0-9]','','g'),2)='55'
    then substring(regexp_replace(p.telefone,'[^0-9]','','g') from 3)
    else regexp_replace(coalesce(p.telefone,''),'[^0-9]','','g')
  end)=v_phone) <> 1 then
    raise exception 'Telefone duplicado entre contas. Confirme a identidade antes de vincular.' using errcode='22023';
 end if;
 update public.pedidos p set user_id=p_cliente_id
 where p.origem='whatsapp' and p.user_id is null
 and (case
    when length(regexp_replace(coalesce(p.telefone_cliente,''),'[^0-9]','','g')) in (12,13)
       and left(regexp_replace(coalesce(p.telefone_cliente,''),'[^0-9]','','g'),2)='55'
    then substring(regexp_replace(p.telefone_cliente,'[^0-9]','','g') from 3)
    else regexp_replace(coalesce(p.telefone_cliente,''),'[^0-9]','','g')
  end)=v_phone;
 get diagnostics v_qtd=row_count;
 return v_qtd;
end;
$$;
revoke all on function public.vincular_historico_whatsapp_admin(uuid) from public,anon;
grant execute on function public.vincular_historico_whatsapp_admin(uuid) to authenticated;
