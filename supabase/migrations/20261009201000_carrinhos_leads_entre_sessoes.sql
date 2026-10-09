-- Mantem vinculacao de carrinhos ao lead mesmo se ja ganhou um sorteio.
-- Sessao conhecida ou conta autenticada: nao faz busca publica por telefone.
create or replace function public.enriquecer_carrinho_com_lead_sorteio()
returns trigger language plpgsql security definer set search_path to ''
as $$
declare v_lead record;
begin
 if new.status <> 'abandonado' or new.lead_capturado_em is not null then return new; end if;
 select l.nome,l.telefone,l.optin_carrinho into v_lead
 from public.sorteio_leads l
 where (l.session_id=new.session_id or (new.user_id is not null and l.user_id=new.user_id))
 order by case when l.session_id=new.session_id then 0 else 1 end, l.created_at desc limit 1;
 if not found then return new; end if;
 new.nome:=coalesce(nullif(btrim(new.nome),''),v_lead.nome);
 new.telefone:=coalesce(nullif(btrim(new.telefone),''),v_lead.telefone);
 new.lead_capturado_em:=now();
 -- Nao sobrepoe uma revogacao explicita registrada previamente.
 if v_lead.optin_carrinho and new.recuperacao_whatsapp_consentido_em is null
   and new.recuperacao_whatsapp_consentimento is distinct from false then
   new.recuperacao_whatsapp_consentimento:=true;
   new.recuperacao_whatsapp_consentido_em:=now();
 end if;
 return new;
end;
$$;
