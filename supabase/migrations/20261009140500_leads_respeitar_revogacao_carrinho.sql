
create or replace function public.enriquecer_carrinho_com_lead_sorteio()
returns trigger language plpgsql security definer set search_path to ''
as $function$
declare v_lead record;
begin
  if new.user_id is not null or new.status <> 'abandonado' then return new; end if;
  -- Identificação acontece UMA vez. O visitante pode revogar consentimento
  -- no checkout; atualizações posteriores do carrinho jamais o restauram.
  if new.lead_capturado_em is not null then return new; end if;
  select nome,telefone,optin_carrinho
    into v_lead
    from public.sorteio_leads
   where session_id=new.session_id and status='participando'
   order by created_at desc limit 1;
  if not found then return new; end if;
  new.nome := coalesce(nullif(btrim(new.nome),''),v_lead.nome);
  new.telefone := coalesce(nullif(btrim(new.telefone),''),v_lead.telefone);
  new.lead_capturado_em := now();
  if v_lead.optin_carrinho then
    new.recuperacao_whatsapp_consentimento := true;
    new.recuperacao_whatsapp_consentido_em :=
      coalesce(new.recuperacao_whatsapp_consentido_em,now());
  end if;
  return new;
end;
$function$;
