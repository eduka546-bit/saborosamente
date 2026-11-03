create or replace function public.atualizar_dados_cliente_admin(
  p_cliente_id uuid,
  p_nome text,
  p_telefone text,
  p_cidade text,
  p_bairro text,
  p_endereco text,
  p_numero text,
  p_complemento text,
  p_cep text
)
returns boolean language plpgsql security definer set search_path to ''
as $$
declare
  v_nome text := nullif(btrim(coalesce(p_nome, '')), '');
  v_telefone text := nullif(btrim(coalesce(p_telefone, '')), '');
  v_cidade text := nullif(btrim(coalesce(p_cidade, '')), '');
  v_bairro text := nullif(btrim(coalesce(p_bairro, '')), '');
  v_endereco text := nullif(btrim(coalesce(p_endereco, '')), '');
  v_numero text := nullif(btrim(coalesce(p_numero, '')), '');
  v_complemento text := nullif(btrim(coalesce(p_complemento, '')), '');
  v_cep text := nullif(btrim(coalesce(p_cep, '')), '');
  v_tem_endereco boolean;
begin
  if not public.has_role((select auth.uid()), 'admin'::public.app_role) then
    raise exception 'Somente administradores podem atualizar clientes' using errcode = '42501';
  end if;
  if v_nome is null or length(v_nome) < 2 or length(v_nome) > 120 then
    raise exception 'Informe um nome válido';
  end if;
  if v_telefone is null or length(regexp_replace(v_telefone, '[^0-9]', '', 'g')) < 10 or length(v_telefone) > 30 then
    raise exception 'Informe um telefone válido com DDD';
  end if;
  if coalesce(length(v_cidade), 0) > 100 or coalesce(length(v_bairro), 0) > 120
     or coalesce(length(v_endereco), 0) > 180 or coalesce(length(v_numero), 0) > 30
     or coalesce(length(v_complemento), 0) > 120 or coalesce(length(v_cep), 0) > 20 then
    raise exception 'Um dos campos do endereço está muito longo';
  end if;

  v_tem_endereco := v_cidade is not null or v_bairro is not null or v_endereco is not null
    or v_numero is not null or v_complemento is not null or v_cep is not null;
  if v_tem_endereco and (v_cidade is null or v_bairro is null or v_endereco is null or v_numero is null) then
    raise exception 'Para salvar o endereço, informe cidade, bairro, rua e número';
  end if;

  update public.profiles
  set nome = v_nome, telefone = v_telefone, cidade = v_cidade, bairro = v_bairro,
      endereco = v_endereco, numero = v_numero, complemento = v_complemento, cep = v_cep,
      updated_at = now()
  where id = p_cliente_id;
  if not found then return false; end if;

  if v_tem_endereco then
    update public.user_addresses
    set cidade = v_cidade, bairro = v_bairro, rua = v_endereco, numero = v_numero,
        complemento = v_complemento
    where user_id = p_cliente_id and is_default is true;
    if not found then
      insert into public.user_addresses (user_id, label, cidade, bairro, rua, numero, complemento, is_default)
      values (p_cliente_id, 'Endereço principal', v_cidade, v_bairro, v_endereco, v_numero, v_complemento, true);
    end if;
  end if;
  return true;
end;
$$;

revoke all on function public.atualizar_dados_cliente_admin(uuid,text,text,text,text,text,text,text,text) from public;
grant execute on function public.atualizar_dados_cliente_admin(uuid,text,text,text,text,text,text,text,text) to authenticated;
