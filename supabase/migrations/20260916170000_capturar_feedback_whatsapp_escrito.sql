create or replace function public.capturar_feedback_whatsapp_escrito()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ultima jsonb;
  texto text;
begin
  if new.aguardando_avaliacao is null then
    return new;
  end if;

  if jsonb_typeof(new.mensagens) <> 'array' or jsonb_array_length(new.mensagens) = 0 then
    return new;
  end if;

  if old.mensagens is not null
     and jsonb_typeof(old.mensagens) = 'array'
     and jsonb_array_length(new.mensagens) <= jsonb_array_length(old.mensagens) then
    return new;
  end if;

  ultima := new.mensagens -> (jsonb_array_length(new.mensagens) - 1);
  if coalesce(ultima->>'role','') <> 'user' then
    return new;
  end if;

  texto := btrim(coalesce(ultima->>'content',''));
  if texto = '' then
    return new;
  end if;

  insert into public.avaliacoes (pedido_id, telefone, nota, comentario)
  values (new.aguardando_avaliacao, new.telefone, null, texto);

  new.aguardando_avaliacao := null;
  return new;
end;
$$;

drop trigger if exists trg_capturar_feedback_whatsapp_escrito on public.whatsapp_conversas;
create trigger trg_capturar_feedback_whatsapp_escrito
before update of mensagens on public.whatsapp_conversas
for each row
execute function public.capturar_feedback_whatsapp_escrito();
